/**
 * BhoomiSetu — /api/archive
 *
 * GET — multi-parameter search across projects, parcels, awards with pagination.
 * If format=csv is requested, generates and downloads an RFC 4180 compliant CSV file.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchArchive, generateArchiveCSV } from "@/lib/db/queries/archive";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = (searchParams.get("type") as any) || "all";
    const query = searchParams.get("q") || undefined;
    const state = searchParams.get("state") || undefined;
    const district = searchParams.get("district") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const format = searchParams.get("format");

    const filters = {
      entityType,
      query,
      state,
      district,
      status,
      page,
      limit,
    };

    // CSV Export
    if (format === "csv") {
      const csvData = await generateArchiveCSV(filters);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="bhoomi_setu_archive_${Date.now()}.csv"`,
        },
      });
    }

    // JSON response
    const result = await searchArchive(filters);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("🔴 Error in /api/archive:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to search archive." },
      { status: 500 }
    );
  }
}
