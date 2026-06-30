import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/quotes/[id]/respond
 *
 * Customer responds to a quote.
 * Body: { response: "accepted" | "rejected" | "changes_requested", notes?: string }
 *
 * Public endpoint (customer doesn't need auth — they received the quote via email link).
 * The quote ID serves as authentication.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { response, notes } = body as { response?: string; notes?: string };

    if (!response || !["accepted", "rejected", "changes_requested"].includes(response)) {
      return NextResponse.json(
        { error: "response must be: accepted, rejected, or changes_requested" },
        { status: 400 }
      );
    }

    const quote = await db.quote.findUnique({
      where: { id },
      select: { bookingId: true, status: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const updated = await db.quote.update({
      where: { id },
      data: {
        customerResponse: response,
        customerNotes: notes || null,
        status: response === "accepted" ? "accepted" : response === "rejected" ? "rejected" : "sent",
      },
    });

    // Update booking status based on quote response
    if (response === "accepted") {
      await db.booking.update({
        where: { id: quote.bookingId },
        data: { status: "confirmed" },
      });
    }

    return NextResponse.json({ quote: updated });
  } catch (err) {
    console.error("[api/quotes/[id]/respond] POST failed:", err);
    return NextResponse.json({ error: "Failed to respond to quote" }, { status: 500 });
  }
}
