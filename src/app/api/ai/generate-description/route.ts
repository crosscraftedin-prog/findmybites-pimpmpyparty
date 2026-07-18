import { guardAiRoute } from "@/lib/billing/guards";
import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/ai/generate-description
 * Generates a professional description + tagline using ZAI (GLM).
 * Body: { vendorName, category, subcategory, city }
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
      return NextResponse.json({
        tagline: `${safeCategory} in ${safeCity || "your city"}`,
        description: `${safeVendorName} is a professional ${safeCategory.toLowerCase()}${safeSubcategory ? ` specializing in ${safeSubcategory.toLowerCase()}` : ""}${safeCity ? ` based in ${safeCity}` : ""}. We deliver quality service with attention to detail and customer satisfaction. Book directly — no commission, direct contact.`,
        fallback: true,
      });
    }

    const prompt = `Generate a professional vendor profile. Return ONLY valid JSON (no markdown).
Business: ${safeVendorName}
Category: ${safeCategory}
Subcategory: ${safeSubcategory || "N/A"}
City: ${safeCity || "N/A"}

Return: {"tagline":"One catchy line (max 60 chars)","description":"Professional description (80-120 words)"}`;

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
        return NextResponse.json({ tagline: parsed.tagline || "", description: parsed.description || "" });
      }
    } catch {
      // fall through
    }

    return NextResponse.json({
      tagline: `${safeCategory} in ${safeCity || "your city"}`,
      description: (text || "").slice(0, 500),
    });
  } catch (error: any) {
    logger.error("ai-generate-description", "POST failed", { message: error?.message ?? String(error) });
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
