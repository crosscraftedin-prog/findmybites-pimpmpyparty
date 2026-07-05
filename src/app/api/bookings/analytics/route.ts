import { NextRequest, NextResponse } from "next/server";
import { getBookingAnalytics } from "@/lib/bookings/booking-service";
import { requireAdmin } from "@/lib/admin-guard";
import { resolveVendorFromSession } from "@/lib/vendor-session";

/**
 * GET /api/bookings/analytics?vendorId=...
 * Booking analytics (vendor/admin only).
 *
 * Authorization: admin can view analytics for any vendorId; vendors can only
 * view their own (query param vendorId is ignored for non-admins).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    let vendorId = sp.get("vendorId") ?? undefined;

    // ── Authorization ──
    const adminGuard = await requireAdmin();
    if (adminGuard) {
      // Not admin — must be an authenticated vendor, scope to own
      const vendor = await resolveVendorFromSession();
      if (!vendor) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      vendorId = vendor.id; // force scope to session vendor
    }

    const analytics = await getBookingAnalytics(vendorId);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
