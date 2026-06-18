import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * PATCH /api/bookings/[id]
 * Update a booking's status (admin: confirm / decline / re-pending).
 * Body: { status: "pending" | "confirmed" | "declined" }
 */
const VALID_STATUSES = new Set(["pending", "confirmed", "declined"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: unknown };
    const status =
      typeof body.status === "string" && VALID_STATUSES.has(body.status)
        ? body.status
        : "";
    if (!status) {
      return NextResponse.json(
        { error: "status must be pending | confirmed | declined" },
        { status: 400 }
      );
    }
    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const updated = await db.booking.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({
      id: updated.id,
      status: updated.status as "pending" | "confirmed" | "declined",
    });
  } catch (err) {
    console.error("[api/bookings/[id]] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

/** DELETE /api/bookings/[id] — permanently remove a booking (admin). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    await db.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/bookings/[id]] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
