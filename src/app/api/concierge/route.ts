import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * Concierge Events API
 *
 * POST /api/concierge — create a concierge event (from Josh AI detection or admin)
 *   Body: { customerName, customerEmail, customerPhone, eventType, eventDate, eventCity, guests, budget, notes }
 *
 * GET /api/concierge — list all concierge events (admin only)
 * GET /api/concierge?email=xxx — list concierge events for a customer
 */

export async function GET(req: NextRequest) {
  // Admin-only for listing all
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const sp = req.nextUrl.searchParams;
    const email = sp.get("email");

    const where = email ? { customerEmail: email } : {};

    const events = await db.conciergeEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[api/concierge] GET failed:", err);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, customerEmail, customerPhone,
      eventType, eventDate, eventCity, guests, budget, notes,
    } = body;

    if (!customerName || !customerEmail || !eventType || !eventDate) {
      return NextResponse.json(
        { error: "customerName, customerEmail, eventType, eventDate required" },
        { status: 400 }
      );
    }

    const event = await db.conciergeEvent.create({
      data: {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone || null,
        eventType,
        eventDate,
        eventCity: eventCity || "",
        guests: guests || 0,
        budget: budget || "Not specified",
        notes: notes || null,
        status: "new",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[api/concierge] POST failed:", err);
    return NextResponse.json({ error: "Failed to create concierge event" }, { status: 500 });
  }
}
