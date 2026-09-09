/**
 * BhoomiSetu — Mutations Query Module (Raw SQL, No ORM)
 *
 * Implements legal revenue record mutation tracking:
 * pending → filed → completed
 *
 * Distinct from physical possession:
 * Possession (§38) confers physical control to the land-requiring body,
 * but revenue mutation transfers legal title in state Land Records (e.g. 7/12 extract / RoR).
 * In Indian land acquisition, mutation lag frequently spans years after possession.
 */

import { query, withTransaction } from "../pool";

export interface Mutation {
  id: string;
  parcel_id: string;
  mutation_status: "pending" | "filed" | "completed";
  filed_on: string | null;
  completed_on: string | null;
  created_at: string;
  // Joined fields
  project_id?: string;
  project_name?: string;
  ulpin?: string;
  survey_number?: string;
  village?: string;
  district?: string;
  state?: string;
  area_hectares?: number;
  ownership_status?: string;
  project_stage?: string; // e.g. possession, closed
}

export interface MutationMetrics {
  totalParcels: number;
  completedCount: number;
  filedCount: number;
  pendingCount: number;
  mutationCompletionPct: number;
  lagCount: number; // Parcels possessed but mutation not completed
}

/**
 * Validates legal mutation status transition.
 */
export function validateMutationTransition(
  fromStatus: "pending" | "filed" | "completed",
  toStatus: "pending" | "filed" | "completed"
): { allowed: boolean; message?: string } {
  if (fromStatus === toStatus) return { allowed: true };
  if (fromStatus === "pending" && toStatus === "filed") return { allowed: true };
  if (fromStatus === "filed" && toStatus === "completed") return { allowed: true };
  // Allow direct pending -> completed if revenue department auto-mutated
  if (fromStatus === "pending" && toStatus === "completed") return { allowed: true };

  return {
    allowed: false,
    message: `Invalid mutation transition from '${fromStatus}' to '${toStatus}'. Legal sequence is pending → filed → completed.`,
  };
}

/**
 * List all mutations for a project with joined parcel & possession stage metadata.
 */
export async function getMutationsByProject(projectId: string): Promise<Mutation[]> {
  const sql = `
    SELECT
      m.id,
      m.parcel_id,
      m.mutation_status,
      m.filed_on::text,
      m.completed_on::text,
      m.created_at::text,
      p.project_id,
      pr.name AS project_name,
      pr.current_stage AS project_stage,
      p.ulpin,
      p.survey_number,
      p.village,
      p.district,
      p.state,
      p.area_hectares,
      p.ownership_status
    FROM parcels p
    LEFT JOIN mutations m ON m.parcel_id = p.id
    JOIN projects pr ON pr.id = p.project_id
    WHERE p.project_id = $1
    ORDER BY p.survey_number ASC
  `;
  const { rows } = await query<Mutation>(sql, [projectId]);

  // Ensure every parcel has at least a virtual or created mutation record
  return rows.map((r) => ({
    ...r,
    mutation_status: r.mutation_status || "pending",
  }));
}

/**
 * Update or upsert mutation status for a parcel.
 * Records before/after state to audit_log.
 */
export async function updateMutationStatus(
  parcelId: string,
  targetStatus: "pending" | "filed" | "completed",
  actorId?: string | null,
  options?: {
    filedOn?: string;
    completedOn?: string;
  }
): Promise<Mutation> {
  return withTransaction(async (client) => {
    // 1. Check existing mutation row
    const curRes = await client.query<Mutation>(
      `SELECT * FROM mutations WHERE parcel_id = $1 FOR UPDATE`,
      [parcelId]
    );

    const today = new Date().toISOString().split("T")[0];
    let updated: Mutation;
    let beforeState: any = null;

    if (curRes.rows.length === 0) {
      // Insert new mutation record
      const filedOn = targetStatus === "filed" || targetStatus === "completed" ? (options?.filedOn || today) : null;
      const completedOn = targetStatus === "completed" ? (options?.completedOn || today) : null;

      const insSql = `
        INSERT INTO mutations (parcel_id, mutation_status, filed_on, completed_on)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const insRes = await client.query<Mutation>(insSql, [
        parcelId,
        targetStatus,
        filedOn,
        completedOn,
      ]);
      updated = insRes.rows[0];
    } else {
      const current = curRes.rows[0];
      beforeState = current;
      const val = validateMutationTransition(current.mutation_status, targetStatus);
      if (!val.allowed) {
        throw new Error(val.message);
      }

      const filedOn = targetStatus === "filed" ? (options?.filedOn || current.filed_on || today) : current.filed_on;
      const completedOn = targetStatus === "completed" ? (options?.completedOn || today) : null;

      const upSql = `
        UPDATE mutations
        SET mutation_status = $1,
            filed_on = $2,
            completed_on = $3
        WHERE parcel_id = $4
        RETURNING *
      `;
      const upRes = await client.query<Mutation>(upSql, [
        targetStatus,
        filedOn,
        completedOn,
        parcelId,
      ]);
      updated = upRes.rows[0];
    }

    // 2. Audit log
    const auditSql = `
      INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
      VALUES ($1, 'mutation', $2, $3, $4, $5)
    `;
    await client.query(auditSql, [
      actorId ?? null,
      updated.id,
      `MUTATION_STATUS_${targetStatus.toUpperCase()}`,
      JSON.stringify(beforeState),
      JSON.stringify(updated),
    ]);

    return updated;
  });
}

/**
 * Aggregate mutation metrics for a project (or national if no projectId).
 */
export async function getMutationMetrics(projectId?: string): Promise<MutationMetrics> {
  const sql = `
    SELECT
      COUNT(p.id)::int AS total_parcels,
      COUNT(m.id) FILTER (WHERE m.mutation_status = 'completed')::int AS completed_count,
      COUNT(m.id) FILTER (WHERE m.mutation_status = 'filed')::int AS filed_count,
      COUNT(p.id) FILTER (WHERE m.mutation_status IS NULL OR m.mutation_status = 'pending')::int AS pending_count,
      COUNT(p.id) FILTER (
        WHERE pr.current_stage IN ('possession', 'rr', 'closed')
          AND (m.mutation_status IS NULL OR m.mutation_status != 'completed')
      )::int AS lag_count
    FROM parcels p
    JOIN projects pr ON pr.id = p.project_id
    LEFT JOIN mutations m ON m.parcel_id = p.id
    ${projectId ? "WHERE p.project_id = $1" : ""}
  `;

  const { rows } = await query<any>(sql, projectId ? [projectId] : []);
  const r = rows[0] || {};
  const total = Number(r.total_parcels || 0);
  const completed = Number(r.completed_count || 0);
  const filed = Number(r.filed_count || 0);
  const pending = Number(r.pending_count || 0);
  const lag = Number(r.lag_count || 0);

  return {
    totalParcels: total,
    completedCount: completed,
    filedCount: filed,
    pendingCount: pending,
    mutationCompletionPct: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
    lagCount: lag,
  };
}
