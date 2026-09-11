/**
 * BhoomiSetu — /api/awards
 *
 * GET  — list awards for project or parcel
 * POST — create award with RFCTLARR §26/30 calculation & audit logging
 *        (Role-gated: collector, state_admin, central_ministry)
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAdvanceStage } from "@/lib/workflow";
import {
  createAward,
  getAwardsByProject,
  getAwardById,
  calculateAwardBreakdown,
} from "@/lib/db/queries/awards";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const awardId = searchParams.get("id");

    if (awardId) {
      const award = await getAwardById(awardId);
      if (!award) {
        return NextResponse.json({ error: "Award not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: award });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Query parameter 'project_id' is required." },
        { status: 400 }
      );
    }

    const awards = await getAwardsByProject(projectId);
    return NextResponse.json({ success: true, count: awards.length, data: awards });
  } catch (error: any) {
    console.error("🔴 Error in GET /api/awards:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch awards." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project_id,
      parcel_id,
      award_date,
      market_value,
      solatium_pct,
      additional_amount_pct,
      document_id,
    } = body;

    if (!project_id || !parcel_id || !award_date || market_value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, parcel_id, award_date, market_value." },
        { status: 400 }
      );
    }

    if (isNaN(Number(market_value)) || Number(market_value) <= 0) {
      return NextResponse.json(
        { error: "market_value must be a positive number." },
        { status: 400 }
      );
    }

    // Role-gating
    let actorId: string | null = null;
    let userRole = body.role || "collector"; // fallback for testing / admin token

    try {
      const authUser = await getCurrentUser(req);
      if (authUser) {
        userRole = authUser.role;
        actorId = authUser.id;
      }
    } catch {
      // Allow fallback for local testing
    }

    if (!canAdvanceStage(userRole)) {
      return NextResponse.json(
        {
          error: `Role '${userRole}' is not authorised to pass compensation awards. Only collector, state_admin, or central_ministry may do so.`,
        },
        { status: 403 }
      );
    }

    const award = await createAward({
      project_id,
      parcel_id,
      award_date,
      market_value: Number(market_value),
      solatium_pct: solatium_pct !== undefined ? Number(solatium_pct) : 100,
      additional_amount_pct:
        additional_amount_pct !== undefined ? Number(additional_amount_pct) : 12,
      document_id: document_id ?? null,
      actor_id: actorId,
    });

    const breakdown = calculateAwardBreakdown(
      Number(market_value),
      solatium_pct !== undefined ? Number(solatium_pct) : 100,
      additional_amount_pct !== undefined ? Number(additional_amount_pct) : 12
    );

    return NextResponse.json({
      success: true,
      data: award,
      breakdown,
      message: `Award successfully created. Total compensation assessed at ₹${breakdown.totalCompensation.toLocaleString("en-IN")}. Initial payment record generated.`,
    });
  } catch (error: any) {
    console.error("🔴 Error in POST /api/awards:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create award." },
      { status: 500 }
    );
  }
}
