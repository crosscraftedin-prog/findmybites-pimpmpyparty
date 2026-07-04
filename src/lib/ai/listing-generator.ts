/**
 * AI Business Description Generator (SERVER-ONLY).
 * ───────────────────────────────────────────────────────────────────────────
 * Generates professional business descriptions in 6 writing styles, plus
 * auto-suggests SEO keywords, business tags, and services offered — all
 * based on the vendor's listing data.
 *
 * ⚠️ This file imports z-ai-web-dev-sdk — it MUST NOT be imported from
 * client components. Import the types/constants from ./listing-types instead.
 *
 * Uses z-ai-web-dev-sdk (GLM) via the resilient getZAI() factory.
 * Falls back to templated content when the LLM is unavailable.
 */
import { getZAI } from "@/lib/zai-server";
import { db } from "@/lib/db";
import type { WritingStyle, VendorListingInput, AiListingResult } from "./listing-types";

export type { WritingStyle, VendorListingInput, AiListingResult };
export { WRITING_STYLES } from "./listing-types";

const STYLE_PROMPTS: Record<WritingStyle, string> = {
  professional: "Write in a polished, professional tone suitable for a business directory. Clear, authoritative, and trustworthy.",
  friendly: "Write in a warm, friendly, approachable tone. Use conversational language that makes customers feel welcome.",
  luxury: "Write in a sophisticated, luxury tone. Emphasize exclusivity, craftsmanship, and premium quality. Use elegant language.",
  premium: "Write in a premium, upscale tone. Focus on quality, attention to detail, and a refined experience.",
  casual: "Write in a casual, relaxed, everyday tone. Keep it simple and natural, like talking to a friend.",
  seo: "Write in an SEO-optimized tone. Naturally incorporate relevant keywords (category, city, cuisine/service type). Aim for Google ranking without keyword stuffing.",
};

async function callLLM(prompt: string): Promise<string | null> {
  const zai = await getZAI();
  if (!zai) return null;
  try {
    const completion = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      thinking: { type: "disabled" },
    });
    return completion.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("[ai-listing] LLM call failed:", err);
    return null;
  }
}

function extractJson(text: string): any | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

function categoryLabel(cat: string): string {
  return cat.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateAiListing(input: VendorListingInput, style: WritingStyle = "professional"): Promise<AiListingResult> {
  const isFood = input.marketplace === "FINDMYBITES";
  const catLabel = categoryLabel(input.category);
  const marketplaceLabel = isFood ? "food" : "event/party";

  const contextLines = [
    `Business name: ${input.businessName}`,
    `Marketplace: ${input.marketplace} (${marketplaceLabel})`,
    `Category: ${catLabel}`,
    input.subcategory ? `Subcategory: ${input.subcategory}` : "",
    input.city ? `City: ${input.city}` : "",
    input.country ? `Country: ${input.country}` : "",
    input.specialities ? `Specialities: ${input.specialities}` : "",
    input.yearsExperience ? `Years of experience: ${input.yearsExperience}` : "",
    input.deliveryOptions ? `Delivery options: ${input.deliveryOptions}` : "",
    input.customOrders !== undefined ? `Custom orders: ${input.customOrders ? "Yes" : "No"}` : "",
    input.languages ? `Languages: ${input.languages}` : "",
    input.priceRange ? `Price range: ${input.priceRange}` : "",
    input.tags ? `Current tags: ${input.tags}` : "",
  ].filter(Boolean);

  const prompt = `You are an expert copywriter for a ${marketplaceLabel} marketplace.
Generate a business listing for the following vendor.

${STYLE_PROMPTS[style]}

Vendor context:
${contextLines.join("\n")}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "description": "80-150 word business description",
  "tagline": "short catchy one-line tagline (max 60 chars)",
  "keywords": ["8-10 SEO keywords for Google ranking"],
  "businessTags": ["6-8 short tags for search & filtering"],
  "services": ["4-6 services this business likely offers"]
}

Requirements:
- Description must be 80-150 words, natural and engaging
- Tagline must be max 60 characters
- Keywords should include category + city + relevant terms
- Business tags should be short (1-2 words), lowercase
- Services should be specific to this category (${catLabel})`;

  const text = await callLLM(prompt);
  const parsed = extractJson(text || "");

  if (parsed) {
    return {
      description: String(parsed.description || "").slice(0, 800),
      tagline: String(parsed.tagline || "").slice(0, 60),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10).map(String) : [],
      businessTags: Array.isArray(parsed.businessTags) ? parsed.businessTags.slice(0, 8).map(String) : [],
      services: Array.isArray(parsed.services) ? parsed.services.slice(0, 6).map(String) : [],
    };
  }

  // Fallback
  const fallbackDesc = `${input.businessName} is a ${catLabel.toLowerCase()}${input.city ? ` based in ${input.city}` : ""}${input.specialities ? ` specializing in ${input.specialities}` : ""}. ${input.yearsExperience ? `With ${input.yearsExperience} years of experience, ` : ""}we deliver quality and customer satisfaction. ${input.deliveryOptions && input.deliveryOptions !== "None" ? `We offer ${input.deliveryOptions.toLowerCase()} services. ` : ""}Book directly — no commission, direct contact with the vendor.`;
  return {
    description: fallbackDesc.slice(0, 800),
    tagline: `${catLabel} in ${input.city || "your city"}`.slice(0, 60),
    keywords: [input.category, input.city, isFood ? "food" : "events", catLabel.toLowerCase(), input.subcategory].filter(Boolean).slice(0, 10),
    businessTags: [input.category, catLabel.toLowerCase(), input.subcategory].filter(Boolean).slice(0, 8),
    services: isFood ? ["Custom orders", "Delivery", "Catering"] : ["Event planning", "Consultation", "Custom packages"],
  };
}

export async function getVendorContext(vendorId: string): Promise<VendorListingInput | null> {
  const v = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, ecosystem: true, category: true, subcategory: true, city: true, country: true, tagline: true, tags: true, priceRange: true, yearsActive: true, deliveryAvailable: true, pickupAvailable: true },
  });
  if (!v) return null;
  let tags: any[] = [];
  try { tags = v.tags ? (typeof v.tags === "string" ? JSON.parse(v.tags as string) : v.tags) : []; } catch {}
  return {
    vendorId: v.id,
    businessName: v.name,
    marketplace: v.ecosystem,
    category: v.category,
    subcategory: v.subcategory || undefined,
    city: v.city || undefined,
    country: v.country || undefined,
    tags: Array.isArray(tags) ? tags.join(", ") : "",
    priceRange: v.priceRange || undefined,
    yearsExperience: v.yearsActive ? String(v.yearsActive) : undefined,
    deliveryOptions: v.deliveryAvailable && v.pickupAvailable ? "Both" : v.deliveryAvailable ? "Delivery" : v.pickupAvailable ? "Pickup" : "None",
  };
}
