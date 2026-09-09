/**
 * BhoomiSetu — GET /api/risk/scores
 *
 * Retrieves all latest risk scores for projects and parcels with full reasons breakdown.
 */

import { NextResponse } from "next/server";
import { getAllLatestRiskScores } from "@/lib/db/queries/risk-scores";

export async function GET() {
  try {
    const scores = await getAllLatestRiskScores();
    return NextResponse.json({
      success: true,
      count: scores.length,
      scores,
    });
  } catch (error: any) {
    console.error("🔴 Error in /api/risk/scores:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch risk scores." },
      { status: 500 }
    );
  }
}
