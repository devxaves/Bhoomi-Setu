/**
 * BhoomiSetu — POST /api/risk/recompute-all
 *
 * Batch recomputes risk scores and structured reasons for all projects and parcels
 * in the database. Synchronises both risk_scores table and entity columns.
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db/pool";
import { computeEntityRisk } from "@/lib/risk-engine";

export async function POST() {
  try {
    const projectsRes = await query<{ id: string }>("SELECT id FROM projects");
    const parcelsRes = await query<{ id: string }>("SELECT id FROM parcels");

    const recomputedProjects: string[] = [];
    const recomputedParcels: string[] = [];
    const errors: string[] = [];

    // Recompute all projects
    for (const p of projectsRes.rows) {
      try {
        await computeEntityRisk("project", p.id, { persist: true });
        recomputedProjects.push(p.id);
      } catch (err: any) {
        errors.push(`Project ${p.id}: ${err.message}`);
      }
    }

    // Recompute all parcels
    for (const par of parcelsRes.rows) {
      try {
        await computeEntityRisk("parcel", par.id, { persist: true });
        recomputedParcels.push(par.id);
      } catch (err: any) {
        errors.push(`Parcel ${par.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recomputed ${recomputedProjects.length} projects and ${recomputedParcels.length} parcels.`,
      projectsCount: recomputedProjects.length,
      parcelsCount: recomputedParcels.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("🔴 Error in /api/risk/recompute-all:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to batch recompute risk scores." },
      { status: 500 }
    );
  }
}
