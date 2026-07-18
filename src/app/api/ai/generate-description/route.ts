import { guardAiRoute } from "@/lib/billing/guards";
import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/generate-description
 *
 * Generates a professional vendor profile using ZAI (GLM):
 *   - SEO-friendly business description
 *   - Catchy tagline
 *   - SEO keywords (for search ranking)
 *   - Meta description (for search engine results)
 *   - Suggested tags (for marketplace filtering)
 *
 * Body: { vendorName, category, subcategory, city }
 *
 * Response:
 *   {
 *     tagline: string,
 *     description: string,       // 80-120 words, SEO-friendly
 *     keywords: string[],        // 5-8 SEO keywords
 *     metaDescription: string,   // max 160 chars
 *     tags: string[],            // 5-8 marketplace tags
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    const { vendorName, category, subcategory, city } = await req.json();
    if (!vendorName || !category) {
      return NextResponse.json({ error: "vendorName and category required" }, { status: 400 });
    }

    // ── Prompt injection check on user-supplied fields ──
    const userInput = [vendorName, category, subcategory || "", city || ""].join("\n");
    const sanitizeResult = sanitizePrompt(userInput);
    if (sanitizeResult.blocked) {
      logger.warn("ai-generate-description", "Prompt injection blocked", { reason: sanitizeResult.reason });
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const lines = sanitizeResult.sanitized.split("\n");
    const safeVendorName = lines[0] || vendorName;
    const safeCategory = lines[1] || category;
    const safeSubcategory = (lines[2] || subcategory || "").trim();
    const safeCity = (lines[3] || city || "").trim();

    const zai = await getZAI();
    if (!zai) {
      // ── Fallback when AI is not configured ──
      const fallbackDesc = `${safeVendorName} is a professional ${safeCategory.toLowerCase()}${safeSubcategory ? ` specializing in ${safeSubcategory.toLowerCase()}` : ""}${safeCity ? ` based in ${safeCity}` : ""}. We deliver quality service with attention to detail and customer satisfaction. Book directly — no commission, direct contact.`;
      return NextResponse.json({
        tagline: `${safeCategory} in ${safeCity || "your city"}`,
        description: fallbackDesc,
        keywords: [safeCategory, safeSubcategory, safeCity, safeVendorName].filter(Boolean),
        metaDescription: fallbackDesc.slice(0, 160),
        tags: [safeCategory, safeSubcategory, safeCity].filter(Boolean),
        fallback: true,
      });
    }

    const prompt = `Generate a professional vendor profile for SEO. Return ONLY valid JSON (no markdown, no code fences).
Business: ${safeVendorName}
Category: ${safeCategory}
Subcategory: ${safeSubcategory || "N/A"}
City: ${safeCity || "N/A"}

Return JSON with exactly these fields:
{
  "tagline": "One catchy line (max 60 chars)",
  "description": "Professional SEO-friendly description (80-120 words, include the business name, category, and city naturally)",
  "keywords": ["5-8 SEO keywords for search ranking"],
  "metaDescription": "Meta description for search engines (max 160 chars)",
  "tags": ["5-8 marketplace tags for filtering"]
}`;

    // ── 30-second timeout ──
    const { result: text, timedOut } = await callWithTimeout(async (_signal) => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        thinking: { type: "disabled" },
      });
      return completion.choices[0]?.message?.content || "";
    }, 30_000);

    if (timedOut) {
      logger.warn("ai-generate-description", "LLM call timed out after 30s");
      return NextResponse.json({ error: "AI request timed out" }, { status: 504 });
    }

    try {
      const jsonMatch = (text || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          tagline: String(parsed.tagline || ""),
          description: String(parsed.description || ""),
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
          metaDescription: String(parsed.metaDescription || ""),
          tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        });
      }
    } catch {
      // fall through to fallback
    }

    // ── Fallback: use raw text as description ──
    const fallbackDesc = (text || "").slice(0, 500);
    return NextResponse.json({
      tagline: `${safeCategory} in ${safeCity || "your city"}`,
      description: fallbackDesc,
      keywords: [safeCategory, safeSubcategory, safeCity, safeVendorName].filter(Boolean),
      metaDescription: fallbackDesc.slice(0, 160),
      tags: [safeCategory, safeSubcategory, safeCity].filter(Boolean),
    });
  } catch (error: any) {
    logger.error("ai-generate-description", "POST failed", { message: error?.message ?? String(error) });
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
