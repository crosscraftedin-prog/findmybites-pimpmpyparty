/**
 * Global Attribute System — SEO content for attribute-based landing pages.
 * ─────────────────────────────────────────────────────────────────────────
 * Generates SEO pages for patterns like:
 *   /sugar-free-cakes            → attribute + category
 *   /hyderabad/sugar-free-cakes  → city + attribute + category
 *   /keto-cookies
 *   /vegan-brownies
 *
 * These pages are generated dynamically from the active attributes + categories
 * in the DB. They include proper metadata, canonical URLs, JSON-LD
 * (ItemList + BreadcrumbList), and breadcrumbs.
 */

export interface AttributeSeoPage {
  /** Full URL path, e.g. "/sugar-free-cakes" or "/hyderabad/sugar-free-cakes" */
  path: string;
  /** Attribute slug, e.g. "sugar-free" */
  attributeSlug: string;
  /** Attribute name, e.g. "Sugar Free" */
  attributeName: string;
  /** Category slug, e.g. "bakers-bakery" */
  categorySlug: string;
  /** Category label, e.g. "Cakes" */
  categoryLabel: string;
  /** City (lowercase), or null for non-city pages */
  city: string | null;
  /** H1 heading */
  h1: string;
  /** Meta title */
  metaTitle: string;
  /** Meta description */
  metaDescription: string;
  /** Page variant */
  variant: "attribute-category" | "city-attribute-category";
}

/**
 * Known category slug → label mapping for SEO URL construction.
 * Matches the category slugs used in the Vendor.category field.
 */
const CATEGORY_LABELS: Record<string, string> = {
  "bakers-bakery": "Cakes",
  "cakes": "Cakes",
  "cupcakes": "Cupcakes",
  "cookies": "Cookies",
  "brownies": "Brownies",
  "desserts": "Desserts",
  "pastries": "Pastries",
  "donuts": "Donuts",
  "bread": "Bread",
  "chocolates": "Chocolates",
  "caterers": "Catering",
  "djs": "DJs",
  "photographers": "Photographers",
  "venues": "Venues",
  "decorators": "Decorators",
  "florists": "Florists",
  "event-planners": "Event Planners",
  "makeup-beauty": "Makeup & Beauty",
  "rentals": "Rentals",
  "transportation": "Transportation",
  "entertainers": "Entertainers",
  "audio-visual": "Audio Visual",
};

/**
 * Attributes that make sense as SEO pages (dietary + product features).
 * Service/business attributes don't warrant their own landing pages.
 */
const SEO_ATTRIBUTE_GROUPS = ["dietary", "product_feature"];

/**
 * Categories that make sense for attribute SEO pages (food categories).
 * Non-food categories (DJs, Venues) don't have "sugar free" attributes.
 */
const SEO_CATEGORY_SLUGS = [
  "bakers-bakery", "cakes", "cupcakes", "cookies", "brownies",
  "desserts", "pastries", "donuts", "bread", "chocolates", "caterers",
];

/**
 * Major cities for city+attribute+category SEO pages.
 */
const SEO_CITIES = [
  "hyderabad", "mumbai", "delhi", "bangalore", "chennai", "kolkata", "pune", "ahmedabad",
  "dubai", "abu-dhabi", "sharjah",
  "london", "manchester", "birmingham",
  "new-york", "los-angeles", "san-francisco", "chicago", "houston", "toronto",
  "singapore", "sydney", "melbourne",
];

/**
 * Generate all attribute SEO pages for the sitemap.
 * Called by sitemap.ts and the dynamic route's generateStaticParams.
 *
 * @param attributes — active attributes from the DB (slug, name, group)
 * @param limit — max pages to generate (default 500 for sitemap performance)
 */
export function generateAttributeSeoPages(
  attributes: { slug: string; name: string; group: string }[],
  limit: number = 500
): AttributeSeoPage[] {
  const pages: AttributeSeoPage[] = [];
  const seoAttrs = attributes.filter((a) => SEO_ATTRIBUTE_GROUPS.includes(a.group));

  for (const attr of seoAttrs) {
    for (const catSlug of SEO_CATEGORY_SLUGS) {
      const catLabel = CATEGORY_LABELS[catSlug] ?? catSlug.replace(/-/g, " ");

      // Attribute + category page: /sugar-free-cakes
      const path1 = `/${attr.slug}-${catSlug}`;
      pages.push({
        path: path1,
        attributeSlug: attr.slug,
        attributeName: attr.name,
        categorySlug: catSlug,
        categoryLabel: catLabel,
        city: null,
        h1: `${attr.name} ${catLabel}`,
        metaTitle: `${attr.name} ${catLabel} — Best ${attr.name} ${catLabel} Near You | FindMyBites`,
        metaDescription: `Discover the best ${attr.name.toLowerCase()} ${catLabel.toLowerCase()} from verified vendors. Browse ${attr.name.toLowerCase()} ${catLabel.toLowerCase()} for delivery, pickup, and custom orders.`,
        variant: "attribute-category",
      });

      if (pages.length >= limit) return pages;

      // City + attribute + category pages: /hyderabad/sugar-free-cakes
      for (const city of SEO_CITIES) {
        const path2 = `/${city}/${attr.slug}-${catSlug}`;
        const cityLabel = city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        pages.push({
          path: path2,
          attributeSlug: attr.slug,
          attributeName: attr.name,
          categorySlug: catSlug,
          categoryLabel: catLabel,
          city,
          h1: `${attr.name} ${catLabel} in ${cityLabel}`,
          metaTitle: `${attr.name} ${catLabel} in ${cityLabel} — Best Local ${attr.name} ${catLabel} | FindMyBites`,
          metaDescription: `Find the best ${attr.name.toLowerCase()} ${catLabel.toLowerCase()} in ${cityLabel}. Browse verified local vendors offering ${attr.name.toLowerCase()} options with delivery and custom orders.`,
          variant: "city-attribute-category",
        });

        if (pages.length >= limit) return pages;
      }
    }
  }

  return pages;
}

/**
 * Generate JSON-LD structured data for an attribute SEO page.
 */
export function generateAttributePageJsonLd(page: AttributeSeoPage, vendors: any[] = []) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: page.categoryLabel, item: `/${page.categorySlug}` },
      ...(page.city
        ? [{ "@type": "ListItem", position: 3, name: page.city, item: `/${page.city}` }]
        : []),
      {
        "@type": "ListItem",
        position: page.city ? 4 : 3,
        name: `${page.attributeName} ${page.categoryLabel}`,
        item: page.path,
      },
    ],
  };

  const itemList = vendors.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${page.attributeName} ${page.categoryLabel}`,
        itemListElement: vendors.slice(0, 10).map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: v.name,
          url: `/vendor/${v.slug}`,
        })),
      }
    : null;

  return { breadcrumb, itemList };
}

/**
 * Parse an attribute SEO URL path into its components.
 * Returns null if the path doesn't match the attribute-page pattern.
 *
 * Examples:
 *   "/sugar-free-cakes"           → { city: null, attributeSlug: "sugar-free", categorySlug: "cakes" }
 *   "/hyderabad/sugar-free-cakes" → { city: "hyderabad", attributeSlug: "sugar-free", categorySlug: "cakes" }
 *   "/sugar-free-cupcakes"        → { city: null, attributeSlug: "sugar-free", categorySlug: "cupcakes" }
 */
export function parseAttributeSeoPath(path: string): {
  city: string | null;
  attributeSlug: string;
  categorySlug: string;
} | null {
  // Remove leading/trailing slashes
  const clean = path.replace(/^\/+|\/+$/g, "");
  const segments = clean.split("/");

  // Pattern 1: /{attribute}-{category} (no city)
  if (segments.length === 1) {
    const parsed = parseAttributeCategory(segments[0]);
    if (parsed) return { city: null, ...parsed };
  }

  // Pattern 2: /{city}/{attribute}-{category}
  if (segments.length === 2) {
    const parsed = parseAttributeCategory(segments[1]);
    if (parsed) return { city: segments[0], ...parsed };
  }

  return null;
}

/**
 * Try to split "sugar-free-cakes" into { attributeSlug: "sugar-free", categorySlug: "cakes" }.
 * Returns null if no known category suffix matches.
 */
function parseAttributeCategory(
  combined: string
): { attributeSlug: string; categorySlug: string } | null {
  // Try each known category suffix (longest first to avoid partial matches)
  const sortedCats = [...SEO_CATEGORY_SLUGS].sort((a, b) => b.length - a.length);
  for (const catSlug of sortedCats) {
    const suffix = `-${catSlug}`;
    if (combined.endsWith(suffix)) {
      const attrSlug = combined.slice(0, combined.length - suffix.length);
      // Validate: attribute slug should be non-empty and contain only valid chars
      if (attrSlug.length > 0 && /^[a-z0-9-]+$/.test(attrSlug)) {
        return { attributeSlug: attrSlug, categorySlug: catSlug };
      }
    }
    // Also try the exact category as the whole string (e.g. "cakes" → attr="", cat="cakes")
    // This shouldn't match for attribute pages, so skip.
  }
  return null;
}
