/**
 * BhoomiSetu — /api/mutations
 *
 * GET — list parcel mutations and project-level mutation lag metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getMutationsByProject, getMutationMetrics } from "@/lib/db/queries/mutations";

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

    const [mutations, metrics] = await Promise.all([
      getMutationsByProject(projectId),
      getMutationMetrics(projectId),
    ]);

    return NextResponse.json({
      success: true,
      count: mutations.length,
      metrics,
      data: mutations,
    });
  } catch (error: any) {
    console.error("🔴 Error in GET /api/mutations:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch mutations." },
      { status: 500 }
    );
  }
}
