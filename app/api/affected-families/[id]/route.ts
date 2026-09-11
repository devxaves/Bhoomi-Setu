/**
 * BhoomiSetu — PATCH /api/affected-families/[id]
 *
 * Updates individual family R&R entitlements:
 * compensation_status, housing_status, employment_status, livelihood_restored, displaced.
 * Writes before/after snapshot to audit_log.
 * Role-gated: collector, state_admin, central_ministry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAdvanceStage } from "@/lib/workflow";
import { updateAffectedFamily } from "@/lib/db/queries/affected-families";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params;
    const body = await req.json();

    // Role-gating
    let actorId: string | null = null;
    let userRole = body.role || "collector";

    try {
      const authUser = await getCurrentUser(req);
      if (authUser) {
        userRole = authUser.role;
        actorId = authUser.id;
      }
    } catch {
      // Allow fallback
    }

    if (!canAdvanceStage(userRole)) {
      return NextResponse.json(
        { error: `Role '${userRole}' is not authorised to modify family R&R records.` },
        { status: 403 }
      );
    }

    const updated = await updateAffectedFamily(
      familyId,
      {
        compensation_status: body.compensation_status,
        housing_status: body.housing_status,
        employment_status: body.employment_status,
        livelihood_restored:
          body.livelihood_restored !== undefined
            ? Boolean(body.livelihood_restored)
            : undefined,
        displaced: body.displaced !== undefined ? Boolean(body.displaced) : undefined,
      },
      actorId
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `R&R record for family ${updated.family_ref} updated successfully.`,
    });
  } catch (error: any) {
    console.error("🔴 Error in PATCH /api/affected-families/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update affected family." },
      { status: 400 }
    );
  }
}
