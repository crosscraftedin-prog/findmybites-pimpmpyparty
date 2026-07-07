/**
 * POST /api/ai/product-writer
 *
 * Generates product description, SEO, and tags from the product name.
 * Body: { name, category, ecosystem, city }
 *
 * Uses the ZAI (GLM) API via getZAI() + callWithTimeout.
 * Falls back to a template-based generator if the ZAI API is unreachable
 * (which happens on Vercel production where internal-api.z.ai is not
 * accessible from the serverless function region).
 *
 * The fallback produces SEO-optimized content based on the product name,
 * category, city, and ecosystem — so the Product Writer ALWAYS returns
 * content, never shows "fetch failed".
 */

import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ts = () => new Date().toISOString();
  console.log(`[PRODUCT-WRITER] ${ts()} POST — ENTER`);

  try {
    const { name, category, ecosystem, city } = await req.json();
    console.log(`[PRODUCT-WRITER] ${ts()} Request: name="${name}", category="${category}"`);

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Prompt injection check ──
    const userInput = [name, category || "", city || ""].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }

    const safeName = name.trim();
    const safeCategory = (category || "").trim();
    const safeCity = (city || "").trim();
    const isFood = ecosystem === "FINDMYBITES";
    const platform = isFood ? "FindMyBites" : "PimpMyParty";

    // ── Try ZAI API first ──
    console.log(`[PRODUCT-WRITER] ${ts()} Getting ZAI instance...`);
    const zai = await getZAI();

    if (zai) {
      const prompt = `You are a professional copywriter for ${platform} (${isFood ? "food marketplace" : "event services marketplace"}). Generate content for a product listing.

Product Name: ${safeName}
Category: ${safeCategory || "General"}
City: ${safeCity || "Global"}

Generate a JSON response with these fields:
- description: A compelling 2-3 sentence product description (50-100 words)
- shortDescription: A one-line summary (max 80 chars)
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO meta description (max 155 chars)
- tags: Comma-separated tags for search (8-12 tags)

Return ONLY valid JSON, no markdown.`;

      console.log(`[PRODUCT-WRITER] ${ts()} Calling ZAI LLM...`);
      const llmStart = Date.now();

      try {
        const { result: content, timedOut } = await callWithTimeout(async (_signal) => {
          const completion = await zai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            thinking: { type: "disabled" },
          });
          return completion.choices[0]?.message?.content || "";
        }, 25_000);

        const llmEnd = Date.now();
        console.log(`[PRODUCT-WRITER] ${ts()} LLM response (${llmEnd - llmStart}ms), timedOut=${timedOut}`);

        if (!timedOut && content) {
          // Parse JSON from response
          try {
            const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(jsonStr);
            console.log(`[PRODUCT-WRITER] ${ts()} ✅ LLM content parsed`);
            return NextResponse.json(parsed);
          } catch {
            // JSON parse failed — use raw content as description
            console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ JSON parse failed — using raw content`);
            return NextResponse.json({
              description: content.slice(0, 500),
              shortDescription: content.slice(0, 80),
              metaTitle: `${safeName} | ${safeCategory || "Products"}${safeCity ? ` in ${safeCity}` : ""} | ${platform}`.slice(0, 60),
              metaDescription: content.slice(0, 155),
              tags: [safeCategory, safeCity, safeName, isFood ? "food" : "events", "best", "quality"].filter(Boolean).join(", "),
            });
          }
        }
        console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ LLM timed out or returned empty — falling back to template`);
      } catch (llmErr: any) {
        console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ LLM call failed: ${llmErr?.message} — falling back to template`);
        logger.warn("ai-product-writer", "LLM call failed — using template fallback", {
          error: llmErr?.message?.slice(0, 100),
        });
      }
    } else {
      console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ ZAI not available — using template fallback`);
    }

    // ── Template-based fallback (always succeeds) ──
    // This runs when:
    // 1. ZAI is not configured (getZAI returns null)
    // 2. ZAI call times out
    // 3. ZAI call throws (network error, etc.)
    // The fallback produces SEO-optimized content so the Product Writer
    // NEVER shows "fetch failed" to the user.
    console.log(`[PRODUCT-WRITER] ${ts()} Generating template-based content`);

    const catLabel = safeCategory
      ? safeCategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : isFood ? "Food" : "Service";

    const description = `Indulge in our premium ${safeName.toLowerCase()}, crafted with the finest ingredients and attention to detail.${
      safeCity ? ` Available in ${safeCity},` : ""
    } this ${catLabel.toLowerCase()} is perfect for ${isFood ? "celebrations, parties, and special occasions" : "events, weddings, and corporate functions"}. Book directly on ${platform} for the best price — no commission, direct contact with the vendor.`;

    const shortDescription = `Premium ${safeName.toLowerCase()}${safeCity ? ` in ${safeCity}` : ""}. Book on ${platform}.`;

    const metaTitle = `${safeName}${safeCity ? ` in ${safeCity}` : ""} | ${catLabel} | ${platform}`.slice(0, 60);

    const metaDescription = `Order ${safeName} on ${platform}${safeCity ? ` in ${safeCity}` : ""}. ${isFood ? "Fresh, premium quality for your celebration." : "Professional service for your event."} Book directly — no commission.`.slice(0, 155);

    const tags = [
      safeName.toLowerCase(),
      safeCategory,
      safeCity,
      catLabel.toLowerCase(),
      isFood ? "food" : "events",
      isFood ? "delivery" : "booking",
      "premium",
      "best",
      safeCity ? `${safeCity} ${safeCategory}` : `${safeCategory}`,
      platform.toLowerCase(),
    ].filter(Boolean).join(", ");

    const result = {
      description,
      shortDescription,
      metaTitle,
      metaDescription,
      tags,
      _fallback: true,
    };

    console.log(`[PRODUCT-WRITER] ${ts()} ✅ Template content generated`);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`[PRODUCT-WRITER] ${ts()} ❌ EXCEPTION: ${error?.message}`);
    logger.error("ai-product-writer", "POST failed", { error: error?.message });

    // Even on exception, return template-based content so the user
    // NEVER sees "fetch failed"
    const fallbackName = "Product";
    const fallbackDesc = "A premium quality product available on FindMyBites × PimpMyParty. Book directly for the best price.";
    return NextResponse.json({
      description: fallbackDesc,
      shortDescription: "Premium product. Book directly.",
      metaTitle: `${fallbackName} | FindMyBites × PimpMyParty`,
      metaDescription: fallbackDesc.slice(0, 155),
      tags: "product, premium, quality, best, findmybites, pimpmpyparty",
      _fallback: true,
    });
  }
}
