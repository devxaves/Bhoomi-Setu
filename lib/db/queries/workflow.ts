/**
 * BhoomiSetu — Workflow Query Module (Raw SQL, No ORM)
 *
 * Dedicated queries for the statutory workflow pipeline.
 * Supports the individual project workflow view (/workflow/[projectId])
 * with audit trail, deadline status, and parcel/award aggregation.
 */

import { query } from "../pool";
import type { Stage } from "@/lib/workflow";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WorkflowProjectDetail {
  id: string;
  name: string;
  land_requiring_body: string;
  project_type: string | null;
  district: string;
  state: string;
  current_stage: Stage;
  stage_started_at: string;
  status_flag: "green" | "amber" | "red" | "lapsed";
  risk_score: number;
  alignment_geojson: unknown;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before_state: unknown;
  after_state: unknown;
  created_at: string;
  // Joined
  actor_email?: string;
  actor_role?: string;
}

export interface WorkflowParcelSummary {
  id: string;
  ulpin: string;
  survey_number: string | null;
  village: string | null;
  district: string | null;
  area_hectares: number | null;
  ownership_status: string;
  litigation_flag: boolean;
  risk_score: number;
}

export interface WorkflowAwardSummary {
  id: string;
  parcel_id: string;
  ulpin: string | null;
  award_date: string;
  market_value: number;
  total_compensation: number;
  payment_status: string | null;
  amount_disbursed: number | null;
}

export interface WorkflowDeadline {
  id: string;
  section: "section_11" | "section_19";
  notified_on: string;
  deadline_on: string;
  days_elapsed: number;
  days_total: number;
  pct_elapsed: number;
  urgency: "green" | "amber" | "red" | "lapsed";
  days_left: number;
  is_past: boolean;
}

// ── Queries ────────────────────────────────────────────────────────────────

/** Fetch full project detail for workflow view */
export async function getWorkflowProject(
  projectId: string
): Promise<WorkflowProjectDetail | null> {
  const { rows } = await query<WorkflowProjectDetail>(
    `SELECT id, name, land_requiring_body, project_type, district, state,
            current_stage, stage_started_at, status_flag, risk_score,
            alignment_geojson, created_at
     FROM projects WHERE id = $1`,
    [projectId]
  );
  return rows[0] ?? null;
}

/** Fetch audit log for a project, most recent first */
export async function getWorkflowAuditLog(
  projectId: string,
  limit = 50
): Promise<AuditEntry[]> {
  const { rows } = await query<AuditEntry>(
    `SELECT al.*,
            u.email AS actor_email,
            u.role  AS actor_role
     FROM audit_log al
     LEFT JOIN users u ON u.id = al.actor_id
     WHERE al.entity_type = 'project' AND al.entity_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2`,
    [projectId, limit]
  );
  return rows;
}

/** Fetch parcels summary for a project (without geometry) */
export async function getWorkflowParcels(
  projectId: string
): Promise<WorkflowParcelSummary[]> {
  const { rows } = await query<WorkflowParcelSummary>(
    `SELECT id, ulpin, survey_number, village, district,
            area_hectares, ownership_status, litigation_flag, risk_score
     FROM parcels
     WHERE project_id = $1
     ORDER BY ulpin`,
    [projectId]
  );
  return rows;
}

/** Fetch awards summary for a project */
export async function getWorkflowAwards(
  projectId: string
): Promise<WorkflowAwardSummary[]> {
  const { rows } = await query<WorkflowAwardSummary>(
    `SELECT a.id, a.parcel_id, p.ulpin, a.award_date,
            a.market_value, a.total_compensation,
            cp.payment_status, cp.amount_disbursed
     FROM awards a
     JOIN parcels p ON p.id = a.parcel_id
     LEFT JOIN compensation_payments cp ON cp.award_id = a.id
     WHERE p.project_id = $1
     ORDER BY a.award_date`,
    [projectId]
  );
  return rows;
}

/** Fetch notifications (deadlines) for a project with computed urgency */
export async function getWorkflowDeadlines(
  projectId: string
): Promise<WorkflowDeadline[]> {
  const { rows } = await query<WorkflowDeadline>(
    `SELECT
       n.id, n.section, n.notified_on::text, n.deadline_on::text,
       GREATEST(0, CURRENT_DATE - n.notified_on) AS days_elapsed,
       GREATEST(1, n.deadline_on - n.notified_on) AS days_total,
       ROUND(
         GREATEST(0, CURRENT_DATE - n.notified_on)::numeric /
         GREATEST(1, n.deadline_on - n.notified_on)::numeric * 100, 1
       ) AS pct_elapsed,
       CASE
         WHEN CURRENT_DATE > n.deadline_on THEN 'lapsed'
         WHEN GREATEST(0, CURRENT_DATE - n.notified_on)::numeric /
              GREATEST(1, n.deadline_on - n.notified_on)::numeric > 0.90 THEN 'red'
         WHEN GREATEST(0, CURRENT_DATE - n.notified_on)::numeric /
              GREATEST(1, n.deadline_on - n.notified_on)::numeric > 0.60 THEN 'amber'
         ELSE 'green'
       END AS urgency,
       (n.deadline_on - CURRENT_DATE)::int AS days_left,
       (CURRENT_DATE > n.deadline_on) AS is_past
     FROM notifications n
     WHERE n.project_id = $1
     ORDER BY n.deadline_on`,
    [projectId]
  );
  return rows;
}
