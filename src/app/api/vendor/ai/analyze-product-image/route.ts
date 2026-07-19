import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getZAI } from "@/lib/zai-server";
import { callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * POST /api/vendor/ai/analyze-product-image
 *
 * AI Product Image Analysis — the ONE missing AI feature.
 *
 * When a vendor uploads a product image, this endpoint analyzes it using
 * the GLM-4V vision model and returns:
 *   - Detected product category + type
 *   - Theme and occasion
 *   - Primary colors
 *   - Decoration style
 *   - Estimated weight / servings (for food products)
 *   - Suggested price range
 *   - Suggested lead time + preparation time
 *   - Image quality score (lighting, cropping, background)
 *   - Improvement suggestions
 *   - Suggested SEO keywords + hashtags
 *
 * This extends the existing analyzeBusinessImage() pattern (which only
 * analyzes brand logos for color extraction) to product photos.
 *
 * Body: { imageUrl: string, vendorCategory?: string }
 * Response: { analysis: ProductImageAnalysis }
 */

interface ProductImageAnalysis {
  // Product detection
  productCategory: string;
  productType: string;
  theme: string;
  occasion: string[];

  // Visual analysis
  primaryColors: string[];
  decorationStyle: string;

  // Food-specific (optional)
  estimatedWeight?: string;
  estimatedServings?: string;
  ingredients?: string[];
  dietaryIndicators?: string[];

  // Business suggestions
  suggestedPriceRange: string;
  suggestedLeadTime: string;
  suggestedPreparationTime: string;

  // Image quality
  imageQualityScore: number; // 0-100
  lightingQuality: string; // "good" | "fair" | "poor"
  backgroundQuality: string;
  croppingQuality: string;
  improvementSuggestions: string[];

  // SEO
  suggestedKeywords: string[];
  suggestedHashtags: string[];
  altText: string;
}

const FALLBACK_ANALYSIS: ProductImageAnalysis = {
  productCategory: "",
  productType: "",
  theme: "",
  occasion: [],
  primaryColors: [],
  decorationStyle: "",
  suggestedPriceRange: "",
  suggestedLeadTime: "",
  suggestedPreparationTime: "",
  imageQualityScore: 0,
  lightingQuality: "fair",
  backgroundQuality: "fair",
  croppingQuality: "fair",
  improvementSuggestions: [],
  suggestedKeywords: [],
  suggestedHashtags: [],
  altText: "",
};

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ──
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {}
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) userId = session.user.id;
      } catch {}
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ── 2. Parse request ──
    const body = await req.json();
    const { imageUrl, vendorCategory } = body as { imageUrl: string; vendorCategory?: string };

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    }

    // ── 3. Get ZAI client ──
    const zai = await getZAI();
    if (!zai) {
      return NextResponse.json({
        analysis: FALLBACK_ANALYSIS,
        warning: "AI vision not configured — returned empty analysis",
      });
    }

    // ── 4. Build VLM prompt ──
    const categoryHint = vendorCategory ? `The vendor's category is "${vendorCategory}". ` : "";
    const prompt = `${categoryHint}Analyze this product image in detail. Return ONLY valid JSON (no markdown, no code fences) with exactly this structure:
{
  "productCategory": "detected category (e.g., Cake, Cupcake, Photography, Decoration)",
  "productType": "specific type (e.g., Birthday Cake, Wedding Cake, Balloon Arch)",
  "theme": "theme if any (e.g., Bluey, Princess, Floral, Minimalist)",
  "occasion": ["Birthday", "Wedding", etc.],
  "primaryColors": ["#hex1", "#hex2", "#hex3"],
  "decorationStyle": "style description (e.g., Fondant, Buttercream, Modern, Rustic)",
  "estimatedWeight": "e.g., 1 kg (for cakes) or empty string",
  "estimatedServings": "e.g., 10-12 people or empty string",
  "ingredients": ["detected ingredients if visible, e.g., Chocolate, Vanilla, Cream"] or empty array,
  "dietaryIndicators": ["Eggless", "Vegan", etc. if determinable"] or empty array,
  "suggestedPriceRange": "e.g., ₹500-800 or $20-35",
  "suggestedLeadTime": "e.g., 2-3 days",
  "suggestedPreparationTime": "e.g., 4-6 hours",
  "imageQualityScore": 0-100,
  "lightingQuality": "good | fair | poor",
  "backgroundQuality": "good | fair | poor",
  "croppingQuality": "good | fair | poor",
  "improvementSuggestions": ["specific actionable suggestions"] or empty array,
  "suggestedKeywords": ["SEO keywords for this product"],
  "suggestedHashtags": ["#hashtag1", "#hashtag2"],
  "altText": "descriptive alt text for accessibility and SEO"
}`;

    // ── 5. Call GLM-4V with 30s timeout ──
    const { result: text, timedOut } = await callWithTimeout(async () => {
      const completion = await zai.chat.completions.createVision({
        model: "glm-4v",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        }],
        thinking: { type: "disabled" },
      } as any);
      return completion.choices[0]?.message?.content || "";
    }, 30_000);

    if (timedOut) {
      logger.warn("ai-product-image", "VLM call timed out after 30s");
      return NextResponse.json(
        { error: "Image analysis timed out. Please try again." },
        { status: 504 }
      );
    }

    // ── 6. Parse JSON response ──
    try {
      const jsonMatch = (text || "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const analysis: ProductImageAnalysis = {
          productCategory: String(parsed.productCategory || ""),
          productType: String(parsed.productType || ""),
          theme: String(parsed.theme || ""),
          occasion: Array.isArray(parsed.occasion) ? parsed.occasion.map(String) : [],
          primaryColors: Array.isArray(parsed.primaryColors) ? parsed.primaryColors.map(String).slice(0, 5) : [],
          decorationStyle: String(parsed.decorationStyle || ""),
          estimatedWeight: parsed.estimatedWeight ? String(parsed.estimatedWeight) : undefined,
          estimatedServings: parsed.estimatedServings ? String(parsed.estimatedServings) : undefined,
          ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.map(String) : [],
          dietaryIndicators: Array.isArray(parsed.dietaryIndicators) ? parsed.dietaryIndicators.map(String) : [],
          suggestedPriceRange: String(parsed.suggestedPriceRange || ""),
          suggestedLeadTime: String(parsed.suggestedLeadTime || ""),
          suggestedPreparationTime: String(parsed.suggestedPreparationTime || ""),
          imageQualityScore: Number(parsed.imageQualityScore) || 0,
          lightingQuality: String(parsed.lightingQuality || "fair"),
          backgroundQuality: String(parsed.backgroundQuality || "fair"),
          croppingQuality: String(parsed.croppingQuality || "fair"),
          improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions.map(String) : [],
          suggestedKeywords: Array.isArray(parsed.suggestedKeywords) ? parsed.suggestedKeywords.map(String) : [],
          suggestedHashtags: Array.isArray(parsed.suggestedHashtags) ? parsed.suggestedHashtags.map(String) : [],
          altText: String(parsed.altText || ""),
        };

        logger.info("ai-product-image", "Analysis completed", {
          userId,
          category: analysis.productCategory,
          type: analysis.productType,
          qualityScore: analysis.imageQualityScore,
        });

        return NextResponse.json({ analysis });
      }
    } catch {
      // fall through to fallback
    }

    logger.warn("ai-product-image", "Failed to parse VLM response", {
      responsePreview: (text || "").slice(0, 200),
    });

    return NextResponse.json({
      analysis: FALLBACK_ANALYSIS,
      warning: "Could not parse AI response — please try with a different image",
    });
  } catch (error: any) {
    logger.error("ai-product-image", "POST failed", error, { message: error?.message });
    return NextResponse.json(
      { error: `Image analysis failed: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
