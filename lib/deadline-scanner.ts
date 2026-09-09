/**
 * BhoomiSetu — Statutory Deadline Scanner
 *
 * Implements the daily cron logic from Section 7.2 of the spec:
 *
 *   For each open project:
 *     1. Look up its active notifications (Section 11 / Section 19)
 *     2. Compute days_elapsed / statutory_window_days (365 days = 12 months)
 *     3. Derive urgency: green (<60%), amber (60-90%), red (>90%), lapsed (past deadline)
 *     4. Update projects.status_flag if it has changed
 *     5. Generate in-app alert entries for amber→Collector, red→State+Central
 *
 * The scanner is conservative: it only ESCALATES (green→amber→red→lapsed).
 * It never de-escalates automatically — a human action (stage advance) resets the flag.
 *
 * Deadline arithmetic:
 *   - All deadlines are stored in notifications.deadline_on as DATE
 *   - deadline_on is computed at notification insert time as notified_on + 12 months (SQL)
 *   - The scanner trusts the stored deadline_on value — it does NOT recompute it here
 *     to avoid any risk of drift. This is intentional.
 *
 * The scanner returns a structured ScanResult for logging and API response.
 */

import { query, withTransaction } from "@/lib/db/pool";
import type { PoolClient } from "pg";
import { computeUrgency } from "@/lib/workflow";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectDeadlineRow {
  project_id: string;
  project_name: string;
  district: string;
  state: string;
  current_stage: string;
  current_status_flag: string;
  section: string;
  notified_on: string;
  deadline_on: string;
  days_elapsed: number;
  days_total: number;
  pct_elapsed: number;
  past_deadline: boolean;
}

export interface ScanEntry {
  projectId: string;
  projectName: string;
  section: string;
  deadlineOn: string;
  pctElapsed: number;
  oldFlag: string;
  newFlag: string;
  changed: boolean;
  urgency: "green" | "amber" | "red" | "lapsed";
}

export interface ScanResult {
  scannedAt: string;
  projectsScanned: number;
  flagsChanged: number;
  escalations: {
    amber: ScanEntry[];
    red: ScanEntry[];
    lapsed: ScanEntry[];
  };
  entries: ScanEntry[];
}

// ── Main scanner ──────────────────────────────────────────────────────────────

export async function runDeadlineScan(): Promise<ScanResult> {
  const scannedAt = new Date().toISOString();

  // Fetch all open projects with their active notifications in one query.
  // We use the latest notification per section (in case of re-notifications).
  const { rows } = await query<ProjectDeadlineRow>(`
    SELECT DISTINCT ON (p.id, n.section)
      p.id              AS project_id,
      p.name            AS project_name,
      p.district,
      p.state,
      p.current_stage,
      p.status_flag     AS current_status_flag,
      n.section,
      n.notified_on::text,
      n.deadline_on::text,
      GREATEST(0, (CURRENT_DATE - n.notified_on))                          AS days_elapsed,
      GREATEST(1, (n.deadline_on - n.notified_on))                         AS days_total,
      ROUND(
        GREATEST(0, (CURRENT_DATE - n.notified_on))::numeric
        / GREATEST(1, (n.deadline_on - n.notified_on))::numeric * 100, 1
      )                                                                    AS pct_elapsed,
      (CURRENT_DATE > n.deadline_on)                                        AS past_deadline
    FROM projects p
    JOIN notifications n ON n.project_id = p.id
    WHERE p.current_stage NOT IN ('closed')
    ORDER BY p.id, n.section, n.created_at DESC
  `);

  const entries: ScanEntry[] = [];
  let flagsChanged = 0;

  const escalations = { amber: [] as ScanEntry[], red: [] as ScanEntry[], lapsed: [] as ScanEntry[] };

  // Group by project (a project can have both sec_11 and sec_19 notifications)
  // We take the most urgent (worst) urgency across all notifications for this project
  const byProject = new Map<string, ProjectDeadlineRow[]>();
  for (const row of rows) {
    if (!byProject.has(row.project_id)) byProject.set(row.project_id, []);
    byProject.get(row.project_id)!.push(row);
  }

  await withTransaction(async (client: PoolClient) => {
    for (const [projectId, notifs] of byProject) {
      // Find worst urgency across all notifications for this project
      let worstUrgency: "green" | "amber" | "red" | "lapsed" = "green";
      const URGENCY_RANK = { green: 0, amber: 1, red: 2, lapsed: 3 };

      for (const n of notifs) {
        const urgency = computeUrgency(n.pct_elapsed, n.past_deadline);
        if (URGENCY_RANK[urgency] > URGENCY_RANK[worstUrgency]) {
          worstUrgency = urgency;
        }
      }

      const firstNotif = notifs[0];
      const oldFlag = firstNotif.current_status_flag;

      // Only escalate — never auto-downgrade (human stage advance resets the flag)
      const ESCALATION_ORDER = ["green", "amber", "red", "lapsed"];
      const shouldUpdate =
        ESCALATION_ORDER.indexOf(worstUrgency) > ESCALATION_ORDER.indexOf(oldFlag);

      const entry: ScanEntry = {
        projectId,
        projectName: firstNotif.project_name,
        section: notifs.map((n) => n.section).join(", "),
        deadlineOn: notifs[notifs.length - 1].deadline_on,
        pctElapsed: Math.max(...notifs.map((n) => n.pct_elapsed)),
        oldFlag,
        newFlag: shouldUpdate ? worstUrgency : oldFlag,
        changed: shouldUpdate,
        urgency: worstUrgency,
      };
      entries.push(entry);

      if (shouldUpdate) {
        flagsChanged++;

        // Update projects.status_flag
        await client.query(
          `UPDATE projects SET status_flag = $1, updated_at = now() WHERE id = $2`,
          [worstUrgency, projectId]
        );

        // Classify escalations for caller's use
        if (worstUrgency === "amber") escalations.amber.push(entry);
        else if (worstUrgency === "red") escalations.red.push(entry);
        else if (worstUrgency === "lapsed") escalations.lapsed.push(entry);

        // Write in-app alerts into audit_log (using system actor_id null for cron)
        // Amber → alert Collector role; Red/Lapsed → also escalate to State + Central
        const alertMessage =
          worstUrgency === "lapsed"
            ? `LAPSED: Statutory deadline passed for ${firstNotif.project_name}. ` +
              `Re-notification required under RFCTLARR. Flagged for review.`
            : worstUrgency === "red"
            ? `URGENT: ${firstNotif.project_name} is >90% through statutory window. ` +
              `Immediate action required to avoid lapse.`
            : `AMBER ALERT: ${firstNotif.project_name} is 60–90% through statutory window. ` +
              `Action required by Collector.`;

        await client.query(
          `INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
           VALUES (NULL, 'project', $1, $2, $3, $4)`,
          [
            projectId,
            `deadline_scan_${worstUrgency}`,
            JSON.stringify({ status_flag: oldFlag }),
            JSON.stringify({
              status_flag: worstUrgency,
              message: alertMessage,
              pct_elapsed: entry.pctElapsed,
              deadline_on: entry.deadlineOn,
              scanned_at: scannedAt,
            }),
          ]
        );
      }
    }
  });

  return {
    scannedAt,
    projectsScanned: byProject.size,
    flagsChanged,
    escalations,
    entries,
  };
}
