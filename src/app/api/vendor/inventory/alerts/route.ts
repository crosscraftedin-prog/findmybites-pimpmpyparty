/**
 * Live inventory alerts for the authenticated vendor.
 * GET /api/vendor/inventory/alerts
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getVendorAlerts } from "@/lib/inventory/inventory-service";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const alerts = await getVendorAlerts(vendor.id);
    return NextResponse.json({ alerts });
  } catch (err: any) {
    console.error("[inventory/alerts] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
