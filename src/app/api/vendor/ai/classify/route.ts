/**
 * POST /api/vendor/ai/classify
 *
 * AI Auto-Classification: takes a one-sentence business description
 * and returns suggested marketplace, category, subcategory, and business type.
 *
 * Body: { sentence: "I bake custom birthday cakes in Hyderabad" }
 * Returns: { marketplace, category, subcategory, businessType, confidence }
 */
import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { checkAiRateLimit, incrementAiCount } from "@/lib/ai/rate-limiter";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // ── Auth required: prevent anonymous AI abuse ──
    const vendor = await resolveVendorFromSession();
    if (!vendor) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ── Rate limiting ──
    const rateLimit = await checkAiRateLimit(vendor.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${rateLimit.limit} requests/day). Upgrade your plan for more.`, limit: rateLimit.limit },
        { status: 429 }
      );
    }

    const { sentence } = await req.json();
    if (!sentence?.trim()) {
      return NextResponse.json({ error: "Sentence is required" }, { status: 400 });
    }

    // Fetch all categories + business types from DB for the AI to choose from
    const [categories, businessTypes] = await Promise.all([
      db.category.findMany({ where: { active: true }, select: { slug: true, label: true, ecosystem: true } }).catch(() => []),
      db.businessType.findMany({ where: { active: true }, select: { categoryId: true, value: true, label: true } }).catch(() => []),
    ]);

    const categoryList = categories.map(c => `${c.slug} (${c.label}, ${c.ecosystem})`).join(", ");
    const btList = businessTypes.map(t => `${t.categoryId}:${t.value} (${t.label})`).join(", ");

    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const prompt = `You are a business classification AI for a marketplace platform.
A vendor describes their business: "${sentence}"

Available categories: ${categoryList}
Available business types: ${btList}

Classify this business. Return ONLY valid JSON:
{
  "marketplace": "FINDMYBITES" or "PIMPMYPARTY",
  "category": "category-slug from the list above",
  "subcategory": "a relevant subcategory name (free text, or empty string)",
  "businessType": "business type value from the list above (or empty string)",
  "confidence": 0-100 (how confident you are in this classification)
}

Rules:
- marketplace must be exactly "FINDMYBITES" (food) or "PIMPMYPARTY" (events)
- category must be one of the category slugs listed above
- businessType should match one of the available values for that category
- confidence is your estimation of how accurate this classification is`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
    });

    const text = completion.choices[0]?.message?.content || "";
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        const result = JSON.parse(m[0]);
        incrementAiCount(vendor.id);
        return NextResponse.json({
          marketplace: result.marketplace || "FINDMYBITES",
          category: result.category || "",
          subcategory: result.subcategory || "",
          businessType: result.businessType || "",
          confidence: Math.min(100, Math.max(0, Number(result.confidence) || 50)),
        });
      }
    } catch {}

    return NextResponse.json({ error: "AI classification failed" }, { status: 500 });
  } catch (err: any) {
    console.error("[ai/classify] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
