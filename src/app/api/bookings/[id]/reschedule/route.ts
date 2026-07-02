import { NextRequest, NextResponse } from "next/server";
import { rescheduleBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const booking = await rescheduleBooking(id, body.vendorId, body.newDate, body.newTime);
    const notif = await generateBookingNotification(id, "rescheduled").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
