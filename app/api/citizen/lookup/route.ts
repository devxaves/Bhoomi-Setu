/**
 * BhoomiSetu — GET /api/citizen/lookup
 *
 * Public ULPIN lookup returning strictly scoped single-parcel status.
 * Zero PII exposure (no names, phone numbers, or bank accounts).
 */

import { NextRequest, NextResponse } from "next/server";
import { lookupCitizenParcelByUlpin } from "@/lib/db/queries/citizen";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ulpin = searchParams.get("ulpin");

    if (!ulpin || ulpin.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'ulpin' is required." },
        { status: 400 }
      );
    }

    const data = await lookupCitizenParcelByUlpin(ulpin);
    if (!data) {
      return NextResponse.json(
        { error: `No land acquisition record found for ULPIN '${ulpin.trim()}'. Please verify the 14-digit number.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("🔴 Error in /api/citizen/lookup:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to lookup parcel." },
      { status: 500 }
    );
  }
}
