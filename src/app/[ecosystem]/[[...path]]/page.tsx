import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  migrateCategory,
} from "@/lib/constants";
import { getCategoryInfo } from "@/lib/category-server";
import {
  generateSEOMetadata,
  generateJsonLd,
  generateBreadcrumbs,
  generateIntroContent,
  type Ecosystem,
  type SEOContext,
} from "@/lib/seo";
import { SeoPageClient } from "./seo-page-client";
import {
  getAllSEOPages,
  getAllCities,
  getAllCategories,
  resolveKeywordPage,
  resolveCity,
  resolveCityCategoryPage,
  getVendorsForPage,
  getVendorsForCity,
  getRelatedPages,
  getCityCategories,
  type SEOPage,
  type SEOCity,
} from "@/lib/seo-data";
import { parseAttributeSeoPath, generateAttributePageJsonLd, type AttributeSeoPage } from "@/lib/attributes/attribute-seo";
import { findVendorIdsByAttributes, getAttributeBySlug } from "@/lib/attributes/attribute-service";
import {
  generateKeywordMetadata,
  generateCityMetadata,
  generateCityCategoryMetadata,
  generateFAQs,
  generatePriceGuide,
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
  generateItemListJsonLd,
  titleCase,
} from "@/lib/seo-content";
import { AutoSEOLanding } from "@/components/seo/AutoSEOLanding";

/**
 * Catch-all SEO route — handles FOUR URL patterns from a single dynamic
 * route (avoids Next.js sibling-dynamic-segment conflicts):
 *
 *   /findmybites, /findmybites/india, /findmybites/india/hyderabad/bakers-bakery
 *     → existing ecosystem landing pages (unchanged behavior)
 *   /wedding-cakes-dubai           → keyword page (category-city)
 *   /dubai                         → city page
 *   /dubai/wedding-cakes           → city/category page
 *
 * ISR (1hr) + generateStaticParams so pages are pre-built AND new
 * city/category combos auto-generate on first request after a vendor is
 * approved. revalidatePath() on approval gives instant refresh.
 */
export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    ecosystem: string;
    path?: string[];
  }>;
}

const VALID_ECOSYSTEMS: Ecosystem[] = ["FINDMYBITES", "PIMPMYPARTY"];

/**
 * Pre-generate all known SEO pages at build time. Combined with ISR +
 * dynamicParams=true (default), new pages auto-generate on first request.
 */
export async function generateStaticParams() {
  const [ecoLandings, keywordPages, cities, cityCategoryCombos] = await Promise.all([
    Promise.resolve([
      { ecosystem: "findmybites", path: undefined },
      { ecosystem: "pimpmyparty", path: undefined },
    ]),
    getAllSEOPages(),
    getAllCities(),
    (async () => {
      // city/category combos: derived from keyword pages (each has a city+category)
      const pages = await getAllSEOPages();
      return pages.map((p) => ({ citySlug: p.citySlug, categorySlug: p.categorySlug }));
    })(),
  ]);

  const params: { ecosystem: string; path?: string[] }[] = [];

  // Ecosystem landings
  for (const e of ecoLandings) params.push({ ecosystem: e.ecosystem, path: e.path });

  // Keyword pages: ecosystem segment = keyword slug, path = undefined
  for (const p of keywordPages) {
    params.push({ ecosystem: p.keyword, path: undefined });
  }

  // City pages: ecosystem segment = city slug, path = undefined
  for (const c of cities) {
    params.push({ ecosystem: c.citySlug, path: undefined });
  }

  // City/category pages: ecosystem segment = city slug, path = [category slug]
  for (const combo of cityCategoryCombos) {
    params.push({ ecosystem: combo.citySlug, path: [combo.categorySlug] });
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ecosystem: firstSegment, path } = await params;

  // 1. Existing ecosystem landings (/findmybites, /pimpmyparty + sub-paths)
  const ecosystem =
    firstSegment === "findmybites"
      ? "FINDMYBITES"
      : firstSegment === "pimpmyparty"
        ? "PIMPMYPARTY"
        : null;

  if (ecosystem) {
    const ctx = parseEcosystemPath(ecosystem, path ?? []);
    if (!ctx) return { title: "Not Found" };
    // Resolve category label from DB
    const catInfo = ctx.category ? await getCategoryInfo(ctx.category) : null;
    return generateSEOMetadata(ctx, catInfo?.label);
  }

  // 2. City/category page: /{city}/{category}
  if (path && path.length === 1) {
    const resolved = await resolveCityCategoryPage(firstSegment, path[0]);
    if (resolved) {
      return generateCityCategoryMetadata(resolved.page, resolved.city);
    }
    return { title: "Not Found" };
  }

  // 3. Attribute SEO page (single segment): /{attribute}-{category}
  if (!path || path.length === 0) {
    const attrParsed = parseAttributeSeoPath(`/${firstSegment}`);
    if (attrParsed) {
      const attr = await getAttributeBySlug(attrParsed.attributeSlug);
      if (attr) {
        const catLabel = attrParsed.categorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        return {
          title: `${attr.name} ${catLabel} — Best ${attr.name} ${catLabel} Near You | FindMyBites`,
          description: `Discover the best ${attr.name.toLowerCase()} ${catLabel.toLowerCase()} from verified vendors. Browse ${attr.name.toLowerCase()} options with delivery, pickup, and custom orders.`,
          alternates: { canonical: `/${firstSegment}` },
        };
      }
    }

    const keywordPage = await resolveKeywordPage(firstSegment);
    if (keywordPage) return generateKeywordMetadata(keywordPage);

    const city = await resolveCity(firstSegment);
    if (city) return generateCityMetadata(city);

    return { title: "Not Found" };
  }

  // 3b. City + Attribute page (two segments): /{city}/{attribute}-{category}
  if (path && path.length === 1) {
    const attrParsed = parseAttributeSeoPath(`/${firstSegment}/${path[0]}`);
    if (attrParsed && attrParsed.city) {
      const attr = await getAttributeBySlug(attrParsed.attributeSlug);
      if (attr) {
        const catLabel = attrParsed.categorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        const cityLabel = attrParsed.city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        return {
          title: `${attr.name} ${catLabel} in ${cityLabel} — Best Local ${attr.name} ${catLabel} | FindMyBites`,
          description: `Find the best ${attr.name.toLowerCase()} ${catLabel.toLowerCase()} in ${cityLabel}. Browse verified local vendors offering ${attr.name.toLowerCase()} options.`,
          alternates: { canonical: `/${firstSegment}/${path[0]}` },
        };
      }
    }
  }

  return { title: "Not Found" };
}

export default async function SeoRoute({ params }: PageProps) {
  const { ecosystem: firstSegment, path } = await params;

  // ── 1. Existing ecosystem landing pages (unchanged) ────────────────────
  const ecosystem =
    firstSegment === "findmybites"
      ? "FINDMYBITES"
      : firstSegment === "pimpmyparty"
        ? "PIMPMYPARTY"
        : null;

  if (ecosystem) {
    return renderEcosystemPage(ecosystem, path ?? []);
  }

  // ── 2. City/category page: /{city}/{category} ──────────────────────────
  if (path && path.length === 1) {
    const resolved = await resolveCityCategoryPage(firstSegment, path[0]);
    if (resolved) {
      return renderCityCategoryPage(resolved.page, resolved.city);
    }
    notFound();
  }

  // ── 3. Attribute SEO page (single segment): /{attribute}-{category} ─────
  // e.g. /findmybites/sugar-free-cakes, /pimpmyparty/luxury-events
  if (!path || path.length === 0) {
    const attrParsed = parseAttributeSeoPath(`/${firstSegment}`);
    if (attrParsed) {
      // Attribute pages can belong to either ecosystem; default to FINDMYBITES
      // unless the first segment itself is an ecosystem (which it isn't here,
      // since ecosystem pages are handled above).
      return renderAttributePage(attrParsed, (ecosystem ?? "FINDMYBITES") as Ecosystem);
    }

    // ── 3b. City + Attribute page (two segments): /{city}/{attribute}-{category} ──
    // (handled below in the 2-segment block)

    const keywordPage = await resolveKeywordPage(firstSegment);
    if (keywordPage) {
      return renderKeywordPage(keywordPage);
    }

    // ── 4. City page (single segment): /{city} ─────────────────────────
    const city = await resolveCity(firstSegment);
    if (city) {
      return renderCityPage(city);
    }

    notFound();
  }

  // ── 3c. City + Attribute page (two segments): /{city}/{attribute}-{category} ──
  if (path && path.length === 1) {
    const attrParsed = parseAttributeSeoPath(`/${firstSegment}/${path[0]}`);
    if (attrParsed && attrParsed.city) {
      return renderAttributePage(attrParsed, (ecosystem ?? "FINDMYBITES") as Ecosystem);
    }
  }

  notFound();
}

// ── Ecosystem page renderer (unchanged from original) ──────────────────────

async function renderEcosystemPage(ecosystem: Ecosystem, path: string[]) {
  const ctx = parseEcosystemPath(ecosystem, path);
  if (!ctx) notFound();

  const where: Record<string, unknown> = {
    ecosystem,
    approved: true,
  };

  if (ctx.country) {
    where.country = { contains: ctx.country.replace(/-/g, " "), mode: "insensitive" };
  }
  if (ctx.city) {
    where.city = { contains: ctx.city.replace(/-/g, " "), mode: "insensitive" };
  }
  if (ctx.category) {
    const migrated = migrateCategory(ctx.category);
    where.OR = [{ category: migrated }, { category: ctx.category }];
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
    // DB unavailable
  }

  // Resolve category label from DB for SEO
  const catInfo = ctx.category ? await getCategoryInfo(ctx.category) : null;
  const catLabel = catInfo?.label;

  const seoCtx: SEOContext = { ...ctx, vendorCount };
  const jsonLd = generateJsonLd(seoCtx, vendors, catLabel);
  const breadcrumbs = generateBreadcrumbs(seoCtx);
  const introContent = generateIntroContent(seoCtx, vendorCount, catLabel);
  // Fetch related categories from DB (not hardcoded constants)
  let relatedCategories: { id: string; label: string; ecosystem: string }[] = [];
  if (ctx.city) {
    try {
      const dbCats = await db.category.findMany({
        where: { ecosystem, active: true, slug: { not: ctx.category } },
        orderBy: { sortOrder: "asc" },
        take: 6,
        select: { slug: true, label: true, ecosystem: true },
      });
      relatedCategories = dbCats.map((c) => ({ id: c.slug, label: c.label, ecosystem: c.ecosystem }));
    } catch {}
  }

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

// ── Keyword page renderer: /{category}-{city} ──────────────────────────────

async function renderKeywordPage(page: SEOPage) {
  const { vendors, total } = await getVendorsForPage(page.city, page.categorySlug);
  const related = await getRelatedPages(page.city, page.categorySlug);

  const cityDisplay = titleCase(page.city);
  const ecoLabel = page.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty";
  const ecoSlug = page.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";

  const breadcrumbs = [
    { label: "Home", url: "https://www.findmybites.com" },
    { label: ecoLabel, url: `https://www.findmybites.com/${ecoSlug}` },
    { label: cityDisplay, url: `https://www.findmybites.com/${page.citySlug}` },
    { label: page.category, url: `https://www.findmybites.com/${page.keyword}` },
  ];

  const faqs = generateFAQs(page.category, page.categorySlug, page.city, page.country, vendors);
  const jsonLd = [
    generateBreadcrumbJsonLd(breadcrumbs),
    generateFAQJsonLd(faqs),
    generateItemListJsonLd(vendors, `${page.category} in ${cityDisplay}`),
  ].filter(Boolean) as Record<string, any>[];

  return (
    <AutoSEOLanding
      variant="keyword"
      page={page}
      vendors={vendors}
      total={total}
      related={related}
      jsonLd={jsonLd}
      breadcrumbs={breadcrumbs}
    />
  );
}

// ── City page renderer: /{city} ────────────────────────────────────────────

async function renderCityPage(city: SEOCity) {
  const { vendors, total } = await getVendorsForCity(city.city);
  const cityCategories = await getCityCategories(city.city);
  const cityDisplay = titleCase(city.city);

  // Related = top categories in this city (link to keyword pages)
  const related = cityCategories.slice(0, 6).map((c) => ({
    label: `${c.categoryLabel} in ${cityDisplay}`,
    slug: `${c.categorySlug}-${city.citySlug}`,
  }));

  const breadcrumbs = [
    { label: "Home", url: "https://www.findmybites.com" },
    { label: "FindMyBites", url: "https://www.findmybites.com/findmybites" },
    { label: city.country, url: `https://www.findmybites.com/findmybites/${city.country.toLowerCase().replace(/\s+/g, "-")}` },
    { label: cityDisplay, url: `https://www.findmybites.com/${city.citySlug}` },
  ];

  const faqs = generateFAQs("Vendors", "", city.city, city.country, vendors);
  const jsonLd = [
    generateBreadcrumbJsonLd(breadcrumbs),
    generateFAQJsonLd(faqs),
    generateItemListJsonLd(vendors, `Vendors in ${cityDisplay}`),
  ].filter(Boolean) as Record<string, any>[];

  return (
    <AutoSEOLanding
      variant="city"
      city={city}
      vendors={vendors}
      total={total}
      related={related}
      cityCategories={cityCategories}
      jsonLd={jsonLd}
      breadcrumbs={breadcrumbs}
    />
  );
}

// ── City/category page renderer: /{city}/{category} ────────────────────────

async function renderCityCategoryPage(page: SEOPage, city: SEOCity) {
  const { vendors, total } = await getVendorsForPage(page.city, page.categorySlug);
  const related = await getRelatedPages(page.city, page.categorySlug);
  const cityDisplay = titleCase(page.city);

  const breadcrumbs = [
    { label: "Home", url: "https://www.findmybites.com" },
    { label: "FindMyBites", url: "https://www.findmybites.com/findmybites" },
    { label: cityDisplay, url: `https://www.findmybites.com/${page.citySlug}` },
    { label: page.category, url: `https://www.findmybites.com/${page.citySlug}/${page.categorySlug}` },
  ];

  const faqs = generateFAQs(page.category, page.categorySlug, page.city, page.country, vendors);
  const jsonLd = [
    generateBreadcrumbJsonLd(breadcrumbs),
    generateFAQJsonLd(faqs),
    generateItemListJsonLd(vendors, `${page.category} in ${cityDisplay}`),
  ].filter(Boolean) as Record<string, any>[];

  return (
    <AutoSEOLanding
      variant="cityCategory"
      page={page}
      city={city}
      vendors={vendors}
      total={total}
      related={related}
      jsonLd={jsonLd}
      breadcrumbs={breadcrumbs}
    />
  );
}

/** Parse the URL path for EXISTING ecosystem landing pages. */
function parseEcosystemPath(ecosystem: Ecosystem, path: string[]): SEOContext | null {
  if (path.length === 0) return { ecosystem };
  if (path.length === 1) return { ecosystem, country: path[0] };
  if (path.length === 2) return { ecosystem, country: path[0], city: path[1] };
  if (path.length === 3) return { ecosystem, country: path[0], city: path[1], category: path[2] };
  return null;
}

// ── Attribute SEO page renderer ────────────────────────────────────────────
// Renders /{attribute}-{category} and /{city}/{attribute}-{category} pages.
// Fetches vendors matching the attribute, generates JSON-LD + breadcrumbs.
async function renderAttributePage(
  parsed: { city: string | null; attributeSlug: string; categorySlug: string },
  ecosystem: Ecosystem
) {
  const { city, attributeSlug, categorySlug } = parsed;

  // Fetch the attribute (for name, color, description)
  const attr = await getAttributeBySlug(attributeSlug);
  if (!attr) notFound();

  // Map category slug to the Vendor.category value used in the DB
  // (may need migration for old slugs)
  const catLabel = categorySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Build the SEO page object
  const cityLabel = city
    ? city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : null;

  const page: AttributeSeoPage = {
    path: city ? `/${city}/${attributeSlug}-${categorySlug}` : `/${attributeSlug}-${categorySlug}`,
    attributeSlug,
    attributeName: attr.name,
    categorySlug,
    categoryLabel: catLabel,
    city,
    h1: city
      ? `${attr.name} ${catLabel} in ${cityLabel}`
      : `${attr.name} ${catLabel}`,
    metaTitle: city
      ? `${attr.name} ${catLabel} in ${cityLabel} — Best Local ${attr.name} ${catLabel} | FindMyBites`
      : `${attr.name} ${catLabel} — Best ${attr.name} ${catLabel} Near You | FindMyBites`,
    metaDescription: `Discover the best ${attr.name.toLowerCase()} ${catLabel.toLowerCase()}${
      city ? ` in ${cityLabel}` : ""
    } from verified vendors. Browse ${attr.name.toLowerCase()} options with delivery, pickup, and custom orders.`,
    variant: city ? "city-attribute-category" : "attribute-category",
  };

  // Find vendors matching this attribute + category + ecosystem
  let vendors: any[] = [];
  let total = 0;
  try {
    const matchedIds = await findVendorIdsByAttributes([attributeSlug], {
      ecosystem,
      category: categorySlug,
    });
    if (matchedIds.length > 0) {
      const vendorRows = await db.vendor.findMany({
        where: {
          id: { in: matchedIds },
          approved: true,
          ...(city && cityLabel
            ? { city: { contains: cityLabel, mode: "insensitive" as const } }
            : {}),
        },
        select: {
          id: true, name: true, slug: true, category: true, tagline: true,
          city: true, country: true, countryCode: true, rating: true,
          reviewCount: true, priceRange: true, basePrice: true, currency: true,
          heroImage: true, avatarImage: true, verified: true, featured: true,
          responseTime: true, tags: true,
        },
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
        take: 24,
      });
      vendors = vendorRows;
      total = vendorRows.length;
    }
  } catch (e) {
    // Non-fatal — render the page with no vendors
  }

  // Generate JSON-LD
  const { breadcrumb, itemList } = generateAttributePageJsonLd(page, vendors);

  // Breadcrumbs for the UI
  const breadcrumbs = [
    { label: "Home", url: "/" },
    { label: ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty", url: `/${ecosystem.toLowerCase()}` },
    { label: catLabel, url: `/${ecosystem.toLowerCase()}/${categorySlug}` },
    ...(city ? [{ label: cityLabel!, url: `/${ecosystem.toLowerCase()}/${city}` }] : []),
    { label: `${attr.name} ${catLabel}`, url: page.path },
  ];

  return (
    <AutoSEOLanding
      variant="keyword"
      page={{
        slug: page.path.replace(/^\//, ""),
        h1: page.h1,
        title: page.metaTitle,
        description: page.metaDescription,
        ecosystem,
        category: categorySlug,
        city: city ?? undefined,
      } as any}
      vendors={vendors}
      total={total}
      related={[]}
      jsonLd={[breadcrumb, itemList].filter(Boolean) as Record<string, any>[]}
      breadcrumbs={breadcrumbs}
    />
  );
}
