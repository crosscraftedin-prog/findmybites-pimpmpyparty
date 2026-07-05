import { NextRequest, NextResponse } from "next/server";
import { getBookingTimeline } from "@/lib/bookings/booking-service";
import { verifyBookingAccess } from "@/lib/bookings/booking-access";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // ── Authorization: admin / vendor-owner / customer-owner ──
    const accessGuard = await verifyBookingAccess(id);
    if (accessGuard) return accessGuard;

    const timeline = await getBookingTimeline(id);
    return NextResponse.json({ timeline });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
