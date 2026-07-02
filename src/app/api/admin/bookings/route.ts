import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { searchBookings, getBookingAnalytics, cancelBooking } from "@/lib/bookings/booking-service";

/** GET /api/admin/bookings?search=...&status=...&city=... — all bookings (admin) */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const sp = req.nextUrl.searchParams;
    const [bookings, analytics] = await Promise.all([
      searchBookings({
        status: (sp.get("status") as any) ?? undefined,
        city: sp.get("city") ?? undefined,
        search: sp.get("search") ?? undefined,
        dateFrom: sp.get("dateFrom") ?? undefined,
        dateTo: sp.get("dateTo") ?? undefined,
        limit: sp.get("limit") ? parseInt(sp.get("limit")!) : 100,
        offset: sp.get("offset") ? parseInt(sp.get("offset")!) : 0,
      }),
      getBookingAnalytics(),
    ]);
    return NextResponse.json({ bookings, count: bookings.length, analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** POST /api/admin/bookings — admin cancel booking */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const body = await req.json();
    if (body.action === "cancel") {
      const booking = await cancelBooking(body.bookingId, body.adminId ?? null, "admin", body.reason);
      return NextResponse.json({ success: true, booking });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
