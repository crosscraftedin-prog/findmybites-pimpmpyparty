/**
 * Vendor inventory dashboard widget data.
 * GET /api/vendor/inventory/dashboard
 *
 * Returns: today's orders, remaining stock summary, upcoming bookings,
 * availability snapshot, and live inventory alerts.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getVendorProductDashboard } from "@/lib/inventory/inventory-service";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const data = await getVendorProductDashboard(vendor.id);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[inventory/dashboard] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
