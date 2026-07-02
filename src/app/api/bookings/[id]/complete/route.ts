import { NextRequest, NextResponse } from "next/server";
import { completeBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const booking = await completeBooking(id, body.vendorId);
    const notif = await generateBookingNotification(id, "completed").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
