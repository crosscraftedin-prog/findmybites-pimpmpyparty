import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminOnboardingOverview } from "@/lib/vendor/onboarding-service";

/**
 * GET /api/admin/vendor-onboarding
 * Returns all vendors with their completion % and status.
 * Supports filter by completion range: ?filter=0-25|25-50|50-75|75-99|100
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const sp = req.nextUrl.searchParams;
    const filter = sp.get("filter"); // e.g. "0-25", "25-50", etc.

    let overview = await getAdminOnboardingOverview();

    if (filter) {
      const [min, max] = filter.split("-").map(Number);
      overview = overview.filter(v => v.completion >= min && v.completion < (max === 100 ? 101 : max + 1));
    }

    return NextResponse.json({
      vendors: overview,
      total: overview.length,
      summary: {
        live: overview.filter(v => v.completion >= 100).length,
        almostReady: overview.filter(v => v.completion >= 75 && v.completion < 100).length,
        halfway: overview.filter(v => v.completion >= 50 && v.completion < 75).length,
        incomplete: overview.filter(v => v.completion < 50).length,
      },
    });
  } catch (error: any) {
    console.error("[admin/vendor-onboarding] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
