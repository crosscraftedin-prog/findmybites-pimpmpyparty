/**
 * AI Business Setup Assistant (SERVER-ONLY).
 * ───────────────────────────────────────────────────────────────────────────
 * Generates a complete business profile (description, tagline, SEO, keywords,
 * tags, services, why-choose-us, highlights, customer promise, FAQ, social bio)
 * in 9 writing styles, plus AI image analysis (brand colors, theme, personality)
 * and profile completeness + recommendations.
 *
 * ⚠️ This file imports z-ai-web-dev-sdk — it MUST NOT be imported from
 * client components. Import the types/constants from ./listing-types instead.
 *
 * Uses z-ai-web-dev-sdk (GLM) via the resilient getZAI() factory.
 * Falls back to templated content when the LLM is unavailable.
 */
import { getZAI } from "@/lib/zai-server";
import { db } from "@/lib/db";
import type {
  WritingStyle, VendorSetupInput, AiBusinessProfile, AiImageAnalysis,
  ProfileCompleteness, AiRecommendation,
} from "./listing-types";

export type { WritingStyle, VendorSetupInput, AiBusinessProfile, AiImageAnalysis, ProfileCompleteness, AiRecommendation };
export { WRITING_STYLES } from "./listing-types";

// ── LLM helper ───────────────────────────────────────────────────────────────
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
    console.error("[ai-setup] LLM call failed:", err);
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

const STYLE_PROMPTS: Record<WritingStyle, string> = {
  professional: "Write in a polished, professional tone suitable for a business directory. Clear, authoritative, and trustworthy.",
  luxury: "Write in a sophisticated, luxury tone. Emphasize exclusivity, craftsmanship, and premium quality. Use elegant language.",
  friendly: "Write in a warm, friendly, approachable tone. Use conversational language that makes customers feel welcome.",
  modern: "Write in a modern, contemporary tone. Clean, forward-thinking, and fresh.",
  creative: "Write in a creative, imaginative tone. Expressive, unique, and memorable.",
  minimal: "Write in a minimal, concise tone. Simple, direct, to-the-point. No fluff.",
  seo: "Write in an SEO-optimized tone. Naturally incorporate relevant keywords (category, city, service type). Aim for Google ranking without keyword stuffing.",
  premium: "Write in a premium, upscale tone. Focus on quality, attention to detail, and a refined experience.",
  casual: "Write in a casual, relaxed, everyday tone. Keep it simple and natural, like talking to a friend.",
};

// ── Full business profile generation ─────────────────────────────────────────

export async function generateBusinessProfile(input: VendorSetupInput, style: WritingStyle = "professional"): Promise<AiBusinessProfile> {
  const isFood = input.marketplace === "FINDMYBITES";
  const catLabel = categoryLabel(input.category);
  const marketplaceLabel = isFood ? "food" : "event/party";

  const contextLines = [
    `Business name: ${input.businessName}`,
    `Marketplace: ${input.marketplace} (${marketplaceLabel})`,
    `Category: ${catLabel}`,
    input.subcategory ? `Subcategory: ${input.subcategory}` : "",
    input.city ? `City: ${input.city}` : "",
    input.state ? `State: ${input.state}` : "",
    input.country ? `Country: ${input.country}` : "",
    input.specialities ? `Specialities: ${input.specialities}` : "",
    input.yearsExperience ? `Years of experience: ${input.yearsExperience}` : "",
    input.deliveryOptions ? `Delivery options: ${input.deliveryOptions}` : "",
    input.languages ? `Languages: ${input.languages}` : "",
    input.priceRange ? `Price range: ${input.priceRange}` : "",
    input.tags ? `Current tags: ${input.tags}` : "",
  ].filter(Boolean);

  const prompt = `You are an expert business copywriter for a ${marketplaceLabel} marketplace.
Generate a UNIQUE business profile for the following vendor.

${STYLE_PROMPTS[style]}

CRITICAL — AVOID GENERIC CONTENT:
- Do NOT start descriptions with "We are passionate about..." or "We are a..."
- Do NOT use generic phrases like "quality you can trust", "exceeding expectations", "one-stop solution"
- Every sentence must be SPECIFIC to this vendor's name, category, city, and specialities
- Use the business name naturally in the description (not just at the start)
- Mention the specific city and category in a natural way
- Include concrete details (e.g. for a wedding planner: "from mandap setup to baraat coordination")
- Make the tagline memorable and unique — not a cliché
- Each "why choose us" reason must be specific to this type of business, not generic

Vendor context:
${contextLines.join("\n")}

Return ONLY valid JSON (no markdown, no code fences) with this EXACT structure:
{
  "description": "80-150 word UNIQUE business description (specific to this vendor, no generic phrases)",
  "shortDescription": "1-2 sentence summary (max 160 chars, specific to this business)",
  "tagline": "short catchy UNIQUE tagline (max 60 chars, avoid clichés)",
  "seoTitle": "SEO-optimized title for Google (50-60 chars, include category + city + business name)",
  "metaDescription": "Meta description for Google (140-160 chars, persuasive with CTA, specific)",
  "keywords": ["8-10 SEO keywords for Google ranking (specific to this category + city)"],
  "tags": ["6-8 short tags for search & filtering (1-2 words, lowercase)"],
  "services": ["4-6 SPECIFIC services this ${catLabel} business offers"],
  "whyChooseUs": ["4-5 SPECIFIC reasons (not generic — tie to this vendor's category)"],
  "highlights": ["4-5 SPECIFIC highlights or unique selling points"],
  "customerPromise": "1-2 sentence promise specific to this type of business",
  "faq": [{"question": "common customer question for a ${catLabel}", "answer": "specific helpful answer"}, ...4-5 FAQs],
  "socialBio": "short social media bio (max 150 chars, with 1-2 emojis, specific to this business)"
}

Requirements:
- All content must be specific to ${catLabel} businesses in ${input.city || "the city"}
- Description: 80-150 words, natural and engaging, NO generic openings
- SEO title must include the category, city, and business name
- Keywords should include category + city + specific service terms
- Tags should be short (1-2 words), lowercase, specific
- FAQ should answer REAL customer questions for a ${catLabel}
- Social bio should be catchy with 1-2 relevant emojis
- Do NOT repeat the same phrase across fields`;

  const text = await callLLM(prompt);
  const parsed = extractJson(text || "");

  if (parsed) {
    return {
      description: String(parsed.description || "").slice(0, 800),
      shortDescription: String(parsed.shortDescription || "").slice(0, 160),
      tagline: String(parsed.tagline || "").slice(0, 60),
      seoTitle: String(parsed.seoTitle || "").slice(0, 60),
      metaDescription: String(parsed.metaDescription || "").slice(0, 160),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10).map(String) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
      services: Array.isArray(parsed.services) ? parsed.services.slice(0, 6).map(String) : [],
      whyChooseUs: Array.isArray(parsed.whyChooseUs) ? parsed.whyChooseUs.slice(0, 5).map(String) : [],
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5).map(String) : [],
      customerPromise: String(parsed.customerPromise || "").slice(0, 300),
      faq: Array.isArray(parsed.faq) ? parsed.faq.slice(0, 5).map((f: any) => ({ question: String(f.question || ""), answer: String(f.answer || "") })) : [],
      socialBio: String(parsed.socialBio || "").slice(0, 150),
    };
  }

  // Fallback: templated content
  const fallbackDesc = `${input.businessName} is a ${catLabel.toLowerCase()}${input.city ? ` based in ${input.city}` : ""}${input.specialities ? ` specializing in ${input.specialities}` : ""}. ${input.yearsExperience ? `With ${input.yearsExperience} years of experience, ` : ""}we deliver quality and customer satisfaction. Book directly — no commission, direct contact with the vendor.`;
  return {
    description: fallbackDesc.slice(0, 800),
    shortDescription: `${catLabel} in ${input.city || "your city"}. ${input.specialities || "Quality service guaranteed."}`.slice(0, 160),
    tagline: `${catLabel} in ${input.city || "your city"}`.slice(0, 60),
    seoTitle: `${input.businessName} — ${catLabel} in ${input.city || "your city"}`.slice(0, 60),
    metaDescription: `${input.businessName} is a ${catLabel.toLowerCase()}${input.city ? ` in ${input.city}` : ""}. ${input.specialities || "Quality service."} Book directly.`.slice(0, 160),
    keywords: [input.category, input.city, isFood ? "food" : "events", catLabel.toLowerCase(), input.subcategory].filter(Boolean).slice(0, 10),
    tags: [input.category, catLabel.toLowerCase(), input.subcategory].filter(Boolean).slice(0, 8),
    services: isFood ? ["Custom orders", "Delivery", "Catering"] : ["Event planning", "Consultation", "Custom packages"],
    whyChooseUs: ["Experienced team", "Quality guaranteed", "Direct communication", "Competitive pricing"],
    highlights: ["Professional service", "Customer-focused", "Reliable execution"],
    customerPromise: "We promise to deliver exceptional quality and make your experience memorable.",
    faq: [{ question: "Do you offer custom orders?", answer: "Yes, we specialize in custom orders tailored to your needs." }],
    socialBio: `${catLabel} in ${input.city || "your city"} ${isFood ? "🍰" : "🎉"} Book directly!`,
  };
}

// ── AI image analysis ────────────────────────────────────────────────────────

export async function analyzeBusinessImage(imageUrl: string): Promise<AiImageAnalysis | null> {
  const zai = await getZAI();
  if (!zai) return null;
  try {
    const completion = await zai.chat.completions.createVision({
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analyze this business logo/cover image. Return ONLY valid JSON with: {\"primaryColors\":[\"hex color codes\"],\"brandTheme\":\"one-word theme\",\"recommendedHomepageColors\":[\"hex codes for website\"],\"coverLayoutSuggestion\":\"brief suggestion\",\"brandPersonality\":[\"3-4 personality traits\"]}" },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      }],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content || "";
    const parsed = extractJson(text);
    if (parsed) {
      return {
        primaryColors: Array.isArray(parsed.primaryColors) ? parsed.primaryColors.slice(0, 5).map(String) : [],
        brandTheme: String(parsed.brandTheme || ""),
        recommendedHomepageColors: Array.isArray(parsed.recommendedHomepageColors) ? parsed.recommendedHomepageColors.slice(0, 4).map(String) : [],
        coverLayoutSuggestion: String(parsed.coverLayoutSuggestion || ""),
        brandPersonality: Array.isArray(parsed.brandPersonality) ? parsed.brandPersonality.slice(0, 4).map(String) : [],
      };
    }
    return null;
  } catch (err) {
    console.error("[ai-setup] image analysis failed:", err);
    return null;
  }
}

// ── Profile completeness ─────────────────────────────────────────────────────

export function computeProfileCompleteness(vendor: any): ProfileCompleteness {
  let businessInfo = 0;
  if (vendor.name) businessInfo += 20;
  if (vendor.category) businessInfo += 20;
  if (vendor.city) businessInfo += 15;
  if (vendor.country) businessInfo += 15;
  if (vendor.whatsapp) businessInfo += 15;
  if (vendor.address) businessInfo += 15;

  let logo = 0;
  if (vendor.avatarImage) logo += 50;
  if (vendor.heroImage) logo += 50;

  let description = 0;
  if (vendor.description && vendor.description.length >= 20) description += 50;
  if (vendor.tagline) description += 25;
  if (vendor.description && vendor.description.length >= 100) description += 25;

  let seo = 0;
  if (vendor.metaTitle) seo += 40;
  if (vendor.metaDescription) seo += 40;
  if (vendor.tags && JSON.parse(vendor.tags || "[]").length >= 3) seo += 20;

  let gallery = 0;
  try {
    const g = JSON.parse(vendor.gallery || "[]");
    gallery = Math.min(100, g.length * 20);
  } catch {}

  const overall = Math.round(businessInfo * 0.3 + logo * 0.15 + description * 0.25 + seo * 0.2 + gallery * 0.1);

  return { businessInfo, logo, description, seo, gallery, overall };
}

// ── AI recommendations ───────────────────────────────────────────────────────

export async function getAiRecommendations(vendorId: string): Promise<AiRecommendation[]> {
  const v = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, avatarImage: true, heroImage: true, gallery: true, description: true, metaTitle: true, metaDescription: true, tags: true, whatsapp: true, openHours: true, approved: true, ecosystem: true },
  });
  if (!v) return [];

  let galleryCount = 0;
  try { galleryCount = JSON.parse(v.gallery || "[]").length; } catch {}
  const productCount = await db.product.count({ where: { vendorId, status: "active" } }).catch(() => 0);

  const recs: AiRecommendation[] = [];

  if (galleryCount < 5) {
    recs.push({
      id: "gallery", title: `Upload ${5 - galleryCount} more gallery images`,
      detail: `You have ${galleryCount} images. Vendors with 5+ photos get 2× more enquiries.`,
      priority: "high", action: "Go to My Listing → Media", done: galleryCount >= 5,
    });
  }
  if (productCount === 0) {
    recs.push({
      id: "product", title: "Add your first product",
      detail: "Products increase visibility and give customers something to book.",
      priority: "high", action: "Go to My Products → Add Product", done: false,
    });
  }
  if (!v.approved) {
    recs.push({
      id: "verify", title: "Verify your business",
      detail: "Verified businesses get a blue badge and rank higher in search.",
      priority: "high", action: "Complete your profile and submit for verification", done: false,
    });
  }
  if (!v.instagram && !v.facebook && !v.youtube) {
    recs.push({
      id: "social", title: "Connect social media",
      detail: "Linking social profiles builds trust and drives traffic.",
      priority: "medium", action: "Go to My Listing → Contact", done: false,
    });
  }
  if (!v.openHours) {
    recs.push({
      id: "hours", title: "Complete business hours",
      detail: "Customers need to know when you're available.",
      priority: "medium", action: "Go to My Listing → Hours", done: false,
    });
  }
  if (!v.whatsapp) {
    recs.push({
      id: "whatsapp", title: "Enable WhatsApp contact",
      detail: "WhatsApp is the #1 way customers reach vendors.",
      priority: "high", action: "Add your WhatsApp number", done: false,
    });
  }
  recs.push({
    id: "upgrade", title: "Upgrade to Pro for better visibility",
    detail: "Pro vendors get 3× more profile views and featured placement.",
    priority: "low", action: "Go to Plan & Billing", done: false,
  });

  return recs;
}

// ── Fetch vendor context from DB ─────────────────────────────────────────────

export async function getVendorContext(vendorId: string): Promise<VendorSetupInput | null> {
  const v = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, ecosystem: true, category: true, subcategory: true, city: true, state: true, country: true, whatsapp: true, avatarImage: true, heroImage: true, tags: true, priceRange: true, yearsActive: true, deliveryAvailable: true, pickupAvailable: true, languagesSpoken: true },
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
    state: v.state || undefined,
    country: v.country || undefined,
    whatsapp: v.whatsapp || undefined,
    logoUrl: v.avatarImage || undefined,
    coverUrl: v.heroImage || undefined,
    tags: Array.isArray(tags) ? tags.join(", ") : "",
    priceRange: v.priceRange || undefined,
    yearsExperience: v.yearsActive ? String(v.yearsActive) : undefined,
    deliveryOptions: v.deliveryAvailable && v.pickupAvailable ? "Both" : v.deliveryAvailable ? "Delivery" : v.pickupAvailable ? "Pickup" : "None",
    languages: v.languagesSpoken || undefined,
  };
}
