/**
 * BhoomiSetu — Risk Scores Query Module (Raw SQL, No ORM)
 *
 * Handles reading and persisting computed risk scores and structured reasons.
 */

import { query, withTransaction } from '../pool';

export interface RiskScoreRecord {
  id: string;
  entity_type: 'project' | 'parcel';
  entity_id: string;
  score: number;
  reasons: any[];
  computed_at: string;
}

export interface EntityRiskSummary {
  entity_id: string;
  entity_type: 'project' | 'parcel';
  title: string;
  subtitle: string | null;
  district: string | null;
  state: string | null;
  current_stage?: string;
  status_flag?: string;
  ownership_status?: string;
  litigation_flag?: boolean;
  score: number;
  reasons: any[];
  computed_at: string;
}

/**
 * Save computed risk score and structured reasons.
 * Also synchronises the risk_score column on the target table (projects or parcels).
 */
export async function saveRiskScore(
  entityType: 'project' | 'parcel',
  entityId: string,
  score: number,
  reasons: unknown[]
): Promise<RiskScoreRecord> {
  return withTransaction(async (client) => {
    // 1. Insert historical risk_scores record
    const insertSql = `
      INSERT INTO risk_scores (entity_type, entity_id, score, reasons, computed_at)
      VALUES ($1, $2, $3, $4, now())
      RETURNING *
    `;
    const insertRes = await client.query<RiskScoreRecord>(insertSql, [
      entityType,
      entityId,
      score,
      JSON.stringify(reasons),
    ]);

    // 2. Update entity table risk_score column
    if (entityType === 'project') {
      await client.query(
        `UPDATE projects SET risk_score = $1, updated_at = now() WHERE id = $2`,
        [score, entityId]
      );
    } else if (entityType === 'parcel') {
      await client.query(
        `UPDATE parcels SET risk_score = $1, updated_at = now() WHERE id = $2`,
        [score, entityId]
      );
    }

    return insertRes.rows[0];
  });
}

/**
 * Get the latest risk score for a specific entity.
 */
export async function getLatestRiskScore(
  entityType: 'project' | 'parcel',
  entityId: string
): Promise<RiskScoreRecord | null> {
  const sql = `
    SELECT *
    FROM risk_scores
    WHERE entity_type = $1 AND entity_id = $2
    ORDER BY computed_at DESC
    LIMIT 1
  `;
  const { rows } = await query<RiskScoreRecord>(sql, [entityType, entityId]);
  return rows[0] ?? null;
}

/**
 * Fetch all entities (projects & parcels) with their latest computed risk score and reasons.
 * Used to populate the /risk table.
 */
export async function getAllLatestRiskScores(): Promise<EntityRiskSummary[]> {
  const sql = `
    WITH project_risks AS (
      SELECT
        p.id AS entity_id,
        'project'::text AS entity_type,
        p.name AS title,
        COALESCE(p.project_type, 'Infrastructure') AS subtitle,
        p.district,
        p.state,
        p.current_stage,
        p.status_flag,
        NULL::text AS ownership_status,
        NULL::boolean AS litigation_flag,
        COALESCE(rs.score, p.risk_score, 0)::float AS score,
        COALESCE(rs.reasons, '[]'::jsonb) AS reasons,
        COALESCE(rs.computed_at, p.updated_at, p.created_at) AS computed_at
      FROM projects p
      LEFT JOIN LATERAL (
        SELECT score, reasons, computed_at
        FROM risk_scores
        WHERE entity_type = 'project' AND entity_id = p.id
        ORDER BY computed_at DESC
        LIMIT 1
      ) rs ON true
    ),
    parcel_risks AS (
      SELECT
        par.id AS entity_id,
        'parcel'::text AS entity_type,
        COALESCE(par.ulpin, 'Parcel ' || par.survey_number) AS title,
        ('Survey: ' || COALESCE(par.survey_number, 'N/A') || ' • ' || COALESCE(par.village, 'N/A'))::text AS subtitle,
        par.district,
        par.state,
        NULL::text AS current_stage,
        NULL::text AS status_flag,
        par.ownership_status,
        par.litigation_flag,
        COALESCE(rs.score, par.risk_score, 0)::float AS score,
        COALESCE(rs.reasons, '[]'::jsonb) AS reasons,
        COALESCE(rs.computed_at, par.updated_at, par.created_at) AS computed_at
      FROM parcels par
      LEFT JOIN LATERAL (
        SELECT score, reasons, computed_at
        FROM risk_scores
        WHERE entity_type = 'parcel' AND entity_id = par.id
        ORDER BY computed_at DESC
        LIMIT 1
      ) rs ON true
    )
    SELECT * FROM project_risks
    UNION ALL
    SELECT * FROM parcel_risks
    ORDER BY score DESC, computed_at DESC
  `;

  const { rows } = await query<EntityRiskSummary>(sql);
  return rows;
}

/**
 * Get historical risk scores for an entity.
 */
export async function getRiskScoreHistory(
  entityType: 'project' | 'parcel',
  entityId: string,
  limit = 10
): Promise<RiskScoreRecord[]> {
  const sql = `
    SELECT *
    FROM risk_scores
    WHERE entity_type = $1 AND entity_id = $2
    ORDER BY computed_at DESC
    LIMIT $3
  `;
  const { rows } = await query<RiskScoreRecord>(sql, [entityType, entityId, limit]);
  return rows;
}
