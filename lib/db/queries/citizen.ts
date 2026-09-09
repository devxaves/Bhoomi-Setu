/**
 * BhoomiSetu — Citizen Portal Query Module (Raw SQL, No ORM)
 *
 * Implements Section 5.9 of the specification:
 * - Strict single-parcel query by 14-digit ULPIN
 * - Zero PII leaks: NO claimant names, NO bank account numbers, NO contact numbers
 * - Returns only the single associated affected family's anonymized family_ref
 * - Grievance submission form directly persisting to the grievances table
 */

import { query } from "../pool";

export interface CitizenParcelLookup {
  ulpin: string;
  survey_number: string;
  village: string;
  district: string;
  state: string;
  area_hectares: number;
  land_type: string;
  project_name: string;
  project_stage: string;
  stage_label: string;
  ownership_status: string;
  // Award & Compensation
  has_award: boolean;
  award_date: string | null;
  compensation_assessed: number | null;
  compensation_status: string | null;
  disbursed_on: string | null;
  // Mutation
  mutation_status: string;
  mutation_filed_on: string | null;
  mutation_completed_on: string | null;
  // Scoped Family R&R (Anonymized family_ref ONLY)
  family_ref: string | null;
  displaced: boolean | null;
  rr_compensation_status: string | null;
  housing_status: string | null;
  employment_status: string | null;
  livelihood_restored: boolean | null;
}

export interface CitizenGrievanceInput {
  ulpin: string;
  submitted_by?: string;
  message: string;
  category?: string;
}

export interface GrievanceRecord {
  id: string;
  parcel_id: string;
  submitted_by: string | null;
  message: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
}

/**
 * Strictly scoped single-parcel lookup by 14-digit ULPIN.
 * Excludes all private landowner PII (no names, bank accounts, phone numbers).
 */
export async function lookupCitizenParcelByUlpin(
  rawUlpin: string
): Promise<CitizenParcelLookup | null> {
  const ulpin = rawUlpin.trim();
  if (!ulpin) return null;

  const sql = `
    SELECT
      p.ulpin,
      p.survey_number,
      p.village,
      p.district,
      p.state,
      p.area_hectares,
      p.land_type,
      p.ownership_status,
      COALESCE(pr.name, 'National Infrastructure Project') AS project_name,
      COALESCE(pr.current_stage, 'proposal') AS project_stage,
      (a.id IS NOT NULL) AS has_award,
      a.award_date::text AS award_date,
      a.total_compensation AS compensation_assessed,
      cp.status AS compensation_status,
      cp.disbursed_on::text AS disbursed_on,
      COALESCE(m.mutation_status, 'pending') AS mutation_status,
      m.filed_on::text AS mutation_filed_on,
      m.completed_on::text AS mutation_completed_on,
      af.family_ref,
      af.displaced,
      af.compensation_status AS rr_compensation_status,
      af.housing_status,
      af.employment_status,
      af.livelihood_restored
    FROM parcels p
    LEFT JOIN projects pr ON pr.id = p.project_id
    LEFT JOIN awards a ON a.parcel_id = p.id
    LEFT JOIN compensation_payments cp ON cp.award_id = a.id
    LEFT JOIN mutations m ON m.parcel_id = p.id
    LEFT JOIN LATERAL (
      -- Strictly limit to ONE associated family for this parcel, anonymized reference only
      SELECT family_ref, displaced, compensation_status, housing_status, employment_status, livelihood_restored
      FROM affected_families
      WHERE parcel_id = p.id
      ORDER BY created_at ASC
      LIMIT 1
    ) af ON true
    WHERE p.ulpin = $1
    LIMIT 1
  `;

  const { rows } = await query<any>(sql, [ulpin]);
  if (rows.length === 0) return null;

  const r = rows[0];

  const STAGE_LABELS: Record<string, string> = {
    proposal: "Proposal & Justification",
    sia: "Social Impact Assessment (SIA)",
    section_11: "Section 11 Preliminary Notification",
    section_19: "Section 19 Declaration of Acquisition",
    award: "Section 23 Compensation Award Declared",
    compensation: "Compensation Disbursement Underway",
    mutation: "Revenue Record Title Mutation",
    possession: "Section 38 Physical Possession",
    rr: "Rehabilitation & Resettlement Implementation",
    closed: "Acquisition Fully Closed & Completed",
  };

  return {
    ulpin: r.ulpin,
    survey_number: r.survey_number || "N/A",
    village: r.village || "N/A",
    district: r.district || "N/A",
    state: r.state || "N/A",
    area_hectares: Number(r.area_hectares || 0),
    land_type: r.land_type || "Agricultural",
    ownership_status: r.ownership_status || "clear",
    project_name: r.project_name,
    project_stage: r.project_stage,
    stage_label: STAGE_LABELS[r.project_stage] || r.project_stage,
    has_award: Boolean(r.has_award),
    award_date: r.award_date,
    compensation_assessed: r.compensation_assessed ? Number(r.compensation_assessed) : null,
    compensation_status: r.compensation_status,
    disbursed_on: r.disbursed_on,
    mutation_status: r.mutation_status,
    mutation_filed_on: r.mutation_filed_on,
    mutation_completed_on: r.mutation_completed_on,
    family_ref: r.family_ref || null,
    displaced: r.displaced !== null ? Boolean(r.displaced) : null,
    rr_compensation_status: r.rr_compensation_status,
    housing_status: r.housing_status,
    employment_status: r.employment_status,
    livelihood_restored: r.livelihood_restored !== null ? Boolean(r.livelihood_restored) : null,
  };
}

/**
 * Submit a citizen grievance tied to a parcel.
 * Writes to grievances table.
 */
export async function submitCitizenGrievance(
  input: CitizenGrievanceInput
): Promise<GrievanceRecord> {
  const parcelRes = await query<{ id: string }>(
    "SELECT id FROM parcels WHERE ulpin = $1 LIMIT 1",
    [input.ulpin.trim()]
  );

  if (parcelRes.rows.length === 0) {
    throw new Error(`ULPIN '${input.ulpin}' not found in the national registry.`);
  }

  const parcelId = parcelRes.rows[0].id;
  const messageWithCategory = input.category
    ? `[${input.category.toUpperCase()}] ${input.message.trim()}`
    : input.message.trim();

  const insertSql = `
    INSERT INTO grievances (parcel_id, submitted_by, message, status, created_at)
    VALUES ($1, $2, $3, 'open', now())
    RETURNING *
  `;

  const { rows } = await query<GrievanceRecord>(insertSql, [
    parcelId,
    input.submitted_by?.trim() || `Citizen (ULPIN ${input.ulpin})`,
    messageWithCategory,
  ]);

  return rows[0];
}
