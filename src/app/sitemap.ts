import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CATEGORIES, migrateCategory } from "@/lib/constants";

/**
 * /sitemap.xml — auto-generated sitemap for all SEO pages.
 *
 * Includes:
 * - Homepage
 * - Ecosystem landing pages (/findmybites, /pimpmyparty)
 * - Country pages (/findmybites/india, etc.)
 * - City pages (/findmybites/india/hyderabad, etc.)
 * - Category pages (/findmybites/india/hyderabad/bakers-bakery, etc.)
 * - Vendor pages (/vendor/[slug])
 *
 * Updates automatically when data changes (ISR with 1hr revalidation).
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
  );

  try {
    // Fetch all location + category data in parallel
    const [countries, cities, cityCategories, vendors] = await Promise.all([
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
        select: { slug: true, updatedAt: true },
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

    // City pages
    for (const c of cities) {
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

    // Category pages per city
    for (const cc of cityCategories) {
      const migrated = migrateCategory(cc.category);
      const cat = CATEGORIES.find((c) => c.id === migrated && c.ecosystem === cc.ecosystem);
      if (!cat) continue;

      const ecoSlug = cc.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";
      const countrySlug = slugify(cc.country);
      const citySlug = slugify(cc.city);

      entries.push({
        url: `${baseUrl}/${ecoSlug}/${countrySlug}/${citySlug}/${migrated}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    // Vendor pages
    for (const v of vendors) {
      entries.push({
        url: `${baseUrl}/vendor/${v.slug}`,
        lastModified: v.updatedAt,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // DB unavailable — return static pages only
  }

  return entries;
}
