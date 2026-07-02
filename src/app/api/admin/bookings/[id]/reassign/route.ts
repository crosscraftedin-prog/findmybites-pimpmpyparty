import { NextRequest, NextResponse } from "next/server";
import { reassignBooking } from "@/lib/bookings/booking-service";

/** POST /api/admin/bookings/[id]/reassign — reassign booking to another vendor */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const booking = await reassignBooking(id, body.newVendorId, body.adminId ?? "admin");
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
