/**
 * BhoomiSetu — Current User Profile API
 * GET /api/me — returns the BhoomiSetu user record for the authenticated Clerk user
 * Used by /workflow page to determine role for stage-advance gating
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/db/queries/users";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserByClerkId(clerkId);

    if (!user) {
      // User is authenticated with Clerk but not yet in our DB
      // Return a minimal guest profile — upsert happens on next write action
      return NextResponse.json({
        data: {
          id: null,
          clerk_id: clerkId,
          email: null,
          role: "citizen",         // safest default
          jurisdiction: null,
        },
      });
    }

    // Never return bank_ref or sensitive fields — users table has no PII except email/contact
    return NextResponse.json({
      data: {
        id: user.id,
        clerk_id: user.clerk_id,
        email: user.email,
        role: user.role,
        jurisdiction: user.jurisdiction,
      },
    });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user profile", details: (err as Error).message },
      { status: 500 }
    );
  }
}
