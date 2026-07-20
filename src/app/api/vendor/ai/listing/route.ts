export const maxDuration = 30;
/**
 * POST /api/vendor/ai/listing
 *
 * Generates a complete AI business listing: description + tagline + keywords
 * + business tags + services, in one of 6 writing styles.
 *
 * Body: {
 *   style: "professional" | "friendly" | "luxury" | "premium" | "casual" | "seo",
 *   // context (from form — used when creating a NEW listing):
 *   businessName, marketplace, category, subcategory, city, country,
 *   specialities, yearsExperience, deliveryOptions, customOrders,
 *   languages, priceRange, tags
 * }
 *
 * If vendorId is provided AND no businessName is sent, fetches context from DB.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateBusinessProfile, getVendorContext, type WritingStyle, type VendorSetupInput } from "@/lib/ai/listing-generator";
import { sanitizePrompt } from "@/lib/ai/security";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  // Allow both authenticated vendors AND guests creating a new listing.
  // If authenticated, we can auto-fetch context from DB. If guest, they
  // must provide context in the body.

  try {
    const body = await req.json();
    const style = (body.style as WritingStyle) || "professional";

    // ── Prompt injection protection ──
    if (body.businessName) {
      const userInput = [body.businessName, body.category || "", body.subcategory || "", body.city || "", body.specialities || "", body.tags || ""].join("\n");
      const sanitizeResult = sanitizePrompt(userInput);
      if (sanitizeResult.blocked) {
        return NextResponse.json({ error: "Input rejected by security filter" }, { status: 400 });
      }
    }

    let input: VendorSetupInput;

    if (body.businessName) {
      // Use context from the request body (form data)
      input = {
        businessName: body.businessName,
        marketplace: body.marketplace || "FINDMYBITES",
        category: body.category || "",
        subcategory: body.subcategory,
        city: body.city,
        country: body.country,
        specialities: body.specialities,
        yearsExperience: body.yearsExperience,
        deliveryOptions: body.deliveryOptions,
        customOrders: body.customOrders,
        languages: body.languages,
        priceRange: body.priceRange,
        tags: body.tags,
      };
    } else if (vendor) {
      // Fetch from DB
      const ctx = await getVendorContext(vendor.id);
      if (!ctx) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      input = ctx;
    } else {
      return NextResponse.json({ error: "Provide businessName + marketplace + category, or authenticate as a vendor" }, { status: 400 });
    }

    if (!input.businessName || !input.category) {
      return NextResponse.json({ error: "Business name and category are required" }, { status: 400 });
    }

    const result = await generateBusinessProfile(input, style);

    // Log AI usage
    try {
      const { db } = await import("@/lib/db");
      await db.aiGenerationLog.create({
        data: {
          vendorId: vendor?.id || input.vendorId || null,
          feature: "listing_description",
          tokens: Math.ceil(result.description.length / 4),
          success: true,
        },
      });
    } catch {}

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[vendor/ai/listing] failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
