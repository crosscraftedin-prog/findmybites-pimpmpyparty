import { NextRequest, NextResponse } from "next/server";
import { validateClaimToken, markClaimLinkOpened, startClaim } from "@/lib/admin/admin-listing-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/claim/[token] — validate a claim link and return the business name.
 *   Public (no auth) — anyone can open a claim link to see what business it's for.
 *   Marks the invite as "opened" for tracking.
 *
 * POST /api/claim/[token] — start the claim process (requires auth).
 *   The vendor must be logged in. Sets ownership_status to "pending" for admin approval.
 *   Body: { vendorName: string } (the claimant's name)
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const result = await validateClaimToken(token);
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 404 });
    }
    // Mark as opened (non-blocking)
    await markClaimLinkOpened(token).catch(() => {});
    return NextResponse.json({
      valid: true,
      vendorId: result.vendorId,
      vendorName: result.vendorName,
    });
  } catch (error: any) {
    console.error("[api/claim/[token]] GET failed:", error);
    return NextResponse.json({ valid: false, reason: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Require authentication
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required to claim a business" }, { status: 401 });
  }

  try {
    const result = await validateClaimToken(token);
    if (!result.valid || !result.vendorId) {
      return NextResponse.json({ error: result.reason || "Invalid claim link" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const claimantName = body.vendorName || user.user_metadata?.full_name || user.email || "Unknown";

    await startClaim(result.vendorId, user.id, user.email ?? "", claimantName);

    return NextResponse.json({
      success: true,
      message: "Claim submitted! An admin will review and approve your request.",
      vendorName: result.vendorName,
    });
  } catch (error: any) {
    console.error("[api/claim/[token]] POST failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
