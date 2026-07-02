import { NextRequest, NextResponse } from "next/server";
import { getBookingAnalytics } from "@/lib/bookings/booking-service";

/** GET /api/bookings/analytics?vendorId=... — booking analytics */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId") ?? undefined;
    const analytics = await getBookingAnalytics(vendorId);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
