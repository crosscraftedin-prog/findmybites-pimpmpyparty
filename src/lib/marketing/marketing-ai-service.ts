/**
 * Marketing AI Service — LLM-powered growth advisor, social posts, campaigns,
 * email templates, WhatsApp messages, SEO copy.
 * ───────────────────────────────────────────────────────────────────────────
 * Uses z-ai-web-dev-sdk (GLM) via the resilient getZAI() factory.
 * Every generation logs to AiGenerationLog for admin analytics + rate limiting.
 * Falls back to sensible templated content when the LLM is unavailable so the
 * vendor dashboard is never blocked.
 */
import { getZAI } from "@/lib/zai-server";
import { db } from "@/lib/db";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";
import { getVendorAttributes } from "@/lib/attributes/attribute-service";
import { getCategoryLabel } from "@/lib/category-server";

async function logAi(vendorId: string | null, feature: string, tokens: number, success: boolean) {
  try {
    await db.aiGenerationLog.create({ data: { vendorId, feature, tokens, success } });
  } catch {}
}

async function generate(prompt: string, vendorId: string | null, feature: string, expectJson = false): Promise<string | null> {
  // ── Prompt injection check ──
  // The prompt contains trusted system instructions + vendor context (from DB).
  // We check the full prompt for injection patterns as a defense-in-depth measure.
  const sanitizeResult = sanitizePrompt(prompt);
  if (sanitizeResult.blocked) {
    logger.warn("marketing-ai", "Prompt injection blocked", { feature, reason: sanitizeResult.reason });
    await logAi(vendorId, feature, 0, false);
    return null;
  }

  const zai = await getZAI();
  if (!zai) { await logAi(vendorId, feature, 0, false); return null; }
  try {
    // ── 30-second timeout ──
    const { result: text, timedOut } = await callWithTimeout(async (_signal) => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: sanitizeResult.sanitized || prompt }],
        thinking: { type: "disabled" },
      });
      return completion.choices[0]?.message?.content || "";
    }, 30_000);

    if (timedOut) {
      logger.warn("marketing-ai", "LLM call timed out after 30s", { feature, vendorId });
      await logAi(vendorId, feature, 0, false);
      return null;
    }

    await logAi(vendorId, feature, Math.ceil((text || "").length / 4), true);
    return text;
  } catch (err) {
    logger.error("marketing-ai", `${feature} failed`, { message: err instanceof Error ? err.message : String(err) });
    await logAi(vendorId, feature, 0, false);
    return null;
  }
}

function extractJson(text: string): any | null {
  try {
    const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

// ── AI Growth Advisor ────────────────────────────────────────────────────────
export interface GrowthRecommendation {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  action: string;
}

export async function getGrowthAdvice(vendorId: string): Promise<GrowthRecommendation[]> {
  const [vendor, products, reviews, score] = await Promise.all([
    db.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, category: true, ecosystem: true, city: true,
        tagline: true, description: true, rating: true, reviewCount: true,
        responseTime: true, metaTitle: true, metaDescription: true, tags: true,
        heroImage: true, avatarImage: true, gallery: true },
    }),
    db.product.count({ where: { vendorId, status: "active" } }),
    db.review.count({ where: { vendorId } }),
    db.growthScore.findFirst({ where: { vendorId }, orderBy: { computedAt: "desc" }, select: { breakdown: true, weakAreas: true } }),
  ]);
  if (!vendor) throw new Error("Vendor not found");

  let galleryCount = 0;
  try { galleryCount = JSON.parse(vendor.gallery || "[]").length; } catch {}
  let tagCount = 0;
  try { tagCount = JSON.parse(vendor.tags || "[]").length; } catch {}

  const context = {
    business: vendor.name, category: vendor.category, city: vendor.city,
    ecosystem: vendor.ecosystem, products, reviews, rating: vendor.rating,
    hasTagline: !!vendor.tagline, hasDescription: !!vendor.description,
    hasMetaTitle: !!vendor.metaTitle, hasMetaDescription: !!vendor.metaDescription,
    tagCount, galleryCount, responseTime: vendor.responseTime,
    weakAreas: score?.weakAreas ? JSON.parse(score.weakAreas) : [],
  };

  const prompt = `You are a marketing growth advisor for a ${vendor.ecosystem === "FINDMYBITES" ? "food business" : "event business"}.
Analyze this vendor and return 3-5 personalized, actionable growth recommendations.

Vendor context (JSON):
${JSON.stringify(context, null, 2)}

Return ONLY a JSON array (no markdown) of objects:
[{"title":"short title","detail":"one sentence explanation","priority":"high|medium|low","action":"specific action to take"}]

Focus on the weakest areas. Be specific to their category (${vendor.category}) and city (${vendor.city}).`;

  const text = await generate(prompt, vendorId, "growth_advisor", true);
  const parsed = extractJson(text || "");
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.slice(0, 5).map((r: any) => ({
      title: String(r.title || "Recommendation"),
      detail: String(r.detail || ""),
      priority: (["high", "medium", "low"].includes(r.priority) ? r.priority : "medium"),
      action: String(r.action || ""),
    }));
  }

  // Fallback rule-based recommendations
  const recs: GrowthRecommendation[] = [];
  if (products < 5) recs.push({ title: "Upload more products", detail: `You have ${products} products. Vendors with 10+ products get 3× more views.`, priority: "high", action: "Add 3 more products to increase visibility." });
  if (!vendor.metaTitle) recs.push({ title: "Add SEO meta title", detail: "Your profile is missing a meta title — customers can't find you on Google.", priority: "high", action: "Open SEO Center and generate a meta title." });
  if (tagCount < 5) recs.push({ title: "Add keyword tags", detail: `Only ${tagCount} tags. Customers search for specific keywords like "chocolate cake".`, priority: "medium", action: "Add 5+ relevant keyword tags to your profile." });
  if (galleryCount < 5) recs.push({ title: "Add more photos", detail: `Galleries with 8+ photos get 2× more enquiries. You have ${galleryCount}.`, priority: "medium", action: "Upload high-quality photos of your work." });
  if (reviews < 10) recs.push({ title: "Collect more reviews", detail: `Only ${reviews} reviews. Use the Review Booster to request reviews from happy customers.`, priority: "high", action: "Send review requests via WhatsApp or email." });
  if (recs.length === 0) recs.push({ title: "Run a marketing campaign", detail: "Your profile looks complete. Boost growth with a festival or weekend campaign.", priority: "low", action: "Create a campaign in the Marketing Center." });
  return recs.slice(0, 5);
}

// ── Social Media Generator ───────────────────────────────────────────────────
export interface SocialPost {
  caption: string;
  hashtags: string[];
}

const SOCIAL_PLATFORMS: Record<string, { tone: string; maxLength: number; hashtagCount: number }> = {
  instagram: { tone: "visual, energetic, emoji-rich", maxLength: 2200, hashtagCount: 10 },
  facebook: { tone: "conversational, community-focused", maxLength: 2000, hashtagCount: 3 },
  whatsapp: { tone: "short, direct, promotional", maxLength: 500, hashtagCount: 0 },
  threads: { tone: "casual, conversational, punchy", maxLength: 500, hashtagCount: 2 },
  twitter: { tone: "concise, punchy, trending", maxLength: 280, hashtagCount: 2 },
  linkedin: { tone: "professional, business-focused", maxLength: 3000, hashtagCount: 5 },
  pinterest: { tone: "descriptive, keyword-rich, inspiring", maxLength: 500, hashtagCount: 4 },
};

export async function generateSocialPost(
  vendorId: string,
  platform: string,
  topic: string,
  context?: { productName?: string; offer?: string; festival?: string }
): Promise<SocialPost> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true, category: true, city: true, ecosystem: true, tagline: true },
  }) as any;
  if (!vendor) throw new Error("Vendor not found");

  const p = SOCIAL_PLATFORMS[platform] || SOCIAL_PLATFORMS.instagram;
  const prompt = `Generate a ${platform} post for a ${vendor.ecosystem === "FINDMYBITES" ? "food" : "event"} business.
Business: ${vendor.name}
Category: ${vendor.category}
City: ${vendor.city}
Topic: ${topic}
${context?.productName ? `Product: ${context.productName}` : ""}
${context?.offer ? `Offer: ${context.offer}` : ""}
${context?.festival ? `Festival: ${context.festival}` : ""}

Tone: ${p.tone}
Max length: ${p.maxLength} chars
Hashtags: ${p.hashtagCount}

Return ONLY JSON: {"caption":"...","hashtags":["#tag1","#tag2"]}`;

  const text = await generate(prompt, vendorId, "social_post", true);
  const parsed = extractJson(text || "");
  if (parsed?.caption) {
    return { caption: parsed.caption, hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [] };
  }
  // Fallback
  const fallbackCaption = `🎉 ${topic} at ${vendor.name}! ${vendor.tagline || `Best ${vendor.category} in ${vendor.city}.`} Book now! 📍 ${vendor.city}`;
  return {
    caption: fallbackCaption.slice(0, p.maxLength),
    hashtags: [`#${vendor.category}`, `#${vendor.city}`, "#FindMyBites"].slice(0, p.hashtagCount + 1),
  };
}

// ── Marketing Campaign copy ──────────────────────────────────────────────────
export interface CampaignCopy {
  headline: string;
  description: string;
  terms: string;
}

export async function generateCampaignCopy(
  vendorId: string,
  type: string,
  name: string,
  details?: { discount?: number; festival?: string }
): Promise<CampaignCopy> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true, category: true, city: true, ecosystem: true, tagline: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const prompt = `Generate marketing copy for a campaign.
Business: ${vendor.name} (${vendor.category}, ${vendor.city})
Campaign type: ${type}
Campaign name: ${name}
${details?.discount ? `Discount: ${details.discount}%` : ""}
${details?.festival ? `Festival: ${details.festival}` : ""}

Return ONLY JSON: {"headline":"max 60 chars","description":"2-3 sentences persuasive copy","terms":"1 line terms & conditions"}`;

  const text = await generate(prompt, vendorId, "campaign_copy", true);
  const parsed = extractJson(text || "");
  if (parsed?.headline) {
    return {
      headline: parsed.headline,
      description: parsed.description || "",
      terms: parsed.terms || "Offer valid for a limited time. Cannot be combined with other offers.",
    };
  }
  return {
    headline: name,
    description: `${details?.discount ? `${details.discount}% off ` : ""}${name} at ${vendor.name}! Limited time only.`,
    terms: "Offer valid for a limited time. Cannot be combined with other offers.",
  };
}

// ── Email campaign generator ─────────────────────────────────────────────────
export interface EmailContent {
  subject: string;
  preheader: string;
  body: string;
}

const EMAIL_TEMPLATES: Record<string, string> = {
  new_product: "announce a new product/menu item",
  festival: "send festival greetings + offer",
  special_offer: "promote a special discount",
  thank_you: "thank customers after a booking",
  booking_reminder: "remind customers of an upcoming booking",
  re_engagement: "win back customers who haven't ordered recently",
};

export async function generateEmailCampaign(
  vendorId: string,
  template: string,
  details?: { productName?: string; festival?: string; offer?: string }
): Promise<EmailContent> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true, category: true, city: true, ecosystem: true, tagline: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const intent = EMAIL_TEMPLATES[template] || "promote the business";
  const prompt = `Generate an email newsletter for a ${vendor.ecosystem === "FINDMYBITES" ? "food" : "event"} business.
Business: ${vendor.name} (${vendor.category}, ${vendor.city})
Purpose: ${intent}
${details?.productName ? `Product: ${details.productName}` : ""}
${details?.festival ? `Festival: ${details.festival}` : ""}
${details?.offer ? `Offer: ${details.offer}` : ""}

Return ONLY JSON: {"subject":"max 60 chars","preheader":"max 80 chars preview text","body":"3-4 paragraph email body with greeting and sign-off"}`;

  const text = await generate(prompt, vendorId, "email_campaign", true);
  const parsed = extractJson(text || "");
  if (parsed?.subject) {
    return { subject: parsed.subject, preheader: parsed.preheader || "", body: parsed.body || "" };
  }
  return {
    subject: template === "festival" ? `${details?.festival || "Festival"} wishes from ${vendor.name}!` : `Update from ${vendor.name}`,
    preheader: `Special ${template.replace("_", " ")} from ${vendor.name}`,
    body: `Dear Customer,\n\n${intent.charAt(0).toUpperCase() + intent.slice(1)} from ${vendor.name} in ${vendor.city}.\n\nVisit our profile to learn more and book directly.\n\nWarm regards,\n${vendor.name}`,
  };
}

// ── WhatsApp message generator ───────────────────────────────────────────────
export interface WhatsAppMessage {
  message: string;
}

export async function generateWhatsAppMessage(
  vendorId: string,
  type: string,
  details?: { productName?: string; offer?: string; festival?: string; customerName?: string }
): Promise<WhatsAppMessage> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true, category: true, city: true, ecosystem: true, tagline: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const typeLabels: Record<string, string> = {
    promo: "a promotional message",
    festival: "festival greetings with an offer",
    new_product: "a new product announcement",
    booking_reminder: "a booking reminder",
    payment_reminder: "a payment reminder",
  };
  const intent = typeLabels[type] || "a promotional message";

  const prompt = `Generate a WhatsApp marketing message for a ${vendor.ecosystem === "FINDMYBITES" ? "food" : "event"} business.
Business: ${vendor.name} (${vendor.category}, ${vendor.city})
Message type: ${intent}
${details?.customerName ? `Customer: ${details.customerName}` : ""}
${details?.productName ? `Product: ${details.productName}` : ""}
${details?.offer ? `Offer: ${details.offer}` : ""}
${details?.festival ? `Festival: ${details.festival}` : ""}

Keep it short (max 300 chars), use 1-2 emojis, include a clear call-to-action.
Return ONLY JSON: {"message":"..."}`;

  const text = await generate(prompt, vendorId, "whatsapp_msg", true);
  const parsed = extractJson(text || "");
  if (parsed?.message) return { message: parsed.message };

  const fallback = `🎉 ${details?.offer ? `${details.offer} at ` : ""}${vendor.name}! ${vendor.tagline || `Best ${vendor.category} in ${vendor.city}.`} Book now 👉`;
  return { message: fallback.slice(0, 300) };
}

// ── SEO copy generator ───────────────────────────────────────────────────────
export interface SeoCopy {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
  openGraph: { title: string; description: string };
  twitter: { title: string; description: string };
  jsonLd: Record<string, any>;
}

/**
 * Build a LocalBusiness (or FoodEstablishment) JSON-LD object deterministically
 * from the vendor record. We never trust the LLM with structured data — phone
 * numbers, addresses, geo coordinates and social links must come from the DB.
 */
function buildLocalBusinessJsonLd(vendor: {
  name: string; slug: string; ecosystem: string;
  description: string | null; tagline: string | null;
  city: string; state: string | null; country: string | null;
  countryCode: string | null; address: string | null; zipCode: string | null;
  phone: string | null; whatsapp: string | null; website: string | null;
  heroImage: string | null; avatarImage: string | null;
  priceRange: string | null; openHours: string | null;
  latitude: number | null; longitude: number | null;
  rating: number | null; reviewCount: number | null;
  instagram: string | null; facebook: string | null; youtube: string | null;
  tiktok: string | null; twitter: string | null; linkedin: string | null;
  pinterest: string | null; snapchat: string | null; telegram: string | null;
}, catLabel: string, metaDescription: string): Record<string, any> {
  const sameAs = [
    vendor.website, vendor.instagram, vendor.facebook, vendor.youtube,
    vendor.tiktok, vendor.twitter, vendor.linkedin, vendor.pinterest,
    vendor.snapchat, vendor.telegram,
  ].filter((s): s is string => Boolean(s && s.trim()));

  const ecosystemDomain = vendor.ecosystem === "FINDMYBITES"
    ? "https://www.findmybites.com"
    : "https://www.pimpmyparty.com";
  const profileUrl = `${ecosystemDomain}/vendor/${vendor.slug}`;
  const schemaType = vendor.ecosystem === "FINDMYBITES" ? "FoodEstablishment" : "LocalBusiness";

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": profileUrl,
    name: vendor.name,
    description: metaDescription || vendor.description || vendor.tagline ||
      `${catLabel} in ${vendor.city}`,
    url: vendor.website || profileUrl,
    image: vendor.heroImage || vendor.avatarImage || undefined,
    telephone: vendor.phone || vendor.whatsapp || undefined,
    priceRange: vendor.priceRange || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: vendor.address || undefined,
      addressLocality: vendor.city,
      addressRegion: vendor.state || undefined,
      postalCode: vendor.zipCode || undefined,
      addressCountry: vendor.country || vendor.countryCode || undefined,
    },
  };

  if (vendor.latitude != null && vendor.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: vendor.latitude,
      longitude: vendor.longitude,
    };
  }
  if (vendor.openHours) jsonLd.openingHours = vendor.openHours;
  if (vendor.rating && vendor.reviewCount && vendor.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: vendor.rating,
      reviewCount: vendor.reviewCount,
      bestRating: 5,
    };
  }
  if (vendor.ecosystem === "FINDMYBITES" && catLabel) {
    jsonLd.servesCuisine = catLabel;
  }
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;

  // Strip undefined values (recursive) so the JSON-LD is clean.
  return JSON.parse(
    JSON.stringify(jsonLd, (_k, v) => (v === undefined ? undefined : v))
  );
}

export async function generateSeoCopy(vendorId: string): Promise<SeoCopy> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true, name: true, slug: true, category: true, subcategory: true,
      ecosystem: true, tagline: true, description: true,
      city: true, state: true, country: true, countryCode: true,
      address: true, zipCode: true,
      currency: true, priceRange: true, basePrice: true,
      phone: true, whatsapp: true, website: true,
      instagram: true, facebook: true, youtube: true, tiktok: true,
      twitter: true, linkedin: true, pinterest: true, snapchat: true, telegram: true,
      openHours: true, languagesSpoken: true, tags: true,
      deliveryAvailable: true, pickupAvailable: true,
      homeService: true, onlineConsultation: true,
      latitude: true, longitude: true,
      rating: true, reviewCount: true,
      heroImage: true, avatarImage: true,
      yearsActive: true,
    },
  });
  if (!vendor) throw new Error("Vendor not found");

  // ── Enrich: human-readable category label + global attributes ──
  const [catLabel, attributes] = await Promise.all([
    getCategoryLabel(vendor.category),
    getVendorAttributes(vendor.id).catch(() => []),
  ]);

  // ── Parse + derive structured context ──
  let tags: string[] = [];
  try { tags = JSON.parse(vendor.tags || "[]"); } catch { tags = []; }
  if (!Array.isArray(tags)) tags = [];

  const services: string[] = [];
  if (vendor.deliveryAvailable) services.push("delivery");
  if (vendor.pickupAvailable) services.push("pickup");
  if (vendor.homeService) services.push("home service");
  if (vendor.onlineConsultation) services.push("online consultation");

  const languages = (vendor.languagesSpoken || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const attributeNames = attributes
    .map((a) => a.name)
    .filter(Boolean);

  const ecosystemLabel = vendor.ecosystem === "FINDMYBITES" ? "food" : "event";
  const marketplaceName = vendor.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty";

  // Description is sometimes very long — cap at 600 chars for the prompt.
  const trimmedDescription = (vendor.description || "").slice(0, 600);

  // ── Build the rich context block ──
  const contextLines = [
    `Business Name: ${vendor.name}`,
    `Marketplace: ${marketplaceName} (${ecosystemLabel} business)`,
    `Category: ${catLabel || vendor.category}${vendor.subcategory ? ` → ${vendor.subcategory}` : ""}`,
    `City: ${vendor.city}`,
    vendor.state ? `State/Region: ${vendor.state}` : null,
    `Country: ${vendor.country}`,
    vendor.tagline ? `Tagline: ${vendor.tagline}` : null,
    trimmedDescription ? `Business Description: ${trimmedDescription}` : null,
    attributeNames.length ? `Attributes & Specialties: ${attributeNames.join(", ")}` : null,
    tags.length ? `Specialty Tags: ${tags.join(", ")}` : null,
    services.length ? `Services offered: ${services.join(", ")}` : null,
    languages.length ? `Languages spoken: ${languages.join(", ")}` : null,
    vendor.priceRange ? `Price range: ${vendor.priceRange}` : null,
    vendor.openHours ? `Operating hours: ${vendor.openHours}` : null,
    vendor.rating && vendor.reviewCount
      ? `Reputation: ${vendor.rating}★ from ${vendor.reviewCount} reviews`
      : null,
    vendor.yearsActive ? `Years in business: ${vendor.yearsActive}` : null,
  ].filter((l): l is string => Boolean(l));

  // ── Build the detailed prompt ──
  const prompt = `You are an expert SEO copywriter for a ${ecosystemLabel} business marketplace called ${marketplaceName}.
Generate comprehensive, keyword-rich, natural-sounding SEO metadata for this business profile.

═══════════════════════════════════════════════════════
BUSINESS CONTEXT (use ALL of this — be specific, never generic):
═══════════════════════════════════════════════════════
${contextLines.join("\n")}

═══════════════════════════════════════════════════════
REQUIREMENTS — produce ALL of the following fields:
═══════════════════════════════════════════════════════
1. metaTitle (60-70 chars): Pipe-separated format
   "{BusinessName} | {3 specific offerings from attributes/tags} & {CategoryLabel} in {City} | ${marketplaceName}"
   Example: "CATU Listing Test | Custom Birthday Cakes, Wedding Cakes & Bakery in Hyderabad | FindMyBites"

2. metaDescription (150-170 chars): One or two flowing sentences that mention
   the business name, specific offerings (pull from attributes/tags), the city,
   key services if any, and end with a call-to-action mentioning "${marketplaceName}"
   and "no commission" / "order directly".

3. keywords (10-15): Real search terms a customer might type. Mix:
   - "{CategoryLabel} in {City}" and "{City} {CategoryLabel}"
   - Specific products/services from attributes (e.g. "eggless cakes", "wedding cakes", "sugar-free desserts")
   - Dietary/lifestyle tags if present (eggless, vegan, gluten-free, halal)
   - Modifier phrases ("near me", "best", "custom", "online order")
   - One brand keyword ("${marketplaceName.toLowerCase()}")

4. slug (3-6 words, lowercase kebab-case): SEO-friendly URL slug derived from
   the business name + city (e.g. "catu-bakery-hyderabad").

5. openGraph.title (60-70 chars): Social-share title — punchier than metaTitle.
6. openGraph.description (150-200 chars): Social-share description with emoji-friendly tone.
7. twitter.title (60-70 chars): Twitter card title — concise and click-worthy.
8. twitter.description (150-200 chars): Twitter card description.

═══════════════════════════════════════════════════════
CRITICAL RULES:
═══════════════════════════════════════════════════════
- Be SPECIFIC to this business. Use the actual attributes, tags, and specialties listed above — NOT generic phrases like "quality products" or "best in town".
- Mention the business name AND city at least once in every text field.
- Read naturally — no keyword stuffing.
- Keep character counts strictly within the limits above.
- Return ONLY a JSON object (no markdown, no prose, no code fences).

Return JSON in EXACTLY this shape:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."],
  "slug": "...",
  "openGraph": { "title": "...", "description": "..." },
  "twitter": { "title": "...", "description": "..." }
}`;

  const text = await generate(prompt, vendorId, "seo", true);
  const parsed = extractJson(text || "");

  // ── Build the deterministic JSON-LD (independent of LLM) ──
  // We use the LLM's metaDescription if available (richer), else fall back.
  const metaDescriptionForLd = parsed?.metaDescription
    ? String(parsed.metaDescription).slice(0, 170)
    : (vendor.description || vendor.tagline || `${catLabel} in ${vendor.city}`);
  const jsonLd = buildLocalBusinessJsonLd(vendor, catLabel, metaDescriptionForLd);

  if (parsed?.metaTitle) {
    const metaTitle = String(parsed.metaTitle).slice(0, 70);
    const metaDescription = String(parsed.metaDescription || "").slice(0, 170);
    const keywords: string[] = Array.isArray(parsed.keywords)
      ? parsed.keywords.map(String).slice(0, 15)
      : [];
    const slug = String(parsed.slug || vendor.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || vendor.slug;
    const ogTitle = String(parsed.openGraph?.title || metaTitle).slice(0, 70);
    const ogDesc = String(parsed.openGraph?.description || metaDescription).slice(0, 200);
    const twTitle = String(parsed.twitter?.title || ogTitle).slice(0, 70);
    const twDesc = String(parsed.twitter?.description || ogDesc).slice(0, 200);

    return {
      metaTitle,
      metaDescription,
      keywords,
      slug,
      openGraph: { title: ogTitle, description: ogDesc },
      twitter: { title: twTitle, description: twDesc },
      jsonLd,
    };
  }

  // ── Fallback: templated content using ALL available context ──
  logger.warn("marketing-ai", "SEO LLM returned no parseable result — using templated fallback", { vendorId });
  const offeringsHint = attributeNames.length
    ? attributeNames.slice(0, 3).join(", ").toLowerCase()
    : (tags[0] || catLabel).toLowerCase();
  const fallbackTitle = `${vendor.name} | ${offeringsHint.charAt(0).toUpperCase() + offeringsHint.slice(1)} & ${catLabel} in ${vendor.city} | ${marketplaceName}`.slice(0, 70);
  const servicesClause = services.length ? ` Services: ${services.join(", ")}.` : "";
  const fallbackDesc = `${vendor.name} is a ${catLabel.toLowerCase()} in ${vendor.city} offering ${offeringsHint}.${servicesClause} Order directly from the vendor with no commission through ${marketplaceName}.`.slice(0, 170);
  const fallbackKeywords = Array.from(new Set([
    `${catLabel} ${vendor.city}`.toLowerCase(),
    `${vendor.city} ${catLabel}`.toLowerCase(),
    catLabel.toLowerCase(),
    ...tags.slice(0, 5).map((t) => String(t).toLowerCase()),
    ...attributeNames.slice(0, 5).map((a) => String(a).toLowerCase()),
    `${ecosystemLabel} ${vendor.city}`.toLowerCase(),
    `best ${catLabel.toLowerCase()} near me`,
    "order online",
    marketplaceName.toLowerCase(),
  ])).slice(0, 15);

  return {
    metaTitle: fallbackTitle,
    metaDescription: fallbackDesc,
    keywords: fallbackKeywords,
    slug: vendor.slug,
    openGraph: { title: fallbackTitle, description: fallbackDesc.slice(0, 200) },
    twitter: { title: fallbackTitle, description: fallbackDesc.slice(0, 200) },
    jsonLd,
  };
}
