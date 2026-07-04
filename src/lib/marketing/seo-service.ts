/**
 * SEO Service — SEO score, meta analysis, schema status.
 * Pure computation (no AI). The "Generate with AI" / "Improve SEO" actions
 * live in the marketing-ai API route.
 */
import { db } from "@/lib/db";

export interface SeoAnalysis {
  score: number;            // 0-100
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  slug: string;
  indexStatus: "indexable" | "noindex";
  openGraph: { title: string | null; description: string | null; image: string | null };
  schemaStatus: { product: boolean; vendor: boolean; faq: boolean; reviews: boolean };
  checks: { label: string; passed: boolean; detail?: string }[];
  suggestions: string[];
}

export async function analyzeSeo(vendorId: string): Promise<SeoAnalysis> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      metaTitle: true, metaDescription: true, heroImage: true, avatarImage: true,
      tags: true, category: true, city: true, country: true, ecosystem: true,
    },
  });
  if (!vendor) throw new Error("Vendor not found");

  let keywords: string[] = [];
  try { keywords = JSON.parse(vendor.tags || "[]"); } catch { keywords = []; }

  const metaTitle = vendor.metaTitle;
  const metaDescription = vendor.metaDescription;

  const checks: SeoAnalysis["checks"] = [];
  const suggestions: string[] = [];

  // Title checks
  const titleLen = metaTitle?.length || 0;
  checks.push({
    label: "Meta title length (30-60 chars)",
    passed: titleLen >= 30 && titleLen <= 60,
    detail: titleLen === 0 ? "Missing" : `${titleLen} chars`,
  });
  if (titleLen === 0) suggestions.push("Add a meta title (30-60 characters) including your main keyword.");
  else if (titleLen < 30) suggestions.push("Your meta title is too short — add more descriptive keywords.");
  else if (titleLen > 60) suggestions.push("Your meta title is too long — Google will truncate it.");

  // Description checks
  const descLen = metaDescription?.length || 0;
  checks.push({
    label: "Meta description length (120-160 chars)",
    passed: descLen >= 120 && descLen <= 160,
    detail: descLen === 0 ? "Missing" : `${descLen} chars`,
  });
  if (descLen === 0) suggestions.push("Add a meta description (120-160 characters) summarising your business.");
  else if (descLen < 120) suggestions.push("Your meta description is too short — add a call-to-action and keywords.");

  // Keywords
  checks.push({
    label: "At least 5 keywords/tags",
    passed: keywords.length >= 5,
    detail: `${keywords.length} tags`,
  });
  if (keywords.length < 5) suggestions.push(`Add ${5 - keywords.length} more keyword tags to improve discoverability.`);

  // Slug
  const slugOk = vendor.slug && vendor.slug.length >= 5 && /^[a-z0-9-]+$/.test(vendor.slug);
  checks.push({ label: "Clean URL slug", passed: !!slugOk, detail: vendor.slug });
  if (!slugOk) suggestions.push("Use a clean, lowercase, hyphenated slug.");

  // OpenGraph image
  const ogImage = vendor.heroImage || vendor.avatarImage || null;
  checks.push({ label: "OpenGraph image", passed: !!ogImage });
  if (!ogImage) suggestions.push("Add a hero image — it doubles as your social share image.");

  // Schema (we emit JSON-LD for these on the vendor page)
  const schemaStatus = {
    product: true,   // emitted on product pages
    vendor: true,    // LocalBusiness schema emitted on vendor page
    faq: false,      // only if vendor has FAQs
    reviews: (vendor as any).reviewCount ? true : false,
  };
  checks.push({ label: "LocalBusiness schema", passed: schemaStatus.vendor });
  checks.push({ label: "Review schema", passed: schemaStatus.reviews, detail: schemaStatus.reviews ? "Active" : "No reviews yet" });

  // Index status (always indexable for approved vendors in this build)
  const indexStatus: "indexable" | "noindex" = "indexable";

  // Score
  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    score,
    metaTitle, metaDescription,
    keywords, slug: vendor.slug,
    indexStatus,
    openGraph: { title: metaTitle || vendor.name, description: metaDescription || vendor.tagline, image: ogImage },
    schemaStatus,
    checks,
    suggestions,
  };
}
