/**
 * BhoomiSetu — Projects Query Module (Raw SQL)
 * All project-related database operations.
 */

import { query, withTransaction } from '../pool';

// ============================================================
// Types
// ============================================================
export interface Project {
  id: string;
  name: string;
  land_requiring_body: string;
  ministry: string | null;
  state: string;
  district: string;
  project_type: string | null;
  alignment_geojson: object | null;
  current_stage: string;
  stage_started_at: string;
  status_flag: string;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  name: string;
  land_requiring_body: string;
  ministry?: string;
  state: string;
  district: string;
  project_type?: string;
  alignment_geojson?: object;
}

export const VALID_STAGES = [
  'proposal', 'sia', 'section_11', 'section_19', 'award',
  'compensation', 'mutation', 'possession', 'rr', 'closed'
] as const;

export type ProjectStage = typeof VALID_STAGES[number];

// ============================================================
// Pagination types
// ============================================================

export interface PaginationParams {
  page?: number;    // 1-indexed, default 1
  limit?: number;   // default 50, max 200
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** Lightweight project summary for list views (excludes heavy alignment_geojson) */
export interface ProjectSummary {
  id: string;
  name: string;
  land_requiring_body: string;
  ministry: string | null;
  state: string;
  district: string;
  project_type: string | null;
  current_stage: string;
  stage_started_at: string;
  status_flag: string;
  risk_score: number;
  parcel_count: number;
  ulpins: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// Queries
// ============================================================

function resolvePagination(params?: PaginationParams): { page: number; limit: number; offset: number } {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(200, Math.max(1, params?.limit ?? 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** List projects with pagination, optionally filtered by state/district/status/search */
export async function listProjects(
  filters?: { state?: string; district?: string; status_flag?: string; search?: string },
  pagination?: PaginationParams
): Promise<PaginatedResult<ProjectSummary>> {
  const { page, limit, offset } = resolvePagination(pagination);

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters?.state) {
    conditions.push(`state = $${paramIndex++}`);
    params.push(filters.state);
  }
  if (filters?.district) {
    conditions.push(`district = $${paramIndex++}`);
    params.push(filters.district);
  }
  if (filters?.status_flag) {
    conditions.push(`status_flag = $${paramIndex++}`);
    params.push(filters.status_flag);
  }
  if (filters?.search) {
    conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(district) LIKE $${paramIndex} OR LOWER(land_requiring_body) LIKE $${paramIndex})`);
    params.push(`%${filters.search.toLowerCase()}%`);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM projects ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch page with parcel count and ULPINs
  const dataParams = [...params, limit, offset];
  const { rows } = await query<{ id: string; name: string; land_requiring_body: string; ministry: string | null; state: string; district: string; project_type: string | null; current_stage: string; stage_started_at: string; status_flag: string; risk_score: number; parcel_count: number; ulpins: string[]; created_at: string; updated_at: string }>(
    `SELECT p.id, p.name, p.land_requiring_body, p.ministry, p.state, p.district,
            p.project_type, p.current_stage, p.stage_started_at, p.status_flag,
            p.risk_score, p.created_at, p.updated_at,
            COALESCE(pc.parcel_count, 0)::int AS parcel_count,
            COALESCE(pc.ulpins, '{}') AS ulpins
     FROM projects p
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS parcel_count,
              ARRAY_AGG(ulpin) FILTER (WHERE ulpin IS NOT NULL) AS ulpins
       FROM parcels WHERE project_id = p.id
     ) pc ON true
     ${where}
     ORDER BY p.updated_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    dataParams
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/** Get a single project by ID */
export async function getProjectById(id: string): Promise<Project | null> {
  const { rows } = await query<Project>(
    'SELECT * FROM projects WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/** Create a new project */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { rows } = await query<Project>(
    `INSERT INTO projects (name, land_requiring_body, ministry, state, district, project_type, alignment_geojson)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name,
      input.land_requiring_body,
      input.ministry || null,
      input.state,
      input.district,
      input.project_type || null,
      input.alignment_geojson ? JSON.stringify(input.alignment_geojson) : null,
    ]
  );
  return rows[0];
}

/** Advance a project to the next workflow stage (with audit logging) */
export async function updateProjectStage(
  projectId: string,
  newStage: ProjectStage,
  actorId?: string
): Promise<Project> {
  return withTransaction(async (client) => {
    // Get current state for audit
    const { rows: before } = await client.query<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (before.length === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const oldProject = before[0];

    // Update stage
    const { rows: after } = await client.query<Project>(
      `UPDATE projects
       SET current_stage = $1, stage_started_at = now(), updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [newStage, projectId]
    );

    // Write audit log
    await client.query(
      `INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
       VALUES ($1, 'project', $2, $3, $4, $5)`,
      [
        actorId || null,
        projectId,
        `stage_transition:${oldProject.current_stage}→${newStage}`,
        JSON.stringify({ current_stage: oldProject.current_stage, stage_started_at: oldProject.stage_started_at }),
        JSON.stringify({ current_stage: newStage, stage_started_at: after[0].stage_started_at }),
      ]
    );

    return after[0];
  });
}

/** Get projects grouped by district (for dashboard) */
export async function getProjectsByDistrict(): Promise<{ district: string; count: number }[]> {
  const { rows } = await query<{ district: string; count: string }>(
    `SELECT district, COUNT(*)::text as count FROM projects GROUP BY district ORDER BY count DESC`
  );
  return rows.map(r => ({ district: r.district, count: parseInt(r.count, 10) }));
}

/** Get projects grouped by status flag */
export async function getProjectsByStatusFlag(): Promise<{ status_flag: string; count: number }[]> {
  const { rows } = await query<{ status_flag: string; count: string }>(
    `SELECT status_flag, COUNT(*)::text as count FROM projects GROUP BY status_flag ORDER BY count DESC`
  );
  return rows.map(r => ({ status_flag: r.status_flag, count: parseInt(r.count, 10) }));
}

/** Update project status flag (used by deadline scanner) */
export async function updateProjectStatusFlag(
  projectId: string,
  statusFlag: 'green' | 'amber' | 'red' | 'lapsed'
): Promise<void> {
  await query(
    `UPDATE projects SET status_flag = $1, updated_at = now() WHERE id = $2`,
    [statusFlag, projectId]
  );
}
