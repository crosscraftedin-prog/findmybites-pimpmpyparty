import { NextRequest, NextResponse } from "next/server";
import { callZAIChat } from "@/lib/zai-server";
import { sanitizePrompt } from "@/lib/ai/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/vendor/ai/generate-faqs
 *
 * Generates SEO-friendly FAQs from product information using ZAI (GLM).
 * Produces richer, more natural FAQs than the deterministic generator.
 *
 * Body: { productName, productInfo }
 * Returns: { faqs: [{ question, answer }] }
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // V27: Require authentication — this route incurs AI costs
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

  try {
    const body = await req.json();
    const { productName, productInfo } = body as {
      productName?: string;
      productInfo?: Record<string, unknown>;
    };

    if (!productName?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!productInfo || Object.keys(productInfo).length === 0) {
      return NextResponse.json({ error: "Product information is required" }, { status: 400 });
    }

    // ── Prompt injection protection ──
    const sanitizeResult = sanitizePrompt(productName);
    if (sanitizeResult.blocked) {
      return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
    }
    const safeProductName = sanitizeResult.sanitized;

    // Build a compact summary of the product info for the prompt
    const infoParts: string[] = [];
    const info = productInfo as any;
    if (info.ingredients) infoParts.push(`Ingredients: ${info.ingredients}`);
    if (info.dietaryBadges?.length) infoParts.push(`Dietary: ${info.dietaryBadges.join(", ")}`);
    if (info.allergens?.length) infoParts.push(`Allergens: ${info.allergens.join(", ")}`);
    if (info.customAllergens) infoParts.push(`Other allergens: ${info.customAllergens}`);
    if (info.shelfLife) infoParts.push(`Shelf life: ${info.shelfLife}`);
    if (info.storageType) infoParts.push(`Storage type: ${info.storageType}`);
    if (info.storageInstructions) infoParts.push(`Storage instructions: ${info.storageInstructions}`);
    if (info.careInstructions?.length) infoParts.push(`Care: ${info.careInstructions.join(", ")}`);
    if (info.packageType) infoParts.push(`Packaging: ${info.packageType}`);
    if (info.giftWrapping) infoParts.push("Gift wrapping: yes");
    if (info.ecoFriendly) infoParts.push("Eco friendly: yes");
    if (info.highlights?.length) infoParts.push(`Highlights: ${info.highlights.join(", ")}`);
    if (info.nutritionEnabled && info.calories) infoParts.push(`Nutrition: ${info.calories}, ${info.protein || ""} protein, ${info.fat || ""} fat`);
    if (info.deliveryAvailable) infoParts.push("Delivery available");
    if (info.pickupAvailable) infoParts.push("Pickup available");
    if (info.sameDayDelivery) infoParts.push("Same day delivery");
    if (info.deliveryRadius) infoParts.push(`Delivery radius: ${info.deliveryRadius}`);
    if (info.deliveryCharges) infoParts.push(`Delivery charges: ${info.deliveryCharges}`);
    if (info.minimumOrder) infoParts.push(`Minimum order: ${info.minimumOrder}`);
    if (info.customisation?.length) infoParts.push(`Customisation: ${info.customisation.join(", ")}`);
    if (info.occasionTags?.length) infoParts.push(`Occasions: ${info.occasionTags.join(", ")}`);

    if (infoParts.length === 0) {
      return NextResponse.json({ error: "No product information to generate FAQs from" }, { status: 400 });
    }

    const prompt = `You are an SEO specialist for a bakery marketplace. Generate 5-8 frequently asked questions (FAQs) about this product based on the information below. Each FAQ should have a clear question and a concise, helpful answer.

Product: ${productName.trim()}

Product Information:
${infoParts.join("\n")}

Return the FAQs as a JSON array of objects with "question" and "answer" fields. Example:
[{"question":"Does this cake contain eggs?","answer":"Yes, this product contains eggs. It also contains milk and wheat."}]

Return ONLY the JSON array, no other text.`;

    const messages = [
      { role: "system", content: "You are an SEO assistant. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ];

    const response = await callZAIChat(messages, 25_000);
    if (!response || !response.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: "AI generation failed — no response" }, { status: 500 });
    }

    const content = response.choices[0].message.content.trim();
    // Extract JSON array from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let faqs: { question: string; answer: string }[] = [];
    if (jsonMatch) {
      try {
        faqs = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
    }

    return NextResponse.json({ faqs });
  } catch (error: any) {
    console.error("[generate-faqs] failed:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate FAQs" },
      { status: 500 }
    );
  }
}
