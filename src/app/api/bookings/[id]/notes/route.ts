import { NextRequest, NextResponse } from "next/server";
import { addInternalNote, getBookingNotes } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await addInternalNote(id, body.vendorId, body.note, body.authorName ?? "Vendor", body.isInternal ?? true);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notes = await getBookingNotes(id);
    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
