/** GET /api/vendor/success-center — aggregated success center data */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getSuccessCenterData } from "@/lib/success/success-service";
import { logger } from "@/lib/logger";

// Properly-shaped empty SuccessCenterData — matches the SuccessData interface
// the <SuccessCenter> component expects.  Returning a flat structure caused
// `Cannot read properties of undefined (reading 'map')` crashes.
const EMPTY_SUCCESS_DATA = {
  scores: [],
  overallHealth: 0,
  checklist: { items: [], completed: 0, total: 0 },
  recommendations: [],
  performance: { daily: [], weekly: [], monthly: [], yearly: [] },
  competitors: [],
  reviews: { averageRating: 0, totalReviews: 0, recentReviews: [], pendingRequests: 0 },
  customers: { totalCustomers: 0, repeatCustomers: 0, recentCustomers: [], avgOrderValue: 0 },
  financial: { totalRevenue: 0, pendingPayments: 0, completedOrders: 0, cancelledOrders: 0, avgOrderValue: 0, monthlyRevenue: 0 },
  goals: [],
  achievements: [],
  series: [],
  topProducts: [],
};

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const data = await getSuccessCenterData(vendor.id);
    return NextResponse.json(data);
  } catch (err: any) {
    // Return properly-shaped empty data — prevents dashboard crash
    logger.warn("success-center", "Failed to load data — returning empty", {
      error: err?.message?.slice(0, 200),
      stack: err?.stack?.slice(0, 300),
      vendorId: vendor.id,
    });
    return NextResponse.json(EMPTY_SUCCESS_DATA);
  }
}
