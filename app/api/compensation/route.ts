/**
 * BhoomiSetu — /api/compensation
 *
 * GET — list compensation payment records for a project
 */

import { NextRequest, NextResponse } from "next/server";
import { getPaymentsByProject, getPaymentById } from "@/lib/db/queries/compensation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const paymentId = searchParams.get("id");

    if (paymentId) {
      const payment = await getPaymentById(paymentId);
      if (!payment) {
        return NextResponse.json({ error: "Compensation payment not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: payment });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Query parameter 'project_id' is required." },
        { status: 400 }
      );
    }

    const payments = await getPaymentsByProject(projectId);
    return NextResponse.json({ success: true, count: payments.length, data: payments });
  } catch (error: any) {
    console.error("🔴 Error in GET /api/compensation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch compensation payments." },
      { status: 500 }
    );
  }
}
