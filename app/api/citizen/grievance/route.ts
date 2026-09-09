/**
 * BhoomiSetu — POST /api/citizen/grievance
 *
 * Public grievance submission form writing directly to the grievances table.
 */

import { NextRequest, NextResponse } from "next/server";
import { submitCitizenGrievance } from "@/lib/db/queries/citizen";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ulpin, message, category, submitted_by } = body;

    if (!ulpin || !message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Both 'ulpin' and 'message' are required to register a grievance." },
        { status: 400 }
      );
    }

    const grievance = await submitCitizenGrievance({
      ulpin,
      message,
      category,
      submitted_by,
    });

    const grievanceRef = `GRV-2026-${grievance.id.slice(0, 6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      data: grievance,
      grievanceRef,
      message: `Grievance registered successfully with Reference #${grievanceRef}. Routed to the District Land Acquisition Officer for verification.`,
    });
  } catch (error: any) {
    console.error("🔴 Error in /api/citizen/grievance:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit grievance." },
      { status: 400 }
    );
  }
}
