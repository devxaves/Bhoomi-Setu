/**
 * BhoomiSetu — Deadline Scanner Cron Endpoint
 * GET /api/cron/deadline-scan
 *
 * Meant to be called daily by Vercel Cron (vercel.json) or an external scheduler.
 * Protected by CRON_SECRET env var — Vercel sends this in the Authorization header.
 *
 * Vercel Cron config (add to vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/deadline-scan", "schedule": "0 2 * * *" }]
 * }
 *
 * Manual trigger: GET /api/cron/deadline-scan (with Authorization: Bearer <CRON_SECRET>)
 */

import { NextRequest, NextResponse } from "next/server";
import { runDeadlineScan } from "@/lib/deadline-scanner";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel sends it automatically; for manual triggers
  // include: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized. CRON_SECRET mismatch." },
        { status: 401 }
      );
    }
  } else {
    // In development (no CRON_SECRET set), allow unauthenticated calls for testing
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET environment variable must be set in production." },
        { status: 500 }
      );
    }
  }

  try {
    const result = await runDeadlineScan();

    return NextResponse.json({
      success: true,
      ...result,
      summary: {
        scannedAt: result.scannedAt,
        projectsScanned: result.projectsScanned,
        flagsChanged: result.flagsChanged,
        amber: result.escalations.amber.length,
        red: result.escalations.red.length,
        lapsed: result.escalations.lapsed.length,
      },
    });
  } catch (err) {
    console.error("GET /api/cron/deadline-scan error:", err);
    return NextResponse.json(
      { error: "Deadline scan failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
