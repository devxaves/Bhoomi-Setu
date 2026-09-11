/**
 * BhoomiSetu — Workflow Detail API
 * GET /api/projects/[id]/workflow
 *
 * Returns full workflow context for a single project:
 * project detail, audit log, parcels, awards, deadlines.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/lib/db/queries/projects";
import {
  getWorkflowAuditLog,
  getWorkflowParcels,
  getWorkflowAwards,
  getWorkflowDeadlines,
} from "@/lib/db/queries/workflow";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(_req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    // Use the proven getProjectById instead of getWorkflowProject
    // to avoid potential query differences
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [auditLog, parcels, awards, deadlines] = await Promise.all([
      getWorkflowAuditLog(projectId).catch(() => []),
      getWorkflowParcels(projectId).catch(() => []),
      getWorkflowAwards(projectId).catch(() => []),
      getWorkflowDeadlines(projectId).catch(() => []),
    ]);

    return NextResponse.json({
      data: {
        project,
        auditLog,
        parcels,
        awards,
        deadlines,
      },
    });
  } catch (err) {
    console.error(`GET /api/projects/${projectId}/workflow error:`, err);
    return NextResponse.json(
      { error: "Failed to load workflow data" },
      { status: 500 }
    );
  }
}
