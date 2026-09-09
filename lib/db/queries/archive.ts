/**
 * BhoomiSetu — Digital Archive Query Module (Raw SQL, No ORM)
 *
 * Implements Section 5.8 of the specification:
 * - Multi-parameter search across projects, parcels, and awards
 * - Paginated results with total match count
 * - RFC 4180 CSV export generation
 */

import { query } from "../pool";

export interface ArchiveSearchFilters {
  entityType?: "all" | "projects" | "parcels" | "awards";
  query?: string;
  state?: string;
  district?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ArchiveRecord {
  id: string;
  entityType: "project" | "parcel" | "award";
  referenceCode: string; // project name, ULPIN, or award ID
  title: string;
  secondaryInfo: string;
  state: string;
  district: string;
  status: string;
  riskScore: number;
  amountOrArea: string;
  createdAt: string;
}

export interface ArchiveSearchResult {
  records: ArchiveRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function searchArchive(filters: ArchiveSearchFilters): Promise<ArchiveSearchResult> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 15));
  const offset = (page - 1) * limit;

  const entityType = filters.entityType || "all";
  const searchQ = filters.query?.trim() ? `%${filters.query.trim()}%` : null;

  const projectSql = `
    SELECT
      p.id,
      'project'::text AS "entityType",
      p.id::text AS "referenceCode",
      p.name AS title,
      (p.land_requiring_body || ' · ' || COALESCE(p.project_type, 'Infrastructure'))::text AS "secondaryInfo",
      p.state,
      p.district,
      p.current_stage AS status,
      COALESCE(p.risk_score, 0)::float AS "riskScore",
      'Stage: ' || p.current_stage AS "amountOrArea",
      p.created_at::text AS "createdAt"
    FROM projects p
    WHERE ($1::text IS NULL OR p.name ILIKE $1 OR p.land_requiring_body ILIKE $1)
      AND ($2::text IS NULL OR p.state = $2)
      AND ($3::text IS NULL OR p.district = $3)
      AND ($4::text IS NULL OR p.current_stage = $4 OR p.status_flag = $4)
  `;

  const parcelSql = `
    SELECT
      par.id,
      'parcel'::text AS "entityType",
      COALESCE(par.ulpin, 'Survey: ' || par.survey_number)::text AS "referenceCode",
      ('Parcel ' || COALESCE(par.survey_number, 'N/A') || ' (' || COALESCE(par.village, 'N/A') || ')')::text AS title,
      ('ULPIN: ' || COALESCE(par.ulpin, 'Pending') || ' · ' || COALESCE(par.land_type, 'Agricultural'))::text AS "secondaryInfo",
      par.state,
      par.district,
      par.ownership_status AS status,
      COALESCE(par.risk_score, 0)::float AS "riskScore",
      COALESCE(par.area_hectares::text, '0') || ' ha' AS "amountOrArea",
      par.created_at::text AS "createdAt"
    FROM parcels par
    WHERE ($1::text IS NULL OR par.ulpin ILIKE $1 OR par.survey_number ILIKE $1 OR par.village ILIKE $1)
      AND ($2::text IS NULL OR par.state = $2)
      AND ($3::text IS NULL OR par.district = $3)
      AND ($4::text IS NULL OR par.ownership_status = $4)
  `;

  const awardSql = `
    SELECT
      a.id,
      'award'::text AS "entityType",
      a.id::text AS "referenceCode",
      ('Award on ' || a.award_date::text || ' · ' || p.ulpin)::text AS title,
      ('Market Value: ₹' || a.market_value::text || ' + Solatium')::text AS "secondaryInfo",
      p.state,
      p.district,
      COALESCE(cp.status, 'assessed')::text AS status,
      COALESCE(p.risk_score, 0)::float AS "riskScore",
      '₹' || COALESCE(a.total_compensation::text, '0') AS "amountOrArea",
      a.created_at::text AS "createdAt"
    FROM awards a
    JOIN parcels p ON p.id = a.parcel_id
    LEFT JOIN compensation_payments cp ON cp.award_id = a.id
    WHERE ($1::text IS NULL OR p.ulpin ILIKE $1 OR p.survey_number ILIKE $1)
      AND ($2::text IS NULL OR p.state = $2)
      AND ($3::text IS NULL OR p.district = $3)
      AND ($4::text IS NULL OR cp.status = $4)
  `;

  let unionSql = "";
  if (entityType === "projects") unionSql = projectSql;
  else if (entityType === "parcels") unionSql = parcelSql;
  else if (entityType === "awards") unionSql = awardSql;
  else unionSql = `${projectSql} UNION ALL ${parcelSql} UNION ALL ${awardSql}`;

  const countSql = `SELECT COUNT(*)::int AS total FROM (${unionSql}) AS combined`;
  const pagedSql = `
    SELECT * FROM (${unionSql}) AS combined
    ORDER BY "createdAt" DESC
    LIMIT $5 OFFSET $6
  `;

  const stateVal = filters.state?.trim() || null;
  const distVal = filters.district?.trim() || null;
  const statusVal = filters.status?.trim() || null;

  const countRes = await query<{ total: number }>(countSql, [searchQ, stateVal, distVal, statusVal]);
  const total = Number(countRes.rows[0]?.total || 0);

  const pagedRes = await query<ArchiveRecord>(pagedSql, [
    searchQ,
    stateVal,
    distVal,
    statusVal,
    limit,
    offset,
  ]);

  return {
    records: pagedRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Generates an RFC 4180 compliant CSV stream/string.
 */
export async function generateArchiveCSV(filters: ArchiveSearchFilters): Promise<string> {
  const result = await searchArchive({ ...filters, page: 1, limit: 1000 });
  const headers = [
    "Entity Type",
    "Reference Code",
    "Title / Description",
    "Secondary Info",
    "State",
    "District",
    "Status",
    "Risk Score",
    "Amount / Area",
    "Created Date",
  ];

  const escapeCSV = (val: any) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = result.records.map((r) => [
    escapeCSV(r.entityType),
    escapeCSV(r.referenceCode),
    escapeCSV(r.title),
    escapeCSV(r.secondaryInfo),
    escapeCSV(r.state),
    escapeCSV(r.district),
    escapeCSV(r.status),
    escapeCSV(r.riskScore),
    escapeCSV(r.amountOrArea),
    escapeCSV(r.createdAt),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
