/**
 * BhoomiSetu — Notifications API
 * POST /api/notifications — create a statutory notification (Sec 11 / Sec 19)
 *   deadline_on is computed in SQL as notified_on + INTERVAL '12 months'
 * GET  /api/notifications?project_id= — list notifications for a project
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createNotification,
  getNotificationsByProject,
  getUpcomingDeadlines,
} from "@/lib/db/queries/notifications";
import { canAdvanceStage } from "@/lib/workflow";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const upcoming = searchParams.get("upcoming") === "true";

  try {
    if (upcoming) {
      const deadlines = await getUpcomingDeadlines();
      return NextResponse.json({ data: deadlines, count: deadlines.length });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id or ?upcoming=true is required" },
        { status: 400 }
      );
    }

    const notifications = await getNotificationsByProject(projectId);
    return NextResponse.json({ data: notifications, count: notifications.length });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Only authorised roles can record notifications
    if (!canAdvanceStage(user.role)) {
      return NextResponse.json(
        { error: "Only collector, state_admin, or central_ministry may record notifications" },
        { status: 403 }
      );
    }

    const body = await req.json() as {
      project_id?: string;
      section?: string;
      notified_on?: string;
      document_id?: string;
    };

    if (!body.project_id || !body.section || !body.notified_on) {
      return NextResponse.json(
        { error: "Required fields: project_id, section (section_11|section_19), notified_on (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!["section_11", "section_19"].includes(body.section)) {
      return NextResponse.json(
        { error: "section must be 'section_11' or 'section_19'" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.notified_on)) {
      return NextResponse.json(
        { error: "notified_on must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      project_id: body.project_id,
      section: body.section as "section_11" | "section_19",
      notified_on: body.notified_on,
      document_id: body.document_id,
    });

    return NextResponse.json(
      {
        success: true,
        data: notification,
        note: `deadline_on computed as ${body.notified_on} + 12 months = ${notification.deadline_on}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/notifications error:", err);
    return NextResponse.json(
      { error: "Failed to create notification", details: (err as Error).message },
      { status: 500 }
    );
  }
}
