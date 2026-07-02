import { NextRequest, NextResponse } from "next/server";
import { cancelBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const booking = await cancelBooking(id, body.actorId ?? null, body.actorRole ?? "vendor", body.reason);
    const notif = await generateBookingNotification(id, "cancelled").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
