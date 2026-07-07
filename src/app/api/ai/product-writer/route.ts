import { NextRequest, NextResponse } from "next/server";
import { callZAI } from "@/lib/zai-server";
import { sanitizePrompt } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/product-writer
 * Generates product description, SEO, and tags from the product name.
 * Body: { name, category, ecosystem, city }
 *
 * Uses callZAI() which calls the ZAI API directly via fetch() with a 25s
 * timeout, bypassing the ZAI SDK's internal fetch (which has a 10s connect
 * timeout that fails on Vercel production).
 */
export async function POST(req: NextRequest) {
  const ts = () => new Date().toISOString();
  console.log(`[PRODUCT-WRITER] ${ts()} POST /api/ai/product-writer — ENTER`);

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
    const safeName = sanitizeResult.sanitized.split("\n")[0] || name;
    const safeCategory = (sanitizeResult.sanitized.split("\n")[1] || category || "").trim();
    const safeCity = (sanitizeResult.sanitized.split("\n")[2] || city || "").trim();

    const platform = ecosystem === "FINDMYBITES" ? "FindMyBites (food marketplace)" : "PimpMyParty (event services marketplace)";
    const prompt = `You are a professional copywriter for ${platform}. Generate content for a product listing.

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

    // ── Call ZAI API directly (bypasses ZAI SDK's 10s connect timeout) ──
    console.log(`[PRODUCT-WRITER] ${ts()} Calling ZAI API (25s timeout)...`);
    const llmStart = Date.now();
    const content = await callZAI(prompt, 25_000);
    const llmEnd = Date.now();
    console.log(`[PRODUCT-WRITER] ${ts()} ZAI response received (${llmEnd - llmStart}ms), content=${content ? "yes" : "null"}`);

    if (!content) {
      console.log(`[PRODUCT-WRITER] ${ts()} ❌ ZAI call returned null`);
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    // Parse JSON from response
    let parsed: any = null;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
      console.log(`[PRODUCT-WRITER] ${ts()} ✅ JSON parsed successfully`);
    } catch {
      console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ JSON parse failed — using raw content as fallback`);
      parsed = {
        description: content.slice(0, 200),
        shortDescription: content.slice(0, 80),
        metaTitle: safeName.slice(0, 60),
        metaDescription: content.slice(0, 155),
        tags: safeCategory || "",
      };
    }

    console.log(`[PRODUCT-WRITER] ${ts()} ✅ 200 — returning generated content`);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(`[PRODUCT-WRITER] ${ts()} ❌ EXCEPTION: ${error?.message}`);
    logger.error("ai-product-writer", "POST failed", {
      message: error?.message,
      cause: error?.cause?.message,
    });
    return NextResponse.json(
      { error: "AI service is temporarily unavailable. Please try again in a moment." },
      { status: 500 }
    );
  }
}
