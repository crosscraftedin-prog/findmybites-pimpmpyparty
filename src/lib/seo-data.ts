import { db } from "@/lib/db";
import { migrateCategory, getCategoryMigrated, CATEGORIES } from "@/lib/constants";

/**
 * Automatic SEO page generation — data layer.
 *
 * Powers ALL dynamic SEO pages. Every function here reads approved vendors from
 * the DB so pages auto-appear the moment a vendor in a new city/category is
 * approved — no manual content creation ever.
 *
 * Route patterns served (all handled by the [ecosystem]/[[...path]] catch-all
 * to avoid Next.js sibling-dynamic-segment conflicts):
 *   /[category]-[city]   → keyword page   (e.g. /wedding-cakes-dubai)
 *   /[city]              → city page      (e.g. /dubai)
 *   /[city]/[category]   → city/category  (e.g. /dubai/wedding-cakes)
 *   /near-me/[category]  → near-me page
 */

export interface SEOPage {
  /** Full keyword slug, e.g. "wedding-cakes-dubai" */
  keyword: string;
  /** Human category label, e.g. "Wedding Cakes" */
  category: string;
  /** Category id (migrated), e.g. "bakers-bakery" */
  categorySlug: string;
  /** Raw city name, e.g. "Dubai" */
  city: string;
  /** City slug, e.g. "dubai" */
  citySlug: string;
  country: string;
  countryCode: string;
  continent: string;
  ecosystem: string;
}

export interface SEOCity {
  city: string;
  citySlug: string;
  country: string;
  countryCode: string;
  continent: string;
  vendorCount: number;
}

export interface SEOCategory {
  categorySlug: string;
  categoryLabel: string;
  ecosystem: string;
}

/** slugify helper — lowercase, hyphens, ascii-only. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Title-case a city/category for display ("dubai" → "Dubai"). */
export function titleCase(s: string): string {
  return s
    .replace(/-/g, " ")
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Get every unique category+city combination that has ≥1 approved vendor.
 * Each becomes a /[category]-[city] keyword page.
 */
export async function getAllSEOPages(): Promise<SEOPage[]> {
  try {
    const vendors = await db.vendor.findMany({
      where: { approved: true },
      select: {
        city: true,
        country: true,
        countryCode: true,
        continent: true,
        category: true,
        ecosystem: true,
      },
    });

    const seen = new Set<string>();
    const pages: SEOPage[] = [];

    for (const v of vendors) {
      if (!v.city || !v.category) continue;
      const migrated = migrateCategory(v.category);
      const catDef = getCategoryMigrated(v.category);
      const categorySlug = migrated;
      const citySlug = slugify(v.city);
      if (!citySlug || !categorySlug) continue;

      const keyword = `${categorySlug}-${citySlug}`;
      if (seen.has(keyword)) continue;
      seen.add(keyword);

      pages.push({
        keyword,
        category: catDef?.label ?? titleCase(v.category),
        categorySlug,
        city: v.city,
        citySlug,
        country: v.country,
        countryCode: v.countryCode,
        continent: v.continent,
        ecosystem: v.ecosystem,
      });
    }

    return pages;
  } catch {
    return [];
  }
}

/** Get every city that has ≥1 approved vendor (for /[city] pages + sitemap). */
export async function getAllCities(): Promise<SEOCity[]> {
  try {
    const groups = await db.vendor.groupBy({
      by: ["city", "country", "countryCode", "continent"],
      where: { approved: true },
      _count: { id: true },
    });

    return groups
      .filter((g) => g._count.id >= 1 && g.city)
      .map((g) => ({
        city: g.city,
        citySlug: slugify(g.city),
        country: g.country,
        countryCode: g.countryCode,
        continent: g.continent,
        vendorCount: g._count.id,
      }));
  } catch {
    return [];
  }
}

/** Get every category slug that has ≥1 approved vendor (for /near-me/[category]). */
export async function getAllCategories(): Promise<SEOCategory[]> {
  try {
    const rows = await db.vendor.findMany({
      where: { approved: true },
      select: { category: true, ecosystem: true },
      distinct: ["category", "ecosystem"],
    });

    const seen = new Set<string>();
    const out: SEOCategory[] = [];
    for (const r of rows) {
      if (!r.category) continue;
      const migrated = migrateCategory(r.category);
      if (seen.has(migrated)) continue;
      seen.add(migrated);
      const catDef = getCategoryMigrated(r.category);
      out.push({
        categorySlug: migrated,
        categoryLabel: catDef?.label ?? titleCase(r.category),
        ecosystem: r.ecosystem,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export interface SEOVendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  city: string;
  state: string | null;
  country: string;
  countryCode: string;
  rating: number;
  reviewCount: number;
  heroImage: string;
  tagline: string;
  basePrice: number;
  currency: string;
  whatsapp: string | null;
  featured: boolean;
  verified: boolean;
}

const VENDOR_SELECT = {
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
} as const;

/**
 * Get vendors for a specific city + category (for /[category]-[city] and
 * /[city]/[category] pages). Matches the migrated category slug + city
 * case-insensitively. Orders featured → rating → reviews, takes 12.
 */
export async function getVendorsForPage(
  city: string,
  categorySlug: string
): Promise<{ vendors: SEOVendor[]; total: number }> {
  try {
    const migrated = migrateCategory(categorySlug);
    const where = {
      approved: true,
      city: { contains: city, mode: "insensitive" as const },
      OR: [
        { category: migrated },
        { category: categorySlug },
      ],
    };

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        take: 12,
        orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }] as any,
        select: VENDOR_SELECT,
      }),
      db.vendor.count({ where }),
    ]);

    return { vendors: vendors as SEOVendor[], total };
  } catch {
    return { vendors: [], total: 0 };
  }
}

/** Get ALL vendors in a city (for /[city] pages). */
export async function getVendorsForCity(
  city: string
): Promise<{ vendors: SEOVendor[]; total: number }> {
  try {
    const where = {
      approved: true,
      city: { contains: city, mode: "insensitive" as const },
    };
    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        take: 24,
        orderBy: [{ featured: "desc" }, { rating: "desc" }] as any,
        select: VENDOR_SELECT,
      }),
      db.vendor.count({ where }),
    ]);
    return { vendors: vendors as SEOVendor[], total };
  } catch {
    return { vendors: [], total: 0 };
  }
}

/**
 * Get related category pages for a city (internal linking).
 * Returns other categories that have approved vendors in the same city.
 */
export async function getRelatedPages(
  city: string,
  currentCategorySlug: string
): Promise<{ label: string; slug: string }[]> {
  try {
    const rows = await db.vendor.findMany({
      where: {
        approved: true,
        city: { contains: city, mode: "insensitive" as const },
      },
      select: { category: true },
      distinct: ["category"],
    });

    const citySlug = slugify(city);
    const seen = new Set<string>();
    const out: { label: string; slug: string }[] = [];

    for (const r of rows) {
      if (!r.category) continue;
      const migrated = migrateCategory(r.category);
      if (migrated === currentCategorySlug) continue;
      if (seen.has(migrated)) continue;
      seen.add(migrated);
      const catDef = getCategoryMigrated(r.category);
      out.push({
        label: catDef?.label ?? titleCase(r.category),
        slug: `${migrated}-${citySlug}`,
      });
    }

    return out.slice(0, 6);
  } catch {
    return [];
  }
}

/** Get all categories available in a city (for the city page filter chips). */
export async function getCityCategories(city: string): Promise<SEOCategory[]> {
  try {
    const rows = await db.vendor.findMany({
      where: {
        approved: true,
        city: { contains: city, mode: "insensitive" as const },
      },
      select: { category: true, ecosystem: true },
      distinct: ["category", "ecosystem"],
    });
    const seen = new Set<string>();
    const out: SEOCategory[] = [];
    for (const r of rows) {
      if (!r.category) continue;
      const migrated = migrateCategory(r.category);
      if (seen.has(migrated)) continue;
      seen.add(migrated);
      const catDef = getCategoryMigrated(r.category);
      out.push({
        categorySlug: migrated,
        categoryLabel: catDef?.label ?? titleCase(r.category),
        ecosystem: r.ecosystem,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Resolve a keyword slug (e.g. "wedding-cakes-dubai") into a page by checking
 * against the DB-derived list of valid pages. Used by the [ecosystem] route
 * to decide whether a single-segment URL is a keyword page.
 */
export async function resolveKeywordPage(
  keyword: string
): Promise<SEOPage | null> {
  const pages = await getAllSEOPages();
  return pages.find((p) => p.keyword === keyword) ?? null;
}

/**
 * Resolve a city slug into a city record. Used by the [ecosystem] route to
 * decide whether a single-segment URL is a city page.
 */
export async function resolveCity(citySlug: string): Promise<SEOCity | null> {
  const cities = await getAllCities();
  return cities.find((c) => c.citySlug === citySlug) ?? null;
}

/**
 * Resolve a /city/category URL into a page. The first segment is a city slug,
 * the second a category slug.
 */
export async function resolveCityCategoryPage(
  citySlug: string,
  categorySlug: string
): Promise<{ page: SEOPage; city: SEOCity } | null> {
  const city = await resolveCity(citySlug);
  if (!city) return null;
  const catDef = CATEGORIES.find((c) => c.id === categorySlug);
  if (!catDef) return null;
  // Confirm at least one approved vendor exists in this city+category.
  const pages = await getAllSEOPages();
  const page = pages.find(
    (p) => p.citySlug === citySlug && p.categorySlug === categorySlug
  );
  if (!page) return null;
  return { page, city };
}
