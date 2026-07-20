export const maxDuration = 30;
import { guardAiRoute } from "@/lib/billing/guards";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

/**
 * GET /api/ai/vendor-faq?vendorId=xxx
 *
 * Generates an FAQ list for a vendor storefront. Uses AI to naturalise
 * the answers when available, otherwise returns template-based answers
 * derived from the vendor's data.
 *
 * NOTE: `customisationAvailable`, `minOrderForOffer` and `leadTime` live
 * on the Product model (not Vendor), so we aggregate them from the
 * vendor's products. `deliveryAvailable`, `pickupAvailable`,
 * `serviceAreas`, `serviceRadiusKm` and `responseTime` live on Vendor.
 *
 * Response: { faqs: [{ question, answer }], source: "ai" | "template" }
 */

interface FaqItem {
  question: string;
  answer: string;
}

interface VendorFaqRow {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  serviceAreas: string | null;
  serviceRadiusKm: number | null;
  responseTime: string;
  currency: string;
}

interface VendorProductRow {
  name: string;
  price: number;
  isFeatured: boolean;
  badge: string | null;
  productType: string | null;
  customisationAvailable: boolean;
  minOrderForOffer: number | null;
  leadTime: string | null;
}

function parseStringList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean) as string[];
  } catch {
    // fallthrough
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface AggregatedProductFlags {
  anyCustomisation: boolean;
  minOrderMin: number | null;
  leadTimeSample: string | null;
}

function aggregateProductFlags(products: VendorProductRow[]): AggregatedProductFlags {
  let anyCustomisation = false;
  let minOrderMin: number | null = null;
  let leadTimeSample: string | null = null;
  for (const p of products) {
    if (p.customisationAvailable) anyCustomisation = true;
    if (p.minOrderForOffer != null && p.minOrderForOffer > 0) {
      if (minOrderMin == null || p.minOrderForOffer < minOrderMin) {
        minOrderMin = p.minOrderForOffer;
      }
    }
    if (!leadTimeSample && p.leadTime) leadTimeSample = p.leadTime;
  }
  return { anyCustomisation, minOrderMin, leadTimeSample };
}

/** Build the structured FAQ list from vendor + product data. */
function buildTemplateFaqs(
  vendor: VendorFaqRow,
  products: VendorProductRow[],
  flags: AggregatedProductFlags
): FaqItem[] {
  const faqs: FaqItem[] = [];

  // 1. Delivery
  if (vendor.deliveryAvailable) {
    const areas = parseStringList(vendor.serviceAreas);
    faqs.push({
      question: "Do you deliver?",
      answer:
        areas.length > 0
          ? `Yes, we offer delivery throughout ${areas.slice(0, 4).join(", ")}${areas.length > 4 ? " and surrounding areas" : ""}.`
          : "Yes, we offer delivery. Contact us for delivery to your location.",
    });
  } else {
    faqs.push({
      question: "Do you deliver?",
      answer: vendor.pickupAvailable
        ? "We do not offer delivery, but pickup is available from our location."
        : "Please contact us to arrange delivery or pickup.",
    });
  }

  // 2. Customisation (aggregated from products)
  faqs.push({
    question: "Can I customise my order?",
    answer: flags.anyCustomisation
      ? "Yes! We love customising orders to match your event. Send us your requirements and we'll create something special for you."
      : "We offer a set menu of options. Please contact us to see what's currently available.",
  });

  // 3. Minimum order (aggregated from products)
  faqs.push({
    question: "What is your minimum order?",
    answer:
      flags.minOrderMin != null
        ? `Our minimum order is ${vendor.currency} ${flags.minOrderMin}.`
        : "Contact us for minimum order details — it varies by product and event size.",
  });

  // 4. Lead time / how much notice (leadTime from products, fallback to vendor.responseTime)
  faqs.push({
    question: "How much notice is required?",
    answer: flags.leadTimeSample
      ? `We require ${flags.leadTimeSample} notice for orders.`
      : vendor.responseTime
        ? `We typically respond ${vendor.responseTime}. For orders, please place them as early as possible to guarantee availability.`
        : "Please place orders at least a few days in advance to guarantee availability.",
  });

  // 5. Travel outside the city
  if (vendor.serviceRadiusKm != null) {
    faqs.push({
      question: "Do you travel outside the city?",
      answer:
        vendor.serviceRadiusKm > 0
          ? `Yes, we travel up to ${vendor.serviceRadiusKm} km from ${vendor.city} for events.`
          : `We primarily serve ${vendor.city} and nearby areas.`,
    });
  }

  // 6. Popular products
  const featured = products.filter((p) => p.isFeatured || p.badge);
  const popular = (featured.length > 0 ? featured : products).slice(0, 3);
  if (popular.length > 0) {
    faqs.push({
      question: "What are your most popular products?",
      answer: `Our most popular items are ${popular.map((p) => p.name).join(", ")}. Customers love them!`,
    });
  }

  // 7. Payment methods
  faqs.push({
    question: "What payment methods do you accept?",
    answer: "We accept online payments via Razorpay, including cards, UPI, and net banking.",
  });

  return faqs;
}

/** Build the prompt for the AI to naturalise the FAQ answers. */
function buildPrompt(
  vendor: VendorFaqRow,
  flags: AggregatedProductFlags,
  faqs: FaqItem[]
): string {
  const lines = [
    `Vendor: ${vendor.name}`,
    `Category: ${vendor.category}`,
    `City: ${vendor.city}, ${vendor.country}`,
    `Delivery available: ${vendor.deliveryAvailable ? "Yes" : "No"}`,
    `Pickup available: ${vendor.pickupAvailable ? "Yes" : "No"}`,
    vendor.serviceAreas ? `Service areas: ${vendor.serviceAreas}` : "",
    vendor.serviceRadiusKm != null ? `Service radius: ${vendor.serviceRadiusKm} km` : "",
    vendor.responseTime ? `Response time: ${vendor.responseTime}` : "",
    flags.leadTimeSample ? `Lead time: ${flags.leadTimeSample}` : "",
    `Customisation available: ${flags.anyCustomisation ? "Yes" : "No"}`,
    flags.minOrderMin != null ? `Minimum order: ${vendor.currency} ${flags.minOrderMin}` : "",
  ].filter(Boolean);

  const faqText = faqs
    .map((f, i) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`)
    .join("\n");

  return `You are improving FAQ answers for a vendor storefront. Below are the vendor's facts and a draft FAQ list. Rewrite each answer to sound natural, friendly, and concise (1-2 sentences). Do NOT invent facts not present in the vendor data. Keep the same question text. Return ONLY a JSON array of { "question": "...", "answer": "..." } objects — no markdown, no commentary.

Vendor facts:
${lines.join("\n")}

Draft FAQ:
${faqText}

Return the JSON array now:`;
}

/** Try to parse the AI response as a JSON array of FAQ items. */
function parseAiFaqs(content: string, fallback: FaqItem[]): FaqItem[] {
  try {
    let text = content.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    }
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      text = text.slice(firstBracket, lastBracket + 1);
    }
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const items: FaqItem[] = parsed
        .filter((x) => x && typeof x === "object" && typeof x.question === "string")
        .map((x) => ({
          question: String(x.question),
          answer: typeof x.answer === "string" ? String(x.answer) : "",
        }));
      if (items.length > 0) return items;
    }
  } catch {
    // fall through
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId query parameter required" },
        { status: 400 }
      );
    }

    // ── 1. Fetch vendor ──────────────────────────────────────────────────
    let vendor: VendorFaqRow | null = null;
    try {
      vendor = (await db.vendor.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          country: true,
          deliveryAvailable: true,
          pickupAvailable: true,
          serviceAreas: true,
          serviceRadiusKm: true,
          responseTime: true,
          currency: true,
        },
      })) as VendorFaqRow | null;
    } catch (e) {
      logger.error("ai-vendor-faq", "vendor fetch failed", { message: (e as Error)?.message?.slice(0, 120) });
    }

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // ── 2. Fetch products (with customisation/minOrder/leadTime) ─────────
    let products: VendorProductRow[] = [];
    try {
      products = (await db.product.findMany({
        where: { vendorId, isAvailable: true },
        select: {
          name: true,
          price: true,
          isFeatured: true,
          badge: true,
          productType: true,
          customisationAvailable: true,
          minOrderForOffer: true,
          leadTime: true,
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 20,
      })) as VendorProductRow[];
    } catch (e) {
      logger.error("ai-vendor-faq", "products fetch failed", { message: (e as Error)?.message?.slice(0, 120) });
    }

    const flags = aggregateProductFlags(products);

    // ── 3. Build template FAQs first (always have these as fallback) ─────
    const templateFaqs = buildTemplateFaqs(vendor, products, flags);

    // ── 4. Try AI enhancement ────────────────────────────────────────────
    const zai = await getZAI();
    if (zai) {
      const prompt = buildPrompt(vendor, flags, templateFaqs);
      // ── Prompt injection check (defense-in-depth: vendor DB data + template FAQs) ──
      const sanitizeResult = sanitizePrompt(prompt);
      if (sanitizeResult.blocked) {
        logger.warn("ai-vendor-faq", "Prompt injection blocked", { reason: sanitizeResult.reason, vendorId });
      } else {
        try {
          // ── 30-second timeout ──
          const { result: content, timedOut } = await callWithTimeout(async (_signal) => {
            const completion = await zai.chat.completions.create({
              messages: [
                {
                  role: "assistant",
                  content:
                    "You are a helpful storefront copywriter. You return ONLY JSON when asked.",
                },
                { role: "user", content: sanitizeResult.sanitized },
              ],
              thinking: { type: "disabled" },
            });
            return completion.choices[0]?.message?.content || "";
          }, 30_000);

          if (timedOut) {
            logger.warn("ai-vendor-faq", "LLM call timed out after 30s", { vendorId });
          } else if (content) {
            const aiFaqs = parseAiFaqs(content, templateFaqs);
            return NextResponse.json({ faqs: aiFaqs, source: "ai" as const });
          }
        } catch (e) {
          logger.error("ai-vendor-faq", "AI call failed, using template", { message: (e as Error)?.message?.slice(0, 120) });
        }
      }
    }

    return NextResponse.json({ faqs: templateFaqs, source: "template" as const });
  } catch (err) {
    logger.error("ai-vendor-faq", "GET failed", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { faqs: [], source: "template" },
      { status: 200 }
    );
  }
}
