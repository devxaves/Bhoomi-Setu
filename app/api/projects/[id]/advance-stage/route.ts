/**
 * BhoomiSetu — Stage Advance API
 * POST /api/projects/[id]/advance-stage
 *
 * Validates and executes a RFCTLARR stage transition:
 *   1. Authenticate + resolve user role from DB
 *   2. Fetch current project state + active notifications (for deadline checks)
 *   3. Call validateTransition() — blocks illegal orders, role violations, lapsed deadlines
 *   4. Write full before/after snapshot to audit_log
 *   5. Update projects.current_stage + stage_started_at + status_flag (reset to green)
 *   6. Return new project state + any deadline warnings
 *
 * This endpoint is intentionally strict:
 *   - No skipping stages (proposal → section_11 is blocked; must go via sia)
 *   - No going backwards
 *   - Collector/state_admin/central_ministry only (not lrb, not citizen)
 *   - Section 11 → Section 19: lapsed deadline = hard block
 *   - Section 19 → Award: lapsed deadline = hard block
 *   - Every transition writes to audit_log with actor, before, after
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, withTransaction } from "@/lib/db/pool";
import type { PoolClient } from "pg";
import { getUserById } from "@/lib/db/queries/users";
import { validateTransition, STAGE_INFO, STAGES } from "@/lib/workflow";
import type { Stage } from "@/lib/workflow";

interface ProjectRow {
  id: string;
  name: string;
  current_stage: Stage;
  status_flag: string;
  stage_started_at: string;
  district: string;
  state: string;
}

interface NotificationRow {
  section: "section_11" | "section_19";
  deadline_on: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    const body = await req.json() as { to_stage?: string; reason?: string };

    if (!body.to_stage) {
      return NextResponse.json(
        { error: "Missing required field: to_stage" },
        { status: 400 }
      );
    }

    const toStage = body.to_stage as Stage;

    // ── 1. Resolve user role ─────────────────────────────────────────────────
    const dbUser = await getUserById(user.id);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in BhoomiSetu. Please complete registration." },
        { status: 403 }
      );
    }

    // ── 2. Fetch project ─────────────────────────────────────────────────────
    const { rows: projectRows } = await query<ProjectRow>(
      `SELECT id, name, current_stage, status_flag, stage_started_at, district, state
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectRows[0];

    // ── 3. Fetch active notifications for deadline checks ────────────────────
    const { rows: notifications } = await query<NotificationRow>(
      `SELECT section, deadline_on::text
       FROM notifications WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    const sec11Notif = notifications.find((n) => n.section === "section_11");
    const sec19Notif = notifications.find((n) => n.section === "section_19");

    // ── 4. Validate the transition ────────────────────────────────────────────
    const validation = validateTransition({
      fromStage: project.current_stage,
      toStage,
      userRole: dbUser.role,
      sec11DeadlineOn: sec11Notif?.deadline_on ?? null,
      sec19DeadlineOn: sec19Notif?.deadline_on ?? null,
    });

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: "Stage transition blocked",
          code: validation.error,
          message: validation.message,
          currentStage: project.current_stage,
          requestedStage: toStage,
          nextValidStage: STAGES[STAGES.indexOf(project.current_stage) + 1] ?? null,
        },
        { status: 422 }
      );
    }

    // ── 5. Execute transition in a transaction ────────────────────────────────
    const stageInfo = STAGE_INFO[toStage];
    const now = new Date().toISOString();

    const updatedProject = await withTransaction(async (client: PoolClient) => {
      // Snapshot before state
      const beforeState = {
        stage: project.current_stage,
        status_flag: project.status_flag,
        stage_started_at: project.stage_started_at,
      };

      // Update project stage + reset status_flag to green (transition = compliance act)
      const { rows: updated } = await client.query<ProjectRow>(
        `UPDATE projects
         SET current_stage   = $1,
             stage_started_at = now(),
             status_flag      = 'green',
             updated_at       = now()
         WHERE id = $2
         RETURNING *`,
        [toStage, projectId]
      );

      const afterState = {
        stage: toStage,
        status_flag: "green",
        stage_started_at: now,
        act_ref: stageInfo.actRef,
        reason: body.reason ?? null,
        deadline_warning: validation.deadlineWarning ?? null,
      };

      // Write full audit_log entry
      await client.query(
        `INSERT INTO audit_log (actor_id, entity_type, entity_id, action, before_state, after_state)
         VALUES ($1, 'project', $2, $3, $4, $5)`,
        [
          dbUser.id,
          projectId,
          `stage_advance:${project.current_stage}→${toStage}`,
          JSON.stringify(beforeState),
          JSON.stringify(afterState),
        ]
      );

      return updated[0];
    });

    return NextResponse.json({
      success: true,
      projectId,
      transition: {
        from: project.current_stage,
        to: toStage,
        actRef: stageInfo.actRef,
        description: stageInfo.description,
        performedBy: { id: dbUser.id, role: dbUser.role, email: dbUser.email },
        performedAt: now,
      },
      project: updatedProject,
      deadlineWarning: validation.deadlineWarning ?? null,
      auditLogged: true,
    });
  } catch (err) {
    console.error(`POST /api/projects/${projectId}/advance-stage error:`, err);
    return NextResponse.json(
      { error: "Stage transition failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
