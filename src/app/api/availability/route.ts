import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Vendor Availability API
 *
 * GET /api/availability?vendorId=xxx&month=YYYY-MM
 *   Returns availability entries for a vendor in a given month.
 *
 * POST /api/availability (vendor only)
 *   Body: { date, status, note?, timeSlots? }
 *   Creates or updates availability for a date.
 *
 * DELETE /api/availability?id=xxx (vendor only)
 *   Removes an availability entry.
 */

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    const month = sp.get("month"); // YYYY-MM

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    let where: any = { vendorId };
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    } else {
      // Default: next 90 days
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 90);
      where.date = { gte: now, lte: future };
    }

    const availability = await db.vendorAvailability.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ availability });
  } catch (err) {
    console.error("[api/availability] GET failed:", err);
    return NextResponse.json({ availability: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth: vendor only
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

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const body = await req.json();
    const { date, status, note, timeSlots, bookingId } = body;

    if (!date || !status) {
      return NextResponse.json({ error: "date and status required" }, { status: 400 });
    }

    const validStatuses = ["available", "busy", "booked", "holiday", "partial"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Upsert: unique [vendorId, date]
    const entry = await db.vendorAvailability.upsert({
      where: {
        vendorId_date: {
          vendorId: vendor.id,
          date: new Date(date),
        },
      },
      update: {
        status,
        note: note || null,
        timeSlots: timeSlots ? JSON.stringify(timeSlots) : null,
        bookingId: bookingId || null,
      },
      create: {
        vendorId: vendor.id,
        date: new Date(date),
        status,
        note: note || null,
        timeSlots: timeSlots ? JSON.stringify(timeSlots) : null,
        bookingId: bookingId || null,
      },
    });

    return NextResponse.json({ availability: entry });
  } catch (err) {
    console.error("[api/availability] POST failed:", err);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Auth: vendor only
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

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.vendorAvailability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/availability] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 });
  }
}
