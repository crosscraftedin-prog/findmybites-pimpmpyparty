import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { parseJsonArray } from "@/lib/format";

/**
 * POST /api/ai/event-planner
 *
 * Smart event planning — recommends a complete vendor package for an event.
 *
 * Body: { eventType: string, city: string, budget?: number, guests?: number, notes?: string }
 * Returns: { plan: [{ category, role, vendors: [...] }], aiSummary: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, city, budget, guests, notes } = body as {
      eventType: string; city: string; budget?: number; guests?: number; notes?: string;
    };

    if (!eventType || !city) {
      return NextResponse.json({ error: "eventType and city required" }, { status: 400 });
    }

    // Event type → categories mapping (from DB, but we need a base plan)
    const EVENT_PLANS: Record<string, { category: string; role: string; note: string }[]> = {
      "Wedding": [
        { category: "bakers-bakery", role: "Wedding Cake", note: "Multi-tier, custom design" },
        { category: "decorators", role: "Decoration", note: "Wedding theme, floral + lighting" },
        { category: "venues", role: "Venue", note: "Reception venue for ceremony + dinner" },
        { category: "photographers", role: "Photography", note: "Full-day coverage + album" },
        { category: "videographers", role: "Videography", note: "Cinematic wedding film" },
        { category: "djs", role: "Music", note: "Reception DJ + dance floor" },
        { category: "florists", role: "Flowers", note: "Bridal bouquet + centerpieces" },
        { category: "makeup-artists", role: "Bridal Makeup", note: "HD or airbrush bridal makeup" },
        { category: "caterers", role: "Catering", note: "Wedding menu for all guests" },
        { category: "invitation-printing", role: "Invitations", note: "Wedding invitation cards" },
        { category: "transportation", role: "Transport", note: "Wedding car for bride/groom" },
      ],
      "Birthday": [
        { category: "bakers-bakery", role: "Birthday Cake", note: "Themed birthday cake" },
        { category: "decorators", role: "Decoration", note: "Balloon decor + theme setup" },
        { category: "photographers", role: "Photography", note: "Event coverage" },
        { category: "djs", role: "Music", note: "Party DJ" },
        { category: "entertainers", role: "Entertainment", note: "Kids entertainment if needed" },
        { category: "caterers", role: "Catering", note: "Food for guests" },
        { category: "party-supplies", role: "Party Supplies", note: "Balloons, props, tableware" },
      ],
      "Corporate": [
        { category: "venues", role: "Venue", note: "Conference hall or banquet" },
        { category: "caterers", role: "Catering", note: "Corporate lunch/buffet" },
        { category: "audio-visual-services", role: "AV & Sound", note: "Sound system + projection" },
        { category: "photographers", role: "Photography", note: "Event coverage" },
        { category: "event-planners", role: "Event Planning", note: "Corporate event coordination" },
      ],
      "Baby Shower": [
        { category: "bakers-bakery", role: "Cake", note: "Baby shower themed cake" },
        { category: "decorators", role: "Decoration", note: "Pastel balloon decor" },
        { category: "photographers", role: "Photography", note: "Maternity + event shoot" },
        { category: "florists", role: "Flowers", note: "Soft floral arrangements" },
        { category: "caterers", role: "Catering", note: "Tea party catering" },
      ],
      "Engagement": [
        { category: "bakers-bakery", role: "Cake", note: "Engagement cake" },
        { category: "decorators", role: "Decoration", note: "Ring ceremony decor" },
        { category: "photographers", role: "Photography", note: "Engagement shoot" },
        { category: "florists", role: "Flowers", note: "Bouquets + decor" },
        { category: "venues", role: "Venue", note: "Intimate venue" },
      ],
      "default": [
        { category: "bakers-bakery", role: "Cake", note: "Custom cake" },
        { category: "decorators", role: "Decoration", note: "Event decoration" },
        { category: "photographers", role: "Photography", note: "Event coverage" },
        { category: "caterers", role: "Catering", note: "Food for guests" },
      ],
    };

    const plan = EVENT_PLANS[eventType] || EVENT_PLANS["default"];

    // Fetch vendors for each category in the city
    const planWithVendors = await Promise.all(
      plan.map(async (item) => {
        let vendors: any[] = [];
        try {
          vendors = await db.vendor.findMany({
            where: {
              approved: true,
              category: item.category,
              city: { contains: city, mode: "insensitive" },
            },
            orderBy: [{ featured: "desc" }, { rating: "desc" }],
            take: 3,
            select: {
              id: true, name: true, slug: true, rating: true, reviewCount: true,
              basePrice: true, currency: true, avatarImage: true, featured: true,
              verified: true, tagline: true,
            },
          });
        } catch {}

        // If no vendors in that city, try same country or any
        if (vendors.length === 0) {
          try {
            vendors = await db.vendor.findMany({
              where: { approved: true, category: item.category },
              orderBy: [{ featured: "desc" }, { rating: "desc" }],
              take: 3,
              select: {
                id: true, name: true, slug: true, rating: true, reviewCount: true,
                basePrice: true, currency: true, avatarImage: true, featured: true,
                verified: true, tagline: true, city: true,
              },
            });
          } catch {}
        }

        return { ...item, vendors };
      })
    );

    // Generate AI summary
    let aiSummary = `Here's your ${eventType} plan for ${city}${guests ? ` with ${guests} guests` : ""}. I've found vendors for each category — tap any to view their profile.`;

    const zai = await getZAI();
    if (zai) {
      try {
        const vendorSummary = planWithVendors.map(p =>
          `${p.role}: ${p.vendors.length > 0 ? p.vendors.map(v => v.name).join(", ") : "No vendors found yet"}`
        ).join("\n");

        const prompt = `Write a friendly 2-3 sentence summary for this event plan. Be warm and encouraging.

Event: ${eventType}
City: ${city}
Guests: ${guests || "not specified"}
Budget: ${budget || "not specified"}
Notes: ${notes || "none"}

Vendors found:
${vendorSummary}

Return only the summary text, no JSON.`;

        const completion = await zai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 150,
        });
        const aiText = completion.choices[0]?.message?.content?.trim();
        if (aiText) aiSummary = aiText;
      } catch {}
    }

    return NextResponse.json({
      plan: planWithVendors,
      aiSummary,
      eventType,
      city,
      budget: budget || null,
      guests: guests || null,
    });
  } catch (err) {
    console.error("[api/ai/event-planner] POST failed:", err);
    return NextResponse.json({ error: "Event planning failed" }, { status: 500 });
  }
}
