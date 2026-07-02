import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { computeOnboarding } from "@/lib/vendor/onboarding-service";

/**
 * GET /api/vendor/onboarding
 * Returns the vendor's onboarding state (completion %, checklist, next step).
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find vendor by owner_user_id
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: session.user.id },
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
