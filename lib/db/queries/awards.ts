/**
 * BhoomiSetu — Awards Query Module (Raw SQL, No ORM)
 *
 * Implements Section 5.6 and statutory Sections 26/30 of RFCTLARR Act, 2013:
 * Total Compensation = Market Value + Solatium (100%) + Additional Amount (12% per annum)
 */

import { query, withTransaction } from "../pool";

export interface Award {
  id: string;
  project_id: string;
  parcel_id: string;
  award_date: string;
  market_value: number;
  solatium_pct: number;
  additional_amount_pct: number;
  total_compensation: number;
  document_id: string | null;
  created_at: string;
  // Joined fields
  ulpin?: string;
  survey_number?: string;
  village?: string;
  district?: string;
  state?: string;
  payment_status?: string;
  amount_disbursed?: number;
  mock_pfms_ref?: string | null;
}

export interface CreateAwardInput {
  project_id: string;
  parcel_id: string;
  award_date: string;
  market_value: number;
  solatium_pct?: number; // default 100
  additional_amount_pct?: number; // default 12
  document_id?: string | null;
  actor_id?: string | null;
}

import { calculateAwardBreakdown } from "@/lib/statutory-math";
export { calculateAwardBreakdown };

/**
 * Create an award and automatically initialize its initial compensation_payments record.
 * Writes to audit_log inside a single transaction.
 */
export async function createAward(input: CreateAwardInput): Promise<Award> {
  const breakdown = calculateAwardBreakdown(
    input.market_value,
    input.solatium_pct ?? 100,
    input.additional_amount_pct ?? 12
  );

  return withTransaction(async (client) => {
    // 1. Insert Award
    const insertAwardSql = `
      INSERT INTO awards (
        project_id, parcel_id, award_date, market_value,
        solatium_pct, additional_amount_pct, total_compensation, document_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const awardRes = await client.query<Award>(insertAwardSql, [
      input.project_id,
      input.parcel_id,
      input.award_date,
      breakdown.marketValue,
      breakdown.solatiumPct,
      breakdown.additionalAmountPct,
      breakdown.totalCompensation,
      input.document_id ?? null,
    ]);
    const createdAward = awardRes.rows[0];

    // 2. Initialize Compensation Payment row (assessed status)
    const insertPaymentSql = `
      INSERT INTO compensation_payments (
        award_id, amount_assessed, amount_disbursed, status
      )
      VALUES ($1, $2, 0, 'assessed')
      RETURNING id
    `;
    await client.query(insertPaymentSql, [createdAward.id, breakdown.totalCompensation]);

    // 3. Log to audit_log
    const auditSql = `
      INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
      VALUES ($1, 'award', $2, 'CREATE_AWARD', NULL, $3)
    `;
    await client.query(auditSql, [
      input.actor_id ?? null,
      createdAward.id,
      JSON.stringify({
        project_id: input.project_id,
        parcel_id: input.parcel_id,
        breakdown,
      }),
    ]);

    return createdAward;
  });
}

/**
 * List all awards for a project, joined with parcel metadata and payment status.
 */
export async function getAwardsByProject(projectId: string): Promise<Award[]> {
  const sql = `
    SELECT
      a.*,
      p.ulpin,
      p.survey_number,
      p.village,
      p.district,
      p.state,
      cp.status AS payment_status,
      cp.amount_disbursed,
      cp.mock_pfms_ref
    FROM awards a
    JOIN parcels p ON p.id = a.parcel_id
    LEFT JOIN compensation_payments cp ON cp.award_id = a.id
    WHERE a.project_id = $1
    ORDER BY a.created_at DESC
  `;
  const { rows } = await query<Award>(sql, [projectId]);
  return rows;
}

/**
 * Get single award by ID.
 */
export async function getAwardById(awardId: string): Promise<Award | null> {
  const sql = `
    SELECT
      a.*,
      p.ulpin,
      p.survey_number,
      p.village,
      p.district,
      p.state,
      cp.status AS payment_status,
      cp.amount_disbursed,
      cp.mock_pfms_ref
    FROM awards a
    JOIN parcels p ON p.id = a.parcel_id
    LEFT JOIN compensation_payments cp ON cp.award_id = a.id
    WHERE a.id = $1
  `;
  const { rows } = await query<Award>(sql, [awardId]);
  return rows[0] ?? null;
}
