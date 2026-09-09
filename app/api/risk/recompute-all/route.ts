/**
 * BhoomiSetu — POST /api/risk/recompute-all
 *
 * Batch recomputes risk scores and structured reasons for all projects and parcels
 * in the database. Uses bulk data fetching to avoid N+1 queries.
 * Synchronises both risk_scores table and entity columns.
 */

import { NextResponse } from "next/server";
import { computeBatchRisk } from "@/lib/risk-engine";

export async function POST() {
  try {
    const { projects, parcels } = await computeBatchRisk({ persist: true });

    return NextResponse.json({
      success: true,
      message: `Successfully recomputed ${projects.length} projects and ${parcels.length} parcels.`,
      projectsCount: projects.length,
      parcelsCount: parcels.length,
    });
  } catch (error: any) {
    console.error("Error in /api/risk/recompute-all:", error);
    return NextResponse.json(
      { error: "Failed to batch recompute risk scores." },
      { status: 500 }
    );
  }
}
