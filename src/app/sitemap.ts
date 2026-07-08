import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";
import { CAKE_PAGES } from "@/lib/cake-pages";
import { getAllSEOPages, getAllCities, getAllCategories } from "@/lib/seo-data";

/**
 * /sitemap.xml — fully automatic sitemap.
 *
 * Includes:
 * - Homepage + key static pages
 * - Ecosystem landing pages (/findmybites, /pimpmyparty)
 * - Hand-crafted Dubai/UAE cake landing pages
 * - AUTO keyword pages: /[category]-[city] for every approved vendor's city+category
 * - AUTO city pages: /[city] for every city with approved vendors
 * - AUTO near-me pages: /near-me/[category] for every category with vendors
 * - Country/city/category pages under /[ecosystem]/...
 * - Vendor pages (/vendor/[slug])
 *
 * All auto-derived from the DB — new cities/categories appear automatically.
 */
export const revalidate = 3600;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://findmybites.com";
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/findmybites`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/pimpmyparty`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/near-me`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  );

  // Hand-crafted Dubai/UAE cake landing pages
  for (const page of CAKE_PAGES) {
    entries.push({
      url: `${baseUrl}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // ── AUTO-GENERATED SEO PAGES (from DB) ────────────────────────────────
  const [seoPages, cities, categories] = await Promise.all([
    getAllSEOPages(),
    getAllCities(),
    getAllCategories(),
  ]);

  // Keyword pages: /[category]-[city]
  for (const p of seoPages) {
    entries.push({
      url: `${baseUrl}/${p.keyword}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    });
    // City/category page: /[city]/[category]
    entries.push({
      url: `${baseUrl}/${p.citySlug}/${p.categorySlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });
  }

  // City pages: /[city]
  for (const c of cities) {
    entries.push({
      url: `${baseUrl}/${c.citySlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    });
  }

  // Near-me pages: /near-me/[category]
  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/near-me/${cat.categorySlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    });
  }

  try {
    // Fetch all location + category data in parallel
    const [countries, ecoCities, cityCategories, vendors] = await Promise.all([
      db.vendor.groupBy({
        by: ["country"],
        where: { approved: true },
        _count: { id: true },
      }).catch(() => []),
      db.vendor.groupBy({
        by: ["country", "city"],
        where: { approved: true },
        _count: { id: true },
      }).catch(() => []),
      db.vendor.groupBy({
        by: ["country", "city", "category", "ecosystem"],
        where: { approved: true },
        _count: { id: true },
      }).catch(() => []),
      db.vendor.findMany({
        where: { approved: true },
        select: { slug: true, createdAt: true },
        take: 5000,
      }).catch(() => []),
    ]);

    // Country pages
    for (const c of countries) {
      const ecoSlug = "findmybites"; // we'll generate for both ecosystems
      const countrySlug = slugify(c.country);
      entries.push({
        url: `${baseUrl}/findmybites/${countrySlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
      entries.push({
        url: `${baseUrl}/pimpmyparty/${countrySlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // City pages (under /[ecosystem]/[country]/[city])
    for (const c of ecoCities) {
      const countrySlug = slugify(c.country);
      const citySlug = slugify(c.city);
      entries.push({
        url: `${baseUrl}/findmybites/${countrySlug}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
      entries.push({
        url: `${baseUrl}/pimpmyparty/${countrySlug}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Category pages per city — fetch valid slugs from DB
    let validCategorySlugs: Set<string> = new Set();
    try {
      const dbCats = await db.category.findMany({
        where: { active: true },
        select: { slug: true },
      });
      validCategorySlugs = new Set(dbCats.map((c) => c.slug));
    } catch {}

    for (const cc of cityCategories) {
      const migrated = migrateCategory(cc.category);
      if (!validCategorySlugs.has(migrated)) continue;

      const ecoSlug = cc.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";
      const countrySlug = slugify(cc.country);
      const citySlug = slugify(cc.city);
      const catSlug = slugify(migrated);

      entries.push({
        url: `${baseUrl}/${ecoSlug}/${countrySlug}/${citySlug}/${catSlug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    // Vendor pages
    for (const v of vendors) {
      entries.push({
        url: `${baseUrl}/vendor/${v.slug}`,
        lastModified: v.createdAt,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // DB unavailable — return static pages only
  }

  return entries;
}
