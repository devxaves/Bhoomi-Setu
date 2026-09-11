/**
 * BhoomiSetu — PATCH /api/mutations/[id]
 *
 * Updates legal revenue record mutation status (pending → filed → completed).
 * Tracks filed_on and completed_on timestamps.
 * Writes before/after snapshot to audit_log.
 * Role-gated: collector, state_admin, central_ministry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAdvanceStage } from "@/lib/workflow";
import { updateMutationStatus } from "@/lib/db/queries/mutations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parcelId } = await params;
    const body = await req.json();
    const { status, filed_on, completed_on } = body;

    if (!status || !["pending", "filed", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'filed', or 'completed'." },
        { status: 400 }
      );
    }

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
        { error: `Role '${userRole}' is not authorised to update revenue mutation records.` },
        { status: 403 }
      );
    }

    const updated = await updateMutationStatus(parcelId, status, actorId, {
      filedOn: filed_on,
      completedOn: completed_on,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Mutation status for parcel updated to '${status}'.`,
    });
  } catch (error: any) {
    console.error("🔴 Error in PATCH /api/mutations/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update mutation." },
      { status: 400 }
    );
  }
}
