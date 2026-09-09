/**
 * BhoomiSetu — GET /api/citizen/search
 *
 * Public project search (no auth required).
 * Returns project summaries matching query by name, district, or state.
 * Returns up to 10 results.
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/pool";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters." },
        { status: 400 }
      );
    }

    const pattern = `%${q.toLowerCase()}%`;

    const { rows } = await query(
      `SELECT id, name, land_requiring_body, district, state, project_type,
              current_stage, status_flag, risk_score
       FROM projects
       WHERE LOWER(name) LIKE $1
          OR LOWER(district) LIKE $1
          OR LOWER(state) LIKE $1
          OR LOWER(land_requiring_body) LIKE $1
       ORDER BY updated_at DESC
       LIMIT 10`,
      [pattern]
    );

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error("Error in /api/citizen/search:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to search projects." },
      { status: 500 }
    );
  }
}
