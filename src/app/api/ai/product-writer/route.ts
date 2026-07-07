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
  const ts = () => new Date().toISOString();
  console.log(`[PRODUCT-WRITER] ${ts()} POST /api/ai/product-writer — ENTER`);

  try {
    const { name, category, ecosystem, city } = await req.json();
    console.log(`[PRODUCT-WRITER] ${ts()} Request: name="${name}", category="${category}", ecosystem="${ecosystem}", city="${city}"`);

    if (!name?.trim()) {
      console.log(`[PRODUCT-WRITER] ${ts()} ❌ 400 — name is required`);
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // ── Prompt injection check ──
    const userInput = [name, category || "", city || ""].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      console.log(`[PRODUCT-WRITER] ${ts()} ❌ 400 — prompt injection blocked`);
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const safeName = sanitizeResult.sanitized.split("\n")[0] || name;
    const safeCategory = (sanitizeResult.sanitized.split("\n")[1] || category || "").trim();
    const safeCity = (sanitizeResult.sanitized.split("\n")[2] || city || "").trim();

    console.log(`[PRODUCT-WRITER] ${ts()} Getting ZAI instance...`);
    const zai = await getZAI();
    if (!zai) {
      console.log(`[PRODUCT-WRITER] ${ts()} ❌ 503 — ZAI not configured`);
      return NextResponse.json({ error: "AI service not configured. Please try again later." }, { status: 503 });
    }
    console.log(`[PRODUCT-WRITER] ${ts()} ✅ ZAI instance created`);

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

    // ── 25-second timeout (within Vercel's 30s limit) ──
    console.log(`[PRODUCT-WRITER] ${ts()} Calling LLM...`);
    const llmStart = Date.now();
    const { result: content, timedOut } = await callWithTimeout(async (_signal) => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        thinking: { type: "disabled" },
      });
      return completion.choices[0]?.message?.content || "";
    }, 25_000);
    const llmEnd = Date.now();
    console.log(`[PRODUCT-WRITER] ${ts()} LLM response received (${llmEnd - llmStart}ms), timedOut=${timedOut}`);

    if (timedOut) {
      console.log(`[PRODUCT-WRITER] ${ts()} ❌ 504 — LLM timed out`);
      return NextResponse.json({ error: "AI request timed out. Please try again." }, { status: 504 });
    }

    // Parse JSON from response
    let parsed: any = null;
    try {
      const jsonStr = (content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
      console.log(`[PRODUCT-WRITER] ${ts()} ✅ JSON parsed successfully`);
    } catch {
      console.log(`[PRODUCT-WRITER] ${ts()} ⚠️ JSON parse failed — using raw content as fallback`);
      parsed = {
        description: (content || "").slice(0, 200),
        shortDescription: (content || "").slice(0, 80),
        metaTitle: safeName.slice(0, 60),
        metaDescription: (content || "").slice(0, 155),
        tags: safeCategory || "",
      };
    }

    console.log(`[PRODUCT-WRITER] ${ts()} ✅ 200 — returning generated content`);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(`[PRODUCT-WRITER] ${ts()} ❌ EXCEPTION: ${error?.message}`);
    console.error(`[PRODUCT-WRITER] ${ts()} Error name: ${error?.name}`);
    console.error(`[PRODUCT-WRITER] ${ts()} Error code: ${error?.code}`);
    console.error(`[PRODUCT-WRITER] ${ts()} Error cause: ${error?.cause?.message ?? error?.cause ?? 'none'}`);
    console.error(`[PRODUCT-WRITER] ${ts()} Stack: ${error?.stack?.split('\n').slice(0, 5).join(' | ')}`);
    logger.error("ai-product-writer", "POST failed", {
      message: error?.message ?? String(error),
      cause: error?.cause?.message ?? undefined,
    });

    // Return a descriptive error — if it's a fetch failure, tell the user to retry
    const isFetchError = error?.name === "TypeError" || error?.message?.includes("fetch");
    const errorMsg = isFetchError
      ? "AI service is temporarily unavailable. Please try again in a moment."
      : error?.message ?? "Failed to generate product content";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
