import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Booking } from "@/lib/types";

function transformBooking(b: typeof db.booking): Booking {
  return {
    id: b.id,
    vendorId: b.vendorId,
    name: b.name,
    email: b.email,
    eventType: b.eventType,
    eventDate: b.eventDate,
    eventCity: b.eventCity,
    guests: b.guests,
    budget: b.budget,
    message: b.message,
    status: b.status as Booking["status"],
    createdAt: b.createdAt.toISOString(),
  };
}

/**
 * GET /api/admin/bookings?status=&page=&pageSize=
 * Returns all bookings (optionally filtered by status) with the vendor name
 * joined, newest first. Paginated.
 */
export async function GET(req: NextRequest) {
  try {
  const guard = await requireAdmin();
  if (guard) return guard;
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const pageRaw = Number(sp.get("page"));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.round(pageRaw) : 1;
    const pageSizeRaw = Number(sp.get("pageSize"));
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(100, Math.round(pageSizeRaw))
        : 25;

    const where = status ? { status } : {};
    const [total, rows] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { vendor: { select: { name: true, city: true } } },
      }),
    ]);

    const bookings = rows.map((b) => ({
      ...transformBooking(b),
      vendorName: b.vendor?.name ?? "—",
      vendorCity: b.vendor?.city ?? "",
    }));

    return NextResponse.json({
      bookings,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error("[api/admin/bookings] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
