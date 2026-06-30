import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * PATCH /api/admin/bookings/[id]
 *
 * Admin-only override of a booking. Supports:
 *   - status: pipeline status override (new/viewed/contacted/quote_sent/negotiating/deposit_paid/confirmed/completed/cancelled)
 *   - conciergeEventId: link this booking to a concierge event (set to event id, or null to unlink)
 *   - notes: internal admin notes (free text)
 *
 * Admin auth required.
 */

const VALID_STATUSES = new Set([
  "new", "viewed", "contacted", "quote_sent", "negotiating",
  "deposit_paid", "confirmed", "completed", "cancelled",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, conciergeEventId, notes } = body as {
      status?: string;
      conciergeEventId?: string | null;
      notes?: string;
    };

    const existing = await db.booking.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.has(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be one of: " + Array.from(VALID_STATUSES).join(", ") },
          { status: 400 }
        );
      }
      data.status = status;
    }
    if (conciergeEventId !== undefined) {
      // null unlink is allowed; otherwise verify event exists
      if (conciergeEventId !== null) {
        const event = await db.conciergeEvent.findUnique({
          where: { id: conciergeEventId },
          select: { id: true },
        });
        if (!event) {
          return NextResponse.json(
            { error: "Concierge event not found" },
            { status: 400 }
          );
        }
      }
      data.conciergeEventId = conciergeEventId;
    }
    if (notes !== undefined) {
      data.notes = notes;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await db.booking.update({
      where: { id },
      data,
    });

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[api/admin/bookings/[id]] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
