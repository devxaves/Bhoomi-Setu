/**
 * BhoomiSetu — Audit Log API
 * GET /api/audit?entity_id=&entity_type=project&limit=20
 * GET /api/audit?recent=true&limit=20
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAuditTrail, getRecentAuditEntries } from "@/lib/db/queries/audit";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entity_id");
    const entityType = searchParams.get("entity_type") ?? "project";
    const recent = searchParams.get("recent") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

    if (recent || !entityId) {
      const entries = await getRecentAuditEntries(limit);
      return NextResponse.json({ data: entries, count: entries.length });
    }

    const entries = await getAuditTrail(entityType, entityId);
    const sliced = entries.slice(0, limit);
    return NextResponse.json({ data: sliced, count: sliced.length });
  } catch (err) {
    console.error("GET /api/audit error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit trail", details: (err as Error).message },
      { status: 500 }
    );
  }
}
