export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { guardAiRoute } from "@/lib/billing/guards";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/ai/listing-audit
 *
 * Audits a vendor's listing and produces a score out of 100 with
 * specific issues and suggestions.
 *
 * Body: { vendorId?: string } or fetches the current vendor's listing
 * Returns: { score, grade, issues: [], suggestions: [], breakdown: {} }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = user?.id ?? null;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { vendorId } = body as { vendorId?: string };

    // Find vendor
    const where = vendorId
      ? { id: vendorId, owner_user_id: userId }
      : { owner_user_id: userId };
    const vendor = await db.vendor.findFirst({
      where,
      include: {
        products: { where: { isAvailable: true }, take: 50 },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Audit each area
    const breakdown: Record<string, { score: number; max: number; issues: string[] }> = {};
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. Photos (20 pts)
    const gallery = parseJsonArray<string>(vendor.gallery);
    let photoScore = 0;
    if (vendor.heroImage) photoScore += 10;
    if (vendor.avatarImage) photoScore += 5;
    if (gallery.length >= 5) photoScore += 5;
    else if (gallery.length > 0) photoScore += 2;
    if (!vendor.heroImage) issues.push("Missing cover/banner photo");
    if (gallery.length < 5) {
      issues.push(`Only ${gallery.length} gallery photos (recommend 5-10)`);
      suggestions.push("Upload 5-10 photos of your best work to showcase your quality");
    }
    breakdown.photos = { score: photoScore, max: 20, issues: [] };

    // 2. Pricing (15 pts)
    let pricingScore = 0;
    if (vendor.basePrice > 0) pricingScore += 8;
    if (vendor.products.length > 0) pricingScore += 7;
    if (vendor.basePrice === 0) issues.push("Base price not set");
    if (vendor.products.length === 0) {
      issues.push("No products/services listed with pricing");
      suggestions.push("Add at least 3-5 products or service packages with prices");
    }
    breakdown.pricing = { score: pricingScore, max: 15, issues: [] };

    // 3. Description (15 pts)
    let descScore = 0;
    if (vendor.description && vendor.description.length >= 100) descScore += 10;
    else if (vendor.description && vendor.description.length >= 50) descScore += 5;
    if (vendor.tagline && vendor.tagline.length >= 10) descScore += 5;
    if (!vendor.description || vendor.description.length < 100) {
      issues.push("Description too short (recommend 100+ characters)");
      suggestions.push("Write a detailed description with keywords customers might search for");
    }
    breakdown.description = { score: descScore, max: 15, issues: [] };

    // 4. Template Fields (15 pts) — check if products have extraFields
    let templateScore = 0;
    const productsWithDetails = vendor.products.filter((p: any) => p.extraFields);
    if (productsWithDetails.length > 0) templateScore += 10;
    if (vendor.subcategory) templateScore += 5;
    if (productsWithDetails.length === 0) {
      issues.push("Products missing template-specific details (flavour, size, etc.)");
      suggestions.push("Fill in all template fields for each product (flavour, dietary, etc.)");
    }
    breakdown.templateFields = { score: templateScore, max: 15, issues: [] };

    // 5. Filters (10 pts) — check if vendor has filter selections
    let filterScore = 0;
    try {
      const filterCount = await db.vendorFilterValue.count({
        where: { vendorId: vendor.id },
      });
      if (filterCount >= 5) filterScore += 10;
      else if (filterCount >= 3) filterScore += 7;
      else if (filterCount >= 1) filterScore += 4;
      if (filterCount < 3) {
        issues.push(`Only ${filterCount} filters selected (recommend 5+)`);
        suggestions.push("Select more filters (dietary, occasion, style) to help customers find you");
      }
    } catch {}
    breakdown.filters = { score: filterScore, max: 10, issues: [] };

    // 6. Reviews (10 pts)
    let reviewScore = 0;
    if (vendor.reviewCount >= 10) reviewScore += 10;
    else if (vendor.reviewCount >= 5) reviewScore += 7;
    else if (vendor.reviewCount >= 1) reviewScore += 4;
    if (vendor.reviewCount < 5) {
      issues.push(`Only ${vendor.reviewCount} reviews (aim for 10+)`);
      suggestions.push("Ask past customers to leave reviews — it builds trust and boosts ranking");
    }
    breakdown.reviews = { score: reviewScore, max: 10, issues: [] };

    // 7. Contact (5 pts)
    let contactScore = 0;
    if (vendor.whatsapp) contactScore += 2;
    if (vendor.instagram) contactScore += 1;
    if (vendor.website) contactScore += 1;
    if ((vendor as any).facebook || (vendor as any).youtube || (vendor as any).tiktok) contactScore += 1;
    if (!vendor.whatsapp) suggestions.push("Add your WhatsApp number for direct customer contact");
    breakdown.contact = { score: contactScore, max: 5, issues: [] };

    // 8. SEO (10 pts)
    let seoScore = 0;
    if (vendor.metaTitle) seoScore += 5;
    if (vendor.metaDescription) seoScore += 5;
    if (!vendor.metaTitle) {
      issues.push("Missing SEO meta title");
      suggestions.push("Add an SEO-optimized title (e.g., 'Best Wedding Cakes in Mumbai | Your Brand')");
    }
    if (!vendor.metaDescription) {
      issues.push("Missing SEO meta description");
      suggestions.push("Add a 150-character meta description with keywords");
    }
    breakdown.seo = { score: seoScore, max: 10, issues: [] };

    // Calculate total
    const totalScore = Object.values(breakdown).reduce((sum, b) => sum + b.score, 0);
    const grade = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : totalScore >= 50 ? "D" : "F";

    return NextResponse.json({
      score: totalScore,
      grade,
      issues,
      suggestions,
      breakdown,
      vendorName: vendor.name,
    });
  } catch (err) {
    console.error("[api/ai/listing-audit] POST failed:", err);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
