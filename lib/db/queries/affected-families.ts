/**
 * BhoomiSetu — Affected Families (R&R) Query Module (Raw SQL, No ORM)
 *
 * Implements per-family Rehabilitation & Resettlement tracking under RFCTLARR Act, 2013.
 * Editable per-family (not aggregate only), rolling up into the project R&R completion
 * percentage consumed by lib/risk-engine.ts.
 */

import { query, withTransaction } from "../pool";

export interface AffectedFamily {
  id: string;
  parcel_id: string;
  family_ref: string;
  displaced: boolean;
  compensation_status: "pending" | "assessed" | "sanctioned" | "disbursed";
  housing_status: "pending" | "allotted" | "completed";
  employment_status: "pending" | "offered" | "completed";
  livelihood_restored: boolean;
  created_at: string;
  // Joined fields
  project_id?: string;
  ulpin?: string;
  survey_number?: string;
  village?: string;
  district?: string;
}

export interface RRRollupSummary {
  totalFamilies: number;
  restoredFamilies: number;
  pendingFamilies: number;
  completionPct: number;
  incompletenessPct: number;
  displacedCount: number;
  compensationDisbursedCount: number;
  housingCompletedCount: number;
  employmentCompletedCount: number;
}

/**
 * List all affected families for a project with joined parcel information.
 */
export async function getAffectedFamiliesByProject(projectId: string): Promise<AffectedFamily[]> {
  const sql = `
    SELECT
      af.*,
      p.project_id,
      p.ulpin,
      p.survey_number,
      p.village,
      p.district
    FROM affected_families af
    JOIN parcels p ON p.id = af.parcel_id
    WHERE p.project_id = $1
    ORDER BY af.family_ref ASC
  `;
  const { rows } = await query<AffectedFamily>(sql, [projectId]);
  return rows;
}

/**
 * Get project R&R completion rollup.
 * Exactly matches the rollup calculation that lib/risk-engine.ts consumes in Rule 5!
 */
export async function getProjectRRRollup(projectId: string): Promise<RRRollupSummary> {
  const sql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE af.livelihood_restored = true)::int AS restored,
      COUNT(*) FILTER (WHERE af.displaced = true)::int AS displaced,
      COUNT(*) FILTER (WHERE af.compensation_status = 'disbursed')::int AS comp_disbursed,
      COUNT(*) FILTER (WHERE af.housing_status = 'completed')::int AS housing_completed,
      COUNT(*) FILTER (WHERE af.employment_status = 'completed')::int AS emp_completed
    FROM affected_families af
    JOIN parcels p ON p.id = af.parcel_id
    WHERE p.project_id = $1
  `;

  const { rows } = await query<any>(sql, [projectId]);
  const r = rows[0] || {};
  const total = Number(r.total || 0);
  const restored = Number(r.restored || 0);
  const pending = total - restored;
  const completionPct = total > 0 ? Math.round((restored / total) * 1000) / 10 : 100;
  const incompletenessPct = total > 0 ? Math.round((pending / total) * 1000) / 10 : 0;

  return {
    totalFamilies: total,
    restoredFamilies: restored,
    pendingFamilies: pending,
    completionPct,
    incompletenessPct,
    displacedCount: Number(r.displaced || 0),
    compensationDisbursedCount: Number(r.comp_disbursed || 0),
    housingCompletedCount: Number(r.housing_completed || 0),
    employmentCompletedCount: Number(r.emp_completed || 0),
  };
}

/**
 * Update individual affected family record.
 * Writes before/after state to audit_log.
 */
export async function updateAffectedFamily(
  familyId: string,
  updates: Partial<{
    compensation_status: string;
    housing_status: string;
    employment_status: string;
    livelihood_restored: boolean;
    displaced: boolean;
  }>,
  actorId?: string | null
): Promise<AffectedFamily> {
  return withTransaction(async (client) => {
    // 1. Fetch current row
    const curRes = await client.query<AffectedFamily>(
      `SELECT * FROM affected_families WHERE id = $1 FOR UPDATE`,
      [familyId]
    );

    if (curRes.rows.length === 0) {
      throw new Error(`Affected family record '${familyId}' not found.`);
    }
    const current = curRes.rows[0];

    const compStatus = updates.compensation_status ?? current.compensation_status;
    const housingStatus = updates.housing_status ?? current.housing_status;
    const empStatus = updates.employment_status ?? current.employment_status;
    const restored =
      updates.livelihood_restored !== undefined
        ? updates.livelihood_restored
        : current.livelihood_restored;
    const displaced =
      updates.displaced !== undefined ? updates.displaced : current.displaced;

    // 2. Update row
    const upSql = `
      UPDATE affected_families
      SET compensation_status = $1,
          housing_status = $2,
          employment_status = $3,
          livelihood_restored = $4,
          displaced = $5
      WHERE id = $6
      RETURNING *
    `;

    const upRes = await client.query<AffectedFamily>(upSql, [
      compStatus,
      housingStatus,
      empStatus,
      restored,
      displaced,
      familyId,
    ]);
    const updated = upRes.rows[0];

    // 3. Log to audit_log
    const auditSql = `
      INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
      VALUES ($1, 'affected_family', $2, 'UPDATE_AFFECTED_FAMILY_RR', $3, $4)
    `;
    await client.query(auditSql, [
      actorId ?? null,
      familyId,
      JSON.stringify(current),
      JSON.stringify(updated),
    ]);

    return updated;
  });
}
