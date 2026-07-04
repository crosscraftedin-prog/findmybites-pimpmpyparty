/**
 * Vendor inventory analytics.
 * GET /api/vendor/inventory/analytics?days=30
 *
 * Returns: per-product views/enquiries/bookings/revenue/conversion,
 * totals, top products, and low-inventory list.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getVendorAnalytics } from "@/lib/inventory/inventory-service";

export async function GET(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 30, 1), 365);
  try {
    const data = await getVendorAnalytics(vendor.id, days);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[inventory/analytics] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
