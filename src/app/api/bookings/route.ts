import { NextRequest, NextResponse } from "next/server";
import { type Booking as DbBooking } from "@prisma/client";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Booking as ApiBooking } from "@/lib/types";

function transformBooking(b: DbBooking): ApiBooking {
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
    status: b.status as ApiBooking["status"],
    createdAt: b.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    // Require auth — bookings contain customer PII (name, email, message)
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vendorId = req.nextUrl.searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ bookings: [] });
    }

    const bookings = await db.booking.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ bookings: bookings.map(transformBooking) });
  } catch (err) {
    console.error("[api/bookings] GET failed:", err);
    return NextResponse.json({ bookings: [] });
  }
}

interface CreateBookingBody {
  vendorId?: unknown;
  name?: unknown;
  email?: unknown;
  eventType?: unknown;
  eventDate?: unknown;
  eventCity?: unknown;
  guests?: unknown;
  budget?: unknown;
  message?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 5 bookings per minute per IP (prevent spam)
    const limited = rateLimit(req, { windowMs: 60_000, max: 5 });
    if (limited) return limited;

    const body = (await req.json()) as CreateBookingBody;
    const {
      vendorId,
      name,
      email,
      eventType,
      eventDate,
      eventCity,
      guests,
      budget,
      message,
    } = body ?? {};

    if (
      typeof vendorId !== "string" ||
      !vendorId ||
      typeof name !== "string" ||
      !name ||
      typeof email !== "string" ||
      !email ||
      typeof eventDate !== "string" ||
      !eventDate ||
      typeof message !== "string" ||
      !message
    ) {
      return NextResponse.json(
        { error: "vendorId, name, email, eventDate, and message are required" },
        { status: 400 }
      );
    }

    const guestsNum = Number(guests);
    const guestsInt = Number.isFinite(guestsNum)
      ? Math.max(0, Math.floor(guestsNum))
      : 0;

    const booking = await db.booking.create({
      data: {
        vendorId,
        name,
        email,
        eventType: typeof eventType === "string" ? eventType : "",
        eventDate,
        eventCity: typeof eventCity === "string" ? eventCity : "",
        guests: guestsInt,
        budget: typeof budget === "string" ? budget : "",
        message,
        status: "pending",
      },
    });

    return NextResponse.json(
      { booking: transformBooking(booking) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/bookings] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
