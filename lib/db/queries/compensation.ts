/**
 * BhoomiSetu — Compensation Payments Query Module (Raw SQL, No ORM)
 *
 * Implements compensation disbursement lifecycle:
 * assessed → sanctioned → disbursed → failed
 * Wired to mock PFMS adapter reference tracking and full audit logging.
 */

import { query, withTransaction } from "../pool";

export interface CompensationPayment {
  id: string;
  award_id: string;
  amount_assessed: number;
  amount_disbursed: number;
  status: "assessed" | "sanctioned" | "disbursed" | "failed";
  disbursed_on: string | null;
  mock_pfms_ref: string | null;
  created_at: string;
  // Joined fields
  project_id?: string;
  parcel_id?: string;
  ulpin?: string;
  survey_number?: string;
  village?: string;
  owner_name?: string | null;
  bank_ref?: string | null;
}

export const VALID_PAYMENT_STATUSES = ["assessed", "sanctioned", "disbursed", "failed"] as const;

export type PaymentStatus = typeof VALID_PAYMENT_STATUSES[number];

/**
 * Validates legal disbursement status transition.
 */
export function validatePaymentTransition(
  fromStatus: PaymentStatus,
  toStatus: PaymentStatus
): { allowed: boolean; message?: string } {
  if (fromStatus === toStatus) {
    return { allowed: true };
  }

  if (fromStatus === "assessed" && toStatus === "sanctioned") {
    return { allowed: true };
  }

  if (fromStatus === "sanctioned" && (toStatus === "disbursed" || toStatus === "failed")) {
    return { allowed: true };
  }

  if (fromStatus === "failed" && toStatus === "sanctioned") {
    return { allowed: true }; // Retry path
  }

  return {
    allowed: false,
    message: `Invalid payment transition from '${fromStatus}' to '${toStatus}'. Legal flow is assessed → sanctioned → disbursed (or failed).`,
  };
}

/**
 * List all compensation payments for a project with joined parcel & award details.
 */
export async function getPaymentsByProject(projectId: string): Promise<CompensationPayment[]> {
  const sql = `
    SELECT
      cp.*,
      a.project_id,
      a.parcel_id,
      p.ulpin,
      p.survey_number,
      p.village,
      o.name AS owner_name,
      o.bank_ref
    FROM compensation_payments cp
    JOIN awards a ON a.id = cp.award_id
    JOIN parcels p ON p.id = a.parcel_id
    LEFT JOIN owners o ON o.parcel_id = p.id AND o.is_current = true
    WHERE a.project_id = $1
    ORDER BY cp.created_at DESC
  `;
  const { rows } = await query<CompensationPayment>(sql, [projectId]);
  return rows;
}

/**
 * Get payment by ID.
 */
export async function getPaymentById(paymentId: string): Promise<CompensationPayment | null> {
  const sql = `
    SELECT
      cp.*,
      a.project_id,
      a.parcel_id,
      p.ulpin,
      p.survey_number,
      p.village,
      o.name AS owner_name,
      o.bank_ref
    FROM compensation_payments cp
    JOIN awards a ON a.id = cp.award_id
    JOIN parcels p ON p.id = a.parcel_id
    LEFT JOIN owners o ON o.parcel_id = p.id AND o.is_current = true
    WHERE cp.id = $1
  `;
  const { rows } = await query<CompensationPayment>(sql, [paymentId]);
  return rows[0] ?? null;
}

/**
 * Update payment status (e.g. sanctioned or disbursed via PFMS).
 * Records snapshot to audit_log in the same transaction.
 */
export async function updatePaymentStatus(
  paymentId: string,
  targetStatus: PaymentStatus,
  actorId?: string | null,
  options?: {
    mockPfmsRef?: string;
    disbursedOn?: string;
    amountDisbursed?: number;
  }
): Promise<CompensationPayment> {
  return withTransaction(async (client) => {
    // 1. Fetch current payment row
    const curRes = await client.query<CompensationPayment>(
      `SELECT * FROM compensation_payments WHERE id = $1 FOR UPDATE`,
      [paymentId]
    );

    if (curRes.rows.length === 0) {
      throw new Error(`Compensation payment '${paymentId}' not found.`);
    }

    const current = curRes.rows[0];
    const validation = validatePaymentTransition(current.status, targetStatus);
    if (!validation.allowed) {
      throw new Error(validation.message);
    }

    // 2. Prepare update values
    const disbursedOn =
      targetStatus === "disbursed"
        ? options?.disbursedOn || new Date().toISOString().split("T")[0]
        : current.disbursed_on;

    const amountDisbursed =
      targetStatus === "disbursed"
        ? options?.amountDisbursed ?? current.amount_assessed
        : current.amount_disbursed;

    const mockPfmsRef = options?.mockPfmsRef || current.mock_pfms_ref;

    // 3. Update payment
    const updateSql = `
      UPDATE compensation_payments
      SET status = $1,
          disbursed_on = $2,
          amount_disbursed = $3,
          mock_pfms_ref = $4
      WHERE id = $5
      RETURNING *
    `;

    const updateRes = await client.query<CompensationPayment>(updateSql, [
      targetStatus,
      disbursedOn,
      amountDisbursed,
      mockPfmsRef,
      paymentId,
    ]);
    const updated = updateRes.rows[0];

    // 4. Record to audit_log
    const auditSql = `
      INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
      VALUES ($1, 'compensation_payment', $2, $3, $4, $5)
    `;
    await client.query(auditSql, [
      actorId ?? null,
      paymentId,
      `STATUS_TRANSITION_${targetStatus.toUpperCase()}`,
      JSON.stringify(current),
      JSON.stringify(updated),
    ]);

    return updated;
  });
}
