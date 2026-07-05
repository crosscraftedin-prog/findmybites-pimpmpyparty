import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/product-writer
 * Generates product description, SEO, and tags from the product name.
 * Body: { name, category, ecosystem, city }
 */
export async function POST(req: NextRequest) {
  try {
    const { name, category, ecosystem, city } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Prompt injection check on user-supplied fields ──
    const userInput = [name, category || "", city || ""].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      logger.warn("ai-product-writer", "Prompt injection blocked", { reason: sanitizeResult.reason });
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const safeName = sanitizeResult.sanitized.split("\n")[0] || name;
    const safeCategory = (sanitizeResult.sanitized.split("\n")[1] || category || "").trim();
    const safeCity = (sanitizeResult.sanitized.split("\n")[2] || city || "").trim();

    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

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

    // ── 30-second timeout ──
    const { result: content, timedOut } = await callWithTimeout(async (_signal) => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        thinking: { type: "disabled" },
      });
      return completion.choices[0]?.message?.content || "";
    }, 30_000);

    if (timedOut) {
      logger.warn("ai-product-writer", "LLM call timed out after 30s");
      return NextResponse.json({ error: "AI request timed out" }, { status: 504 });
    }

    // Try to parse JSON from the response
    let parsed: any = null;
    try {
      // Remove markdown code fences if present
      const jsonStr = (content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parse fails, return raw content as description
      parsed = {
        description: (content || "").slice(0, 200),
        shortDescription: (content || "").slice(0, 80),
        metaTitle: safeName.slice(0, 60),
        metaDescription: (content || "").slice(0, 155),
        tags: safeCategory || "",
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    logger.error("ai-product-writer", "POST failed", { message: error?.message ?? String(error) });
    return NextResponse.json({ error: error?.message ?? "Failed to generate product content" }, { status: 500 });
  }
}
