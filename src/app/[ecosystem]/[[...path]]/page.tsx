import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  CATEGORIES,
  getCategoryMigrated,
  migrateCategory,
} from "@/lib/constants";
import {
  generateSEOMetadata,
  generateJsonLd,
  generateBreadcrumbs,
  generateIntroContent,
  type Ecosystem,
  type SEOContext,
} from "@/lib/seo";
import { SeoPageClient } from "./seo-page-client";

// Force dynamic rendering so pages always reflect current vendor data
export const dynamic = "force-dynamic";
export const revalidate = 3600; // ISR: regenerate every hour

interface PageProps {
  params: Promise<{
    ecosystem: string;
    path?: string[];
  }>;
}

const VALID_ECOSYSTEMS: Ecosystem[] = ["FINDMYBITES", "PIMPMYPARTY"];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ecosystem: ecoSlug, path } = await params;

  const ecosystem = ecoSlug === "findmybites" ? "FINDMYBITES" : ecoSlug === "pimpmyparty" ? "PIMPMYPARTY" : null;
  if (!ecosystem) return { title: "Not Found" };

  const ctx = parsePath(ecosystem, path ?? []);
  if (!ctx) return { title: "Not Found" };

  return generateSEOMetadata(ctx);
}

export default async function SeoPage({ params }: PageProps) {
  const { ecosystem: ecoSlug, path } = await params;

  const ecosystem = ecoSlug === "findmybites" ? "FINDMYBITES" : ecoSlug === "pimpmyparty" ? "PIMPMYPARTY" : null;
  if (!ecosystem) notFound();

  const ctx = parsePath(ecosystem, path ?? []);
  if (!ctx) notFound();

  // Fetch vendors for this page
  const where: Record<string, unknown> = {
    ecosystem,
    approved: true,
  };

  if (ctx.country) {
    // Match country by slug (case-insensitive)
    where.country = { contains: ctx.country.replace(/-/g, " "), mode: "insensitive" };
  }
  if (ctx.city) {
    where.city = { contains: ctx.city.replace(/-/g, " "), mode: "insensitive" };
  }
  if (ctx.category) {
    // Match both new and old category slugs via migration
    const migrated = migrateCategory(ctx.category);
    where.OR = [
      { category: migrated },
      { category: ctx.category },
    ];
  }

  let vendors: any[] = [];
  let vendorCount = 0;
  try {
    vendors = await db.vendor.findMany({
      where,
      take: 24,
      orderBy: { rating: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        ecosystem: true,
        category: true,
        city: true,
        state: true,
        country: true,
        countryCode: true,
        rating: true,
        reviewCount: true,
        heroImage: true,
        tagline: true,
        basePrice: true,
        currency: true,
        whatsapp: true,
        featured: true,
        verified: true,
      },
    });
    vendorCount = await db.vendor.count({ where }).catch(() => vendors.length);
  } catch {
    // DB unavailable — render page with empty vendors
  }

  const seoCtx: SEOContext = {
    ...ctx,
    vendorCount,
  };

  const jsonLd = generateJsonLd(seoCtx, vendors);
  const breadcrumbs = generateBreadcrumbs(seoCtx);
  const introContent = generateIntroContent(seoCtx, vendorCount);

  // Fetch related data for internal linking
  const relatedCategories = ctx.city
    ? CATEGORIES.filter((c) => c.ecosystem === ecosystem && c.id !== ctx.category).slice(0, 6)
    : [];

  let relatedCities: { city: string; slug: string; count: number }[] = [];
  if (ctx.country && !ctx.city) {
    try {
      const cityGroups = await db.vendor.groupBy({
        by: ["city"],
        where: {
          ecosystem,
          approved: true,
          country: { contains: ctx.country.replace(/-/g, " "), mode: "insensitive" },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      });
      relatedCities = cityGroups.map((c) => ({
        city: c.city,
        slug: c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        count: c._count.id,
      }));
    } catch {}
  }

  return (
    <SeoPageClient
      ctx={seoCtx}
      vendors={vendors}
      vendorCount={vendorCount}
      breadcrumbs={breadcrumbs}
      introContent={introContent}
      jsonLd={jsonLd}
      relatedCategories={relatedCategories}
      relatedCities={relatedCities}
    />
  );
}

/** Parse the URL path array into an SEOContext. */
function parsePath(ecosystem: Ecosystem, path: string[]): SEOContext | null {
  // path is an array of segments after /findmybites or /pimpmyparty
  // Possible patterns:
  //   []                    → ecosystem home
  //   [country]             → country page
  //   [country, region]     → state OR city page (region can be either)
  //   [country, city, cat]  → city + category page

  if (path.length === 0) {
    return { ecosystem };
  }

  if (path.length === 1) {
    return { ecosystem, country: path[0] };
  }

  if (path.length === 2) {
    // Could be country/state or country/city
    // We'll treat it as country/city (most common case for SEO)
    return { ecosystem, country: path[0], city: path[1] };
  }

  if (path.length === 3) {
    // country/city/category
    return { ecosystem, country: path[0], city: path[1], category: path[2] };
  }

  return null; // too many segments
}
