/**
 * BhoomiSetu — /api/affected-families
 *
 * GET — list affected families for a project and return R&R completion rollup
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAffectedFamiliesByProject,
  getProjectRRRollup,
} from "@/lib/db/queries/affected-families";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        { error: "Query parameter 'project_id' is required." },
        { status: 400 }
      );
    }

    const [families, rollup] = await Promise.all([
      getAffectedFamiliesByProject(projectId),
      getProjectRRRollup(projectId),
    ]);

    return NextResponse.json({
      success: true,
      count: families.length,
      rollup,
      data: families,
    });
  } catch (error: any) {
    console.error("🔴 Error in GET /api/affected-families:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch affected families." },
      { status: 500 }
    );
  }
}
