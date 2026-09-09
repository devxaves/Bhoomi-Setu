/**
 * BhoomiSetu — Parcels Query Module (Raw SQL)
 * All parcel-related database operations, including ULPIN lookups.
 */

import { query } from '../pool';

// ============================================================
// Types
// ============================================================
export interface Parcel {
  id: string;
  ulpin: string;
  project_id: string | null;
  survey_number: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  area_hectares: number | null;
  land_type: string | null;
  geometry_geojson: object;
  ownership_status: string;
  litigation_flag: boolean;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface CreateParcelInput {
  ulpin: string;
  project_id?: string;
  survey_number?: string;
  village?: string;
  district?: string;
  state?: string;
  area_hectares?: number;
  land_type?: string;
  geometry_geojson: object;
  ownership_status?: string;
  litigation_flag?: boolean;
}

// ============================================================
// Queries
// ============================================================

/** List parcels, optionally filtered */
export async function listParcels(filters?: {
  project_id?: string;
  district?: string;
  state?: string;
  ownership_status?: string;
}): Promise<Parcel[]> {
  const conditions: string[] = [];
  const params: (string)[] = [];
  let paramIndex = 1;

  if (filters?.project_id) {
    conditions.push(`project_id = $${paramIndex++}`);
    params.push(filters.project_id);
  }
  if (filters?.district) {
    conditions.push(`district = $${paramIndex++}`);
    params.push(filters.district);
  }
  if (filters?.state) {
    conditions.push(`state = $${paramIndex++}`);
    params.push(filters.state);
  }
  if (filters?.ownership_status) {
    conditions.push(`ownership_status = $${paramIndex++}`);
    params.push(filters.ownership_status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM parcels ${where} ORDER BY updated_at DESC`;

  const { rows } = await query<Parcel>(sql, params);
  return rows;
}

/** Get a parcel by ULPIN (14-digit Bhu-Aadhaar) */
export async function getParcelByUlpin(ulpin: string): Promise<Parcel | null> {
  const { rows } = await query<Parcel>(
    'SELECT * FROM parcels WHERE ulpin = $1',
    [ulpin]
  );
  return rows[0] || null;
}

/** Get a parcel by ID */
export async function getParcelById(id: string): Promise<Parcel | null> {
  const { rows } = await query<Parcel>(
    'SELECT * FROM parcels WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/** List parcels by project */
export async function listParcelsByProject(projectId: string): Promise<Parcel[]> {
  const { rows } = await query<Parcel>(
    'SELECT * FROM parcels WHERE project_id = $1 ORDER BY ulpin',
    [projectId]
  );
  return rows;
}

/** Create a new parcel */
export async function createParcel(input: CreateParcelInput): Promise<Parcel> {
  const { rows } = await query<Parcel>(
    `INSERT INTO parcels (
      ulpin, project_id, survey_number, village, district, state,
      area_hectares, land_type, geometry_geojson, ownership_status, litigation_flag
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      input.ulpin,
      input.project_id || null,
      input.survey_number || null,
      input.village || null,
      input.district || null,
      input.state || null,
      input.area_hectares || null,
      input.land_type || null,
      JSON.stringify(input.geometry_geojson),
      input.ownership_status || 'clear',
      input.litigation_flag || false,
    ]
  );
  return rows[0];
}

/**
 * Find parcels that spatially intersect a given GeoJSON geometry.
 *
 * Since we're using jsonb (not PostGIS geometry columns), this does a
 * bounding-box pre-filter in SQL, then precise intersection should be done
 * in application code via turf.js.
 *
 * For now: returns all parcels in the same project or district as a
 * starting point. The GIS engine (Phase 2) will add turf.js precision.
 */
export async function findIntersectingParcels(
  _alignmentGeoJSON: object,
  filters?: { district?: string; state?: string }
): Promise<Parcel[]> {
  // Phase 2 will implement true spatial intersection via turf.js
  // For now, return parcels from matching district/state as a placeholder
  const conditions: string[] = [];
  const params: (string)[] = [];
  let paramIndex = 1;

  if (filters?.district) {
    conditions.push(`district = $${paramIndex++}`);
    params.push(filters.district);
  }
  if (filters?.state) {
    conditions.push(`state = $${paramIndex++}`);
    params.push(filters.state);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM parcels ${where} ORDER BY ulpin`;

  const { rows } = await query<Parcel>(sql, params);
  return rows;
}

/** Get parcels grouped by ownership status (for dashboard) */
export async function getParcelsByOwnershipStatus(): Promise<{ ownership_status: string; count: number }[]> {
  const { rows } = await query<{ ownership_status: string; count: string }>(
    `SELECT ownership_status, COUNT(*)::text as count FROM parcels GROUP BY ownership_status ORDER BY count DESC`
  );
  return rows.map(r => ({ ownership_status: r.ownership_status, count: parseInt(r.count, 10) }));
}

/** Get count of parcels with litigation flags */
export async function getLitigationCount(): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM parcels WHERE litigation_flag = true`
  );
  return parseInt(rows[0].count, 10);
}
