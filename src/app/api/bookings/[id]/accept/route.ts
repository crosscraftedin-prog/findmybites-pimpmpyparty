import { NextRequest, NextResponse } from "next/server";
import { acceptBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const booking = await acceptBooking(id, body.vendorId);
    const notif = await generateBookingNotification(id, "accepted").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
