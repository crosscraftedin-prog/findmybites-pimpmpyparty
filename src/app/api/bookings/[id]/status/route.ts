import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/bookings/[id]/status
 *
 * Updates a booking's status in the pipeline.
 * Pipeline: new → viewed → contacted → quote_sent → negotiating → deposit_paid → confirmed → completed | cancelled
 *
 * Vendor auth required (vendor must own the booking).
 */

const VALID_STATUSES = new Set([
  "new", "viewed", "contacted", "quote_sent", "negotiating",
  "deposit_paid", "confirmed", "completed", "cancelled",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + Array.from(VALID_STATUSES).join(", ") },
        { status: 400 }
      );
    }

    // Auth: vendor must own this booking
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = user?.id ?? null;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify booking belongs to vendor owned by user
    const booking = await db.booking.findUnique({
      where: { id },
      select: { vendorId: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const vendor = await db.vendor.findFirst({
      where: { id: booking.vendorId, owner_user_id: userId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updated = await db.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[api/bookings/[id]/status] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
