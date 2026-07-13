/** POST /api/vendor/marketing/ai/seo — Generate SEO meta + keywords, optionally save */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateSeoCopy } from "@/lib/marketing/marketing-ai-service";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) {
    logger.warn("ai-seo", "Authentication required — no vendor session found");
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  logger.info("ai-seo", "Generating SEO for vendor", { vendorId: vendor.id, businessName: vendor.name });

  try {
    const { save } = await req.json().catch(() => ({ save: false }));
    const seo = await generateSeoCopy(vendor.id);

    logger.info("ai-seo", "SEO generated successfully", {
      vendorId: vendor.id,
      metaTitle: seo.metaTitle?.slice(0, 70),
      metaDescriptionLen: seo.metaDescription?.length ?? 0,
      keywordsCount: seo.keywords?.length ?? 0,
      hasOpenGraph: !!seo.openGraph,
      hasTwitter: !!seo.twitter,
      hasJsonLd: !!seo.jsonLd,
      slugSuggestion: seo.slug,
    });

    if (save) {
      // Persist the AI-generated SEO suggestions (OpenGraph, Twitter card,
      // JSON-LD structured data, slug suggestion) in the aiSuggestions JSON
      // column so the frontend / SSR pages can render them later. The
      // canonical metaTitle / metaDescription / tags live in their own columns.
      const aiSuggestions = {
        seo: {
          slug: seo.slug,
          openGraph: seo.openGraph,
          twitter: seo.twitter,
          jsonLd: seo.jsonLd,
          generatedAt: new Date().toISOString(),
        },
      };
      await db.vendor.update({
        where: { id: vendor.id },
        data: {
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          tags: JSON.stringify(seo.keywords),
          aiSuggestions: JSON.stringify(aiSuggestions),
        },
      });
      logger.info("ai-seo", "SEO saved to database", { vendorId: vendor.id });
    }

    return NextResponse.json({ seo, saved: !!save });
  } catch (err: any) {
    logger.error("ai-seo", "SEO generation failed", {
      vendorId: vendor.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: err.message || "SEO generation failed" }, { status: 500 });
  }
}
