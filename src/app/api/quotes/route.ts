import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Quotes API
 *
 * POST /api/quotes — create a quote for a booking (vendor only)
 *   Body: { bookingId, lineItems, totalAmount, currency, depositType, depositValue, aiNotes, validUntil }
 *
 * GET /api/quotes?bookingId=xxx — list quotes for a booking (vendor or customer)
 * GET /api/quotes?vendorId=xxx — list all quotes for a vendor (vendor only)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const bookingId = sp.get("bookingId");
    const vendorId = sp.get("vendorId");

    if (!bookingId && !vendorId) {
      return NextResponse.json({ error: "bookingId or vendorId required" }, { status: 400 });
    }

    // Auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = user?.id ?? null;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }

    const where: any = {};
    if (bookingId) where.bookingId = bookingId;
    if (vendorId) where.vendorId = vendorId;

    const quotes = await db.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: { id: true, name: true, email: true, eventType: true, eventDate: true, guests: true },
        },
      },
    });

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("[api/quotes] GET failed:", err);
    return NextResponse.json({ quotes: [] });
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

    const body = await req.json();
    const {
      bookingId, lineItems, totalAmount, currency,
      depositType, depositValue, aiNotes, validUntil,
    } = body;

    if (!bookingId || !totalAmount) {
      return NextResponse.json({ error: "bookingId and totalAmount required" }, { status: 400 });
    }

    // Verify booking belongs to vendor
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { vendorId: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const vendor = await db.vendor.findFirst({
      where: { id: booking.vendorId, owner_user_id: userId },
      select: { id: true, currency: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const quote = await db.quote.create({
      data: {
        bookingId,
        vendorId: booking.vendorId,
        lineItems: JSON.stringify(lineItems || []),
        totalAmount: Number(totalAmount),
        currency: currency || vendor.currency || "USD",
        depositType: depositType || "percentage",
        depositValue: Number(depositValue) || 50,
        aiNotes: aiNotes || null,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "sent",
      },
    });

    // Update booking status to "quote_sent"
    await db.booking.update({
      where: { id: bookingId },
      data: { status: "quote_sent" },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    console.error("[api/quotes] POST failed:", err);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
