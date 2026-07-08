import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { computeOnboarding } from "@/lib/vendor/onboarding-service";

/**
 * GET /api/vendor/onboarding
 * Returns the vendor's onboarding state (completion %, checklist, next step).
 *
 * Uses getUser() first (verifies JWT with Supabase server), then falls back
 * to getSession() — same pattern as resolveVendorFromSession().
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Step 1: Try getUser() (verifies JWT, more reliable on Vercel)
    let userId: string | null = null;
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!userErr && user?.id) userId = user.id;
    } catch {}

    // Step 2: Fallback to getSession()
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) userId = session.user.id;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find vendor by owner_user_id
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const onboarding = await computeOnboarding(vendor.id);
    if (!onboarding) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(onboarding);
  } catch (error: any) {
    console.error("[vendor/onboarding] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
