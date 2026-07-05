import { NextRequest, NextResponse } from "next/server";
import { addInternalNote, getBookingNotes } from "@/lib/bookings/booking-service";
import { verifyBookingAccess } from "@/lib/bookings/booking-access";
import { resolveVendorFromSession } from "@/lib/vendor-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // ── Authorization: admin / vendor-owner / customer-owner ──
    const accessGuard = await verifyBookingAccess(id);
    if (accessGuard) return accessGuard;

    const body = await req.json();

    // Resolve vendorId from session (never trust body.vendorId)
    const vendor = await resolveVendorFromSession();
    const vendorId = vendor?.id ?? body.vendorId;

    await addInternalNote(id, vendorId, body.note, body.authorName ?? "Vendor", body.isInternal ?? true);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // ── Authorization: admin / vendor-owner / customer-owner ──
    const accessGuard = await verifyBookingAccess(id);
    if (accessGuard) return accessGuard;

    const notes = await getBookingNotes(id);
    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
