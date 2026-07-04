/**
 * GET /api/vendor/marketing/analytics?period=week&days=30
 * Returns KPI comparison (today/week/month/last_month) + time-series + top products + competitor insights.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import {
  getKpiComparison, getAnalyticsSeries, getTopProducts, getCompetitorInsights,
  type PeriodKey,
} from "@/lib/marketing/growth-service";

export async function GET(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const period = (sp.get("period") as PeriodKey) || "week";
  const days = Math.min(Math.max(Number(sp.get("days")) || 30, 7), 90);
  try {
    const [kpis, series, topProducts, competitors] = await Promise.all([
      getKpiComparison(vendor.id, period),
      getAnalyticsSeries(vendor.id, days),
      getTopProducts(vendor.id, 5),
      getCompetitorInsights(vendor.id),
    ]);
    return NextResponse.json({ kpis, series, topProducts, competitors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
