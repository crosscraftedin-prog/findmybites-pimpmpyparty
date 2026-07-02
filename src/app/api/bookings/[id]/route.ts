import { NextRequest, NextResponse } from "next/server";
import { getBooking, getBookingNotes, getBookingTimeline } from "@/lib/bookings/booking-service";

/**
 * GET /api/bookings/[id]
 * Returns booking details + notes + timeline (events).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sp = req.nextUrl.searchParams;
    const includeNotes = sp.get("includeNotes") !== "false";
    const includeTimeline = sp.get("includeTimeline") === "true";

    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const result: any = { booking };
    if (includeNotes) result.notes = await getBookingNotes(id);
    if (includeTimeline) result.timeline = await getBookingTimeline(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[bookings/[id]] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
