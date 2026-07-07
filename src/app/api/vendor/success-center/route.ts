/** GET /api/vendor/success-center — aggregated success center data */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getSuccessCenterData } from "@/lib/success/success-service";
import { logger } from "@/lib/logger";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const data = await getSuccessCenterData(vendor.id);
    return NextResponse.json(data);
  } catch (err: any) {
    // Return empty data instead of 500 — prevents dashboard crash
    logger.warn("success-center", "Failed to load data — returning empty", {
      error: err?.message?.slice(0, 100),
      vendorId: vendor.id,
    });
    return NextResponse.json({
      recommendations: [],
      kpiComparison: null,
      analyticsSeries: [],
      topProducts: [],
      alerts: [],
      seoAnalysis: null,
      competitorInsights: null,
      productCount: 0,
      subscription: null,
      recentReviews: [],
      recentBookings: [],
    });
  }
}
