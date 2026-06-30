import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";

/**
 * GET /api/ai/vendor-summary?vendorId=xxx
 *
 * Generates an AI-powered 2-3 sentence store summary for a vendor
 * storefront. Falls back to a template-based summary if the AI is
 * unavailable or the DB is unreachable.
 *
 * Response: { summary: string, source: "ai" | "template" }
 */

interface VendorSummaryRow {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  description: string;
  tags: string;
  rating: number;
  reviewCount: number;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  serviceAreas: string | null;
  subcategory: string | null;
  ecosystem: string;
  tagline: string;
}

interface VendorProductRow {
  name: string;
  price: number;
  isFeatured: boolean;
  badge: string | null;
  productType: string | null;
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean) as string[];
  } catch {
    // fallthrough — treat as comma-separated
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseServiceAreas(raw: string | null): string[] {
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

/** Build a template-based summary when the AI is unavailable. */
function buildTemplateSummary(vendor: VendorSummaryRow, products: VendorProductRow[]): string {
  const tags = parseTags(vendor.tags);
  const featured = products.filter((p) => p.isFeatured || p.badge);
  const popularNames = (featured.length > 0 ? featured : products)
    .slice(0, 3)
    .map((p) => p.name);

  const parts: string[] = [];

  // Sentence 1: who + where + category
  const speciality = vendor.subcategory || vendor.category;
  parts.push(
    `${vendor.name} specialises in ${speciality.toLowerCase()} in ${vendor.city}.`
  );

  // Sentence 2: popular products (if any)
  if (popularNames.length > 0) {
    parts.push(
      `Their most popular products are ${popularNames.join(", ")}${tags.length > 0 ? ` and they are known for ${tags.slice(0, 3).join(", ").toLowerCase()}` : ""}.`
    );
  } else if (tags.length > 0) {
    parts.push(`They are known for ${tags.slice(0, 3).join(", ").toLowerCase()}.`);
  }

  // Sentence 3: delivery / pickup + ratings
  const deliveryBits: string[] = [];
  if (vendor.deliveryAvailable) {
    const areas = parseServiceAreas(vendor.serviceAreas);
    deliveryBits.push(
      areas.length > 0
        ? `delivery throughout ${areas.slice(0, 3).join(", ")}`
        : "delivery"
    );
  }
  if (vendor.pickupAvailable) deliveryBits.push("pickup");
  const deliveryPhrase =
    deliveryBits.length > 0
      ? `They offer ${deliveryBits.join(" and ")}`
      : "They are available for orders";
  const ratingPhrase =
    vendor.reviewCount > 0
      ? ` and have a ${vendor.rating.toFixed(1)} rating from ${vendor.reviewCount} reviews.`
      : ".";
  parts.push(deliveryPhrase + ratingPhrase);

  return parts.join(" ");
}

/** Build the prompt sent to the AI for a natural-language summary. */
function buildPrompt(vendor: VendorSummaryRow, products: VendorProductRow[]): string {
  const tags = parseTags(vendor.tags);
  const areas = parseServiceAreas(vendor.serviceAreas);
  const featured = products.filter((p) => p.isFeatured || p.badge);
  const popular = (featured.length > 0 ? featured : products).slice(0, 5);

  const lines = [
    `Vendor name: ${vendor.name}`,
    `Category: ${vendor.category}`,
    vendor.subcategory ? `Subcategory: ${vendor.subcategory}` : "",
    `City: ${vendor.city}, ${vendor.country}`,
    `Ecosystem: ${vendor.ecosystem}`,
    `Tagline: ${vendor.tagline}`,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : "",
    `Delivery available: ${vendor.deliveryAvailable ? "Yes" : "No"}`,
    `Pickup available: ${vendor.pickupAvailable ? "Yes" : "No"}`,
    areas.length > 0 ? `Service areas: ${areas.join(", ")}` : "",
    `Rating: ${vendor.rating.toFixed(1)} / 5 (${vendor.reviewCount} reviews)`,
    vendor.description ? `Description: ${vendor.description.slice(0, 500)}` : "",
    popular.length > 0
      ? `Popular products: ${popular
          .map((p) => `${p.name}${p.productType ? ` (${p.productType})` : ""}`)
          .join(", ")}`
      : "",
  ].filter(Boolean);

  return `You are writing a 2-3 sentence storefront summary for a vendor on a party-planning marketplace. Use only the facts below. Do NOT invent prices, ratings or products. End with a period. Do not add emojis or marketing fluff.

${lines.join("\n")}

Write the summary:`;
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
    let vendor: VendorSummaryRow | null = null;
    try {
      vendor = (await db.vendor.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          country: true,
          description: true,
          tags: true,
          rating: true,
          reviewCount: true,
          deliveryAvailable: true,
          pickupAvailable: true,
          serviceAreas: true,
          subcategory: true,
          ecosystem: true,
          tagline: true,
        },
      })) as VendorSummaryRow | null;
    } catch (e) {
      console.error("[api/ai/vendor-summary] vendor fetch failed:", (e as Error)?.message?.slice(0, 120));
    }

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // ── 2. Fetch vendor's products ───────────────────────────────────────
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
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 20,
      })) as VendorProductRow[];
    } catch (e) {
      console.error("[api/ai/vendor-summary] products fetch failed:", (e as Error)?.message?.slice(0, 120));
    }

    // ── 3. Try AI summary, fall back to template ─────────────────────────
    const zai = await getZAI();
    if (zai) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: "assistant",
              content:
                "You are a concise storefront copywriter for a party-planning marketplace.",
            },
            { role: "user", content: buildPrompt(vendor, products) },
          ],
          thinking: { type: "disabled" },
        });
        const summary =
          completion.choices[0]?.message?.content?.trim() ||
          buildTemplateSummary(vendor, products);
        return NextResponse.json({ summary, source: "ai" as const });
      } catch (e) {
        console.error("[api/ai/vendor-summary] AI call failed, using template:", (e as Error)?.message?.slice(0, 120));
      }
    }

    const summary = buildTemplateSummary(vendor, products);
    return NextResponse.json({ summary, source: "template" as const });
  } catch (err) {
    console.error("[api/ai/vendor-summary] GET failed:", err);
    return NextResponse.json(
      { summary: "", source: "template" },
      { status: 200 }
    );
  }
}
