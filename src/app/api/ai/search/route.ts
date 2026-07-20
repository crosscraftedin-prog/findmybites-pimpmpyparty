export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";
import { getZAI } from "@/lib/zai-server";
import { parseJsonArray } from "@/lib/format";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/search
 *
 * Natural language search. Parses customer requests into structured queries
 * and returns ranked vendors.
 *
 * Body: { query: string, city?: string, ecosystem?: string }
 * Returns: { vendors: [...], parsedIntent: {...}, aiExplanation: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, city, ecosystem } = body as { query: string; city?: string; ecosystem?: string };

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    // ── Prompt injection check on user-supplied query ──
    const sanitizeResult = sanitizePrompt(query);
    if (sanitizeResult.blocked) {
      logger.warn("ai-search", "Prompt injection blocked", { reason: sanitizeResult.reason });
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const safeQuery = sanitizeResult.sanitized || query;

    // 1. Fetch all categories + filters from DB for AI context
    let categories: any[] = [];
    let filterGroups: any[] = [];
    try {
      categories = await db.category.findMany({
        where: { active: true },
        select: { slug: true, label: true, ecosystem: true },
      });
      const groups = await db.filterGroup.findMany({
        where: { active: true },
        include: { values: { where: { active: true } } },
      });
      filterGroups = groups.map(g => ({
        name: g.name,
        type: g.type,
        values: g.values.map(v => v.value),
      }));
    } catch {}

    // 2. Use AI to parse the natural language query
    let parsedIntent: any = { categories: [], filters: {}, city: city || "", budget: null };
    let aiExplanation = "";

    const zai = await getZAI();
    if (zai) {
      try {
        const prompt = `Parse this customer search query into a JSON object. Available categories: ${JSON.stringify(categories.map(c => ({ slug: c.slug, label: c.label })))}. Available filters: ${JSON.stringify(filterGroups)}.

Query: "${safeQuery}"

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "categories": ["slug1"],     // matching category slugs
  "filters": {"Filter Group Name": ["value1"]},  // matching filter values
  "city": "city name or empty",
  "budget": null,               // number or null
  "occasion": "occasion or empty",
  "explanation": "1-sentence friendly explanation"
}`;

        // ── 30-second timeout ──
        const { result: response, timedOut } = await callWithTimeout(async (_signal) => {
          const completion = await zai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 300,
          });
          return completion.choices[0]?.message?.content?.trim() || "";
        }, 30_000);

        if (timedOut) {
          logger.warn("ai-search", "LLM call timed out after 30s");
        } else {
          // Extract JSON from response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedIntent = JSON.parse(jsonMatch[0]);
            aiExplanation = parsedIntent.explanation || "";
          }
        }
      } catch (err) {
        logger.error("ai-search", "AI parsing failed", { message: err instanceof Error ? err.message : String(err) });
      }
    }

    // 3. Build Prisma query from parsed intent
    const where: any = { approved: true };
    if (ecosystem) where.ecosystem = ecosystem;
    if (parsedIntent.city) {
      where.city = { contains: parsedIntent.city, mode: "insensitive" };
    } else if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }
    if (parsedIntent.categories?.length > 0) {
      const migratedSlugs = parsedIntent.categories.map((s: string) => migrateCategory(s));
      where.category = { in: migratedSlugs };
    }

    // 4. Fetch matching vendors
    let vendors: any[] = [];
    try {
      vendors = await db.vendor.findMany({
        where,
        orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
        take: 20,
        select: {
          id: true, name: true, slug: true, ecosystem: true, category: true,
          tagline: true, city: true, country: true, countryCode: true,
          currency: true, basePrice: true, rating: true, reviewCount: true,
          heroImage: true, avatarImage: true, featured: true, verified: true,
          responseTime: true, deliveryAvailable: true, tags: true,
        },
      });

      // 5. If we have filter values, fetch vendor filter selections
      if (parsedIntent.filters && Object.keys(parsedIntent.filters).length > 0) {
        const allFilterValues: string[] = [];
        for (const values of Object.values(parsedIntent.filters) as string[][]) {
          allFilterValues.push(...values);
        }
        if (allFilterValues.length > 0) {
          const filterValueIds = await db.vendorFilterValue.findMany({
            where: { filterValue: { value: { in: allFilterValues } } },
            select: { vendorId: true },
            distinct: ["vendorId"],
          });
          const matchingVendorIds = new Set(filterValueIds.map(f => f.vendorId));
          // Boost vendors that match filters (don't exclude — just reorder)
          vendors.sort((a, b) => {
            const aMatch = matchingVendorIds.has(a.id) ? 1 : 0;
            const bMatch = matchingVendorIds.has(b.id) ? 1 : 0;
            if (aMatch !== bMatch) return bMatch - aMatch;
            return b.rating - a.rating;
          });
        }
      }

      vendors = vendors.map(v => ({
        ...v,
        tags: parseJsonArray<string>(v.tags),
      }));
    } catch {}

    return NextResponse.json({
      vendors,
      parsedIntent,
      aiExplanation,
      count: vendors.length,
    });
  } catch (err) {
    logger.error("ai-search", "POST failed", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
