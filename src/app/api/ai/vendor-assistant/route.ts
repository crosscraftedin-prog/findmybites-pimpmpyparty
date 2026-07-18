import { NextRequest, NextResponse } from "next/server";
import { guardAiRoute } from "@/lib/billing/guards";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { parseJsonArray } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/vendor-assistant
 *
 * AI assistant for vendor dashboard queries.
 * Answers questions like:
 * - "What products sell best?"
 * - "How can I improve SEO?"
 * - "Which filters am I missing?"
 * - "What price should I charge?"
 *
 * Body: { message: string }
 * Returns: { reply: string, data?: any }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth
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
    const { message } = body as { message: string };

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // ── Prompt injection check on user-supplied message ──
    const sanitizeResult = sanitizePrompt(message);
    if (sanitizeResult.blocked) {
      logger.warn("ai-vendor-assistant", "Prompt injection blocked", { reason: sanitizeResult.reason, userId });
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const safeMessage = sanitizeResult.sanitized || message;

    // Find vendor
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      include: {
        products: { where: { isAvailable: true }, take: 20, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }] },
        reviews: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    // Gather vendor analytics
    let analytics: any = { views: 0, clicks: 0, productViews: 0 };
    try {
      const events = await db.vendorAnalytics.findMany({
        where: { vendorId: vendor.id, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { eventType: true },
      });
      analytics = {
        views: events.filter(e => e.eventType === "page_view").length,
        clicks: events.filter(e => e.eventType.includes("click")).length,
        productViews: events.filter(e => e.eventType === "product_view").length,
      };
    } catch {}

    // Gather filter selections
    let filterSelections: any[] = [];
    try {
      filterSelections = await db.vendorFilterValue.findMany({
        where: { vendorId: vendor.id },
        include: { filterValue: { include: { group: { select: { name: true } } } } },
      });
    } catch {}

    // Gather available filters for this category
    let availableFilters: any[] = [];
    try {
      const categoryFilters = await db.categoryFilter.findMany({
        where: { categoryId: vendor.category },
        include: {
          filterGroup: {
            include: { values: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
          },
        },
      });
      availableFilters = categoryFilters.map((cf: any) => ({
        name: cf.filterGroup.name,
        type: cf.filterGroup.type,
        values: cf.filterGroup.values.map((v: any) => v.value),
      }));
    } catch {}

    // Gather category-average pricing
    let categoryAvgPrice: any = { avg: 0, min: 0, max: 0, count: 0 };
    try {
      const categoryVendors = await db.vendor.findMany({
        where: { approved: true, category: vendor.category },
        select: { basePrice: true },
      });
      const prices = categoryVendors.map(v => v.basePrice).filter(p => p > 0);
      if (prices.length > 0) {
        categoryAvgPrice = {
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          min: Math.min(...prices),
          max: Math.max(...prices),
          count: prices.length,
        };
      }
    } catch {}

    // Build vendor context for AI
    const gallery = parseJsonArray<string>(vendor.gallery);
    const vendorContext = {
      name: vendor.name,
      category: vendor.category,
      city: vendor.city,
      rating: vendor.rating,
      basePrice: vendor.basePrice,
      currency: vendor.currency,
      description: vendor.description,
      tagline: vendor.tagline,
      heroImage: !!vendor.heroImage,
      avatarImage: !!vendor.avatarImage,
      galleryCount: gallery.length,
      productCount: vendor.products.length,
      products: vendor.products.map((p: any) => ({
        name: p.name,
        price: p.price,
        isFeatured: p.isFeatured,
        hasExtraFields: !!p.extraFields,
      })),
      reviewCount: vendor.reviews.length,
      recentReviews: vendor.reviews.slice(0, 3).map((r: any) => ({ rating: r.rating, comment: r.comment.slice(0, 100) })),
      filterSelections: filterSelections.map((fs: any) => `${fs.filterValue.group.name}: ${fs.filterValue.value}`),
      availableFilters: availableFilters.map((af: any) => af.name),
      analytics,
      categoryAvgPrice,
      metaTitle: !!vendor.metaTitle,
      metaDescription: !!vendor.metaDescription,
      whatsapp: !!vendor.whatsapp,
      instagram: !!vendor.instagram,
      website: !!vendor.website,
    };

    // Use AI to answer
    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({
        reply: "I'd love to help with your dashboard questions, but I'm having trouble connecting right now. Please try again in a moment.",
      });
    }

    const prompt = `You are Josh AI, the vendor dashboard assistant for FindMyBites × PimpMyParty. A vendor is asking you a question. Use their data to provide a helpful, specific answer.

VENDOR DATA:
${JSON.stringify(vendorContext, null, 2)}

VENDOR QUESTION: "${safeMessage}"

Rules:
- Be specific and data-driven (reference their actual numbers)
- Give actionable advice (not generic tips)
- Keep it conversational and encouraging
- 3-5 sentences max
- If they ask about pricing, compare to category average (${categoryAvgPrice.avg} ${vendor.currency})
- If they ask about filters, list which available filters they're missing
- If they ask about SEO, check metaTitle/metaDescription/gallery
- If they ask about products, reference their actual product names`;

    // ── 30-second timeout ──
    const { result: replyText, timedOut } = await callWithTimeout(async (_signal) => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 300,
      });
      return completion.choices[0]?.message?.content?.trim() || "";
    }, 30_000);

    if (timedOut) {
      logger.warn("ai-vendor-assistant", "LLM call timed out after 30s", { vendorId: vendor.id });
      return NextResponse.json({ error: "AI request timed out" }, { status: 504 });
    }

    const reply = replyText || "I'm not sure how to help with that, but you can always reach out to our support team!";

    return NextResponse.json({ reply, data: vendorContext });
  } catch (err) {
    logger.error("ai-vendor-assistant", "POST failed", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}
