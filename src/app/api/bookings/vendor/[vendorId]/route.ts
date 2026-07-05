import { NextRequest, NextResponse } from "next/server";
import { getVendorDashboard } from "@/lib/bookings/booking-service";
import { requireAdmin } from "@/lib/admin-guard";
import { resolveVendorFromSession } from "@/lib/vendor-session";

/**
 * GET /api/bookings/vendor/[vendorId] — vendor dashboard stats + recent bookings.
 *
 * Authorization: admin can view any vendor's dashboard; vendors can only view
 * their own (the URL vendorId must match their session vendor id).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await params;

    // ── Authorization ──
    const adminGuard = await requireAdmin();
    if (adminGuard) {
      // Not admin — must be the vendor themselves
      const vendor = await resolveVendorFromSession();
      if (!vendor) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (vendor.id !== vendorId) {
        return NextResponse.json({ error: "Not authorized to view this vendor's dashboard" }, { status: 403 });
      }
    }

    const dashboard = await getVendorDashboard(vendorId);
    return NextResponse.json(dashboard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
