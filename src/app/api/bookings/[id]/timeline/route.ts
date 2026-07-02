import { NextRequest, NextResponse } from "next/server";
import { getBookingTimeline } from "@/lib/bookings/booking-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const timeline = await getBookingTimeline(id);
    return NextResponse.json({ timeline });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
