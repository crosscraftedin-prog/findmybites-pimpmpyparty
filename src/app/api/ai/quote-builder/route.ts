import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/quote-builder
 *
 * AI-powered quote builder for vendors.
 * Body: { bookingId: string }
 *
 * Generates a professional quotation using:
 *   - The enquiry details (event type, guests, budget, date)
 *   - The vendor's products/services
 *   - Marketplace pricing data
 *
 * Returns:
 *   - lineItems: [{ label, qty, price }]
 *   - totalAmount: number
 *   - aiNotes: professional cover letter
 *   - suggestedDeposit: { type, value }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: must be a vendor
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
    const { bookingId } = body as { bookingId?: string };

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    // Fetch booking + vendor + products
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendor: {
          select: { id: true, name: true, owner_user_id: true, currency: true, basePrice: true, category: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify ownership
    if (booking.vendor?.owner_user_id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Fetch vendor's products for pricing reference
    const products = await db.product.findMany({
      where: { vendorId: booking.vendorId, isAvailable: true },
      select: { name: true, price: true, packageType: true, capacity: true, duration: true },
      take: 10,
      orderBy: [{ isFeatured: "desc" }],
    });

    const currency = booking.vendor?.currency || "USD";
    const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "AED" ? "AED" : "";

    // Build quote using template logic (AI enhances if available)
    const lineItems: { label: string; qty: number; price: number }[] = [];

    // Add main service/product
    if (products.length > 0) {
      const mainProduct = products[0];
      lineItems.push({
        label: mainProduct.name,
        qty: 1,
        price: mainProduct.price,
      });
    } else {
      // Use base price
      const basePrice = booking.vendor?.basePrice || 0;
      const estimatedPrice = booking.guests > 0
        ? basePrice * Math.max(1, Math.ceil(booking.guests / 50))
        : basePrice;
      lineItems.push({
        label: `${booking.eventType} service`,
        qty: 1,
        price: estimatedPrice,
      });
    }

    // Add per-head items if guests > 0
    if (booking.guests > 0 && products.length > 1) {
      const perHeadProduct = products.find((p) => p.capacity && p.capacity > 0);
      if (perHeadProduct) {
        lineItems.push({
          label: `${perHeadProduct.name} (per head)`,
          qty: booking.guests,
          price: perHeadProduct.price,
        });
      }
    }

    const totalAmount = lineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

    // Generate AI cover letter
    let aiNotes = `Thank you for your enquiry regarding ${booking.eventType} on ${booking.eventDate}. We're delighted to provide you with a quotation for ${booking.guests} guests.`;

    const zai = await getZAI();
    if (zai) {
      // ── Prompt injection check on customer-submitted notes/message ──
      const customerNotes = booking.notes || booking.message || "";
      const sanitizeResult = sanitizePrompt(customerNotes);
      if (sanitizeResult.blocked) {
        logger.warn("ai-quote-builder", "Prompt injection blocked", { reason: sanitizeResult.reason, bookingId });
      } else {
        const safeNotes = sanitizeResult.sanitized || customerNotes;
        try {
          const prompt = `Write a professional, friendly quote cover letter from ${booking.vendor?.name} to a customer.

Enquiry details:
- Event: ${booking.eventType}
- Date: ${booking.eventDate}
- Guests: ${booking.guests}
- Budget: ${booking.budget}
- City: ${booking.eventCity}
- Notes: ${safeNotes || "None"}

Quote total: ${symbol}${totalAmount.toLocaleString()}

Keep it under 100 words. Professional but warm. Mention the total amount and that a deposit secures the booking. Do not use placeholders.`;

          // ── 30-second timeout ──
          const { result: aiText, timedOut } = await callWithTimeout(async (_signal) => {
            const completion = await zai.chat.completions.create({
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 150,
            });
            return completion.choices[0]?.message?.content?.trim() || "";
          }, 30_000);

          if (timedOut) {
            logger.warn("ai-quote-builder", "LLM call timed out after 30s", { bookingId });
          } else if (aiText) {
            aiNotes = aiText;
          }
        } catch (e) {
          logger.error("ai-quote-builder", "AI cover letter failed", { message: e instanceof Error ? e.message : String(e), bookingId });
          // keep template notes
        }
      }
    }

    // Suggest deposit (50% for events, 30% for food orders)
    const isEvent = booking.eventType.toLowerCase().includes("wedding") ||
                    booking.eventType.toLowerCase().includes("corporate") ||
                    booking.eventType.toLowerCase().includes("party");
    const suggestedDeposit = {
      type: "percentage" as const,
      value: isEvent ? 50 : 30,
    };

    return NextResponse.json({
      lineItems,
      totalAmount,
      currency,
      aiNotes,
      suggestedDeposit,
      source: zai ? "ai" : "template",
    });
  } catch (err) {
    logger.error("ai-quote-builder", "POST failed", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Failed to build quote" }, { status: 500 });
  }
}
