/**
 * BhoomiSetu — Project Detail + Update API
 * GET   /api/projects/[id]  — project detail with stage, risk score
 * PATCH /api/projects/[id]  — update alignment_geojson (GIS engine)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProjectById } from "@/lib/db/queries/projects";
import { query } from "@/lib/db/pool";
import type { Polygon, MultiPolygon } from "geojson";

// ── GET /api/projects/[id] ────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ data: project });
  } catch (err) {
    console.error(`GET /api/projects/${id} error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch project", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// ── PATCH /api/projects/[id] ──────────────────────────────────────────────
// Supports updating alignment_geojson (from GIS draw tool) and status_flag
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json() as {
      alignment_geojson?: Polygon | MultiPolygon;
      status_flag?: "green" | "amber" | "red" | "lapsed";
      risk_score?: number;
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.alignment_geojson !== undefined) {
      sets.push(`alignment_geojson = $${idx++}`);
      values.push(JSON.stringify(body.alignment_geojson));
    }
    if (body.status_flag !== undefined) {
      sets.push(`status_flag = $${idx++}`);
      values.push(body.status_flag);
    }
    if (body.risk_score !== undefined) {
      sets.push(`risk_score = $${idx++}`);
      values.push(body.risk_score);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    sets.push(`updated_at = now()`);
    values.push(id);

    const { rows } = await query(
      `UPDATE projects SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values as string[]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error(`PATCH /api/projects/${id} error:`, err);
    return NextResponse.json(
      { error: "Failed to update project", details: (err as Error).message },
      { status: 500 }
    );
  }
}
