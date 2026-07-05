/**
 * POST /api/vendor/ai/setup-assistant
 *
 * Generates a complete AI business profile OR analyzes an image.
 *
 * Body (profile generation):
 *   { action: "generate_profile", style, businessName, marketplace, category, ... }
 *
 * Body (image analysis):
 *   { action: "analyze_image", imageUrl }
 *
 * Body (recommendations):
 *   { action: "recommendations" }
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import {
  generateBusinessProfile, analyzeBusinessImage, getAiRecommendations,
  getVendorContext, type WritingStyle, type VendorSetupInput,
} from "@/lib/ai/listing-generator";
import { checkAiRateLimit, incrementAiCount } from "@/lib/ai/rate-limiter";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  // Allow both authenticated vendors AND guests (guests must provide context in body)

  // ── Rate limiting for authenticated vendors ──
  if (vendor) {
    const rateLimit = await checkAiRateLimit(vendor.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Daily AI limit reached (${rateLimit.limit} requests/day). Upgrade your plan for more.`, limit: rateLimit.limit },
        { status: 429 }
      );
    }
  }

  try {
    const body = await req.json();
    const action = body.action || "generate_profile";

    if (action === "analyze_image") {
      const imageUrl = body.imageUrl;
      if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
      const analysis = await analyzeBusinessImage(imageUrl);
      if (vendor) incrementAiCount(vendor.id);
      return NextResponse.json({ analysis });
    }

    if (action === "recommendations") {
      if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      const recs = await getAiRecommendations(vendor.id);
      return NextResponse.json({ recommendations: recs });
    }

    // Default: generate_profile
    const style = (body.style as WritingStyle) || "professional";
    let input: VendorSetupInput;

    if (body.businessName) {
      input = {
        businessName: body.businessName,
        marketplace: body.marketplace || "FINDMYBITES",
        category: body.category || "",
        subcategory: body.subcategory,
        city: body.city,
        state: body.state,
        country: body.country,
        whatsapp: body.whatsapp,
        logoUrl: body.logoUrl,
        coverUrl: body.coverUrl,
        specialities: body.specialities,
        yearsExperience: body.yearsExperience,
        deliveryOptions: body.deliveryOptions,
        customOrders: body.customOrders,
        languages: body.languages,
        priceRange: body.priceRange,
        tags: body.tags,
      };
    } else if (vendor) {
      const ctx = await getVendorContext(vendor.id);
      if (!ctx) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
      input = ctx;
    } else {
      return NextResponse.json({ error: "Provide businessName + marketplace + category, or authenticate as a vendor" }, { status: 400 });
    }

    if (!input.businessName || !input.category) {
      return NextResponse.json({ error: "Business name and category are required" }, { status: 400 });
    }

    const profile = await generateBusinessProfile(input, style);
    if (vendor) incrementAiCount(vendor.id);

    // Log AI usage
    try {
      await db.aiGenerationLog.create({
        data: {
          vendorId: vendor?.id || input.vendorId || null,
          feature: "setup_assistant",
          tokens: Math.ceil(profile.description.length / 4),
          success: true,
        },
      });
    } catch {}

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error("[vendor/ai/setup-assistant] failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
