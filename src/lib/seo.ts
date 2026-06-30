import type { Metadata } from "next";

export type Ecosystem = "FINDMYBITES" | "PIMPMYPARTY";

export interface SEOContext {
  ecosystem: Ecosystem;
  country?: string;
  state?: string;
  city?: string;
  category?: string;
  vendorCount?: number;
}

const ECOSYSTEM_LABEL: Record<Ecosystem, string> = {
  FINDMYBITES: "FindMyBites",
  PIMPMYPARTY: "PimpMyParty",
};

const ECOSYSTEM_DESC: Record<Ecosystem, string> = {
  FINDMYBITES: "food vendors — bakers, cake artists, caterers, private chefs, food trucks",
  PIMPMYPARTY: "event vendors — photographers, DJs, decorators, venues, entertainers",
};

/** Generate SEO metadata for a location/category page. */
export function generateSEOMetadata(ctx: SEOContext, resolvedCatLabel?: string): Metadata {
  const { ecosystem, country, state, city, category, vendorCount = 0 } = ctx;
  const ecoLabel = ECOSYSTEM_LABEL[ecosystem];
  // Use resolved DB label (passed by caller), or title-cased slug as last resort
  const catLabel = resolvedCatLabel ?? (category ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : undefined);

  // Build title
  const parts: string[] = [];
  if (catLabel) parts.push(catLabel);
  else if (city) parts.push("Vendors");
  else if (state) parts.push("Vendors");
  else if (country) parts.push("Vendors");

  const location = [city, state, country].filter(Boolean).join(", ");
  if (location) parts.push(`in ${location}`);

  const title = parts.length > 0
    ? `${parts.join(" ")} | ${ecoLabel}`
    : `${ecoLabel} — Global ${ecosystem === "FINDMYBITES" ? "Food" : "Event"} Vendor Marketplace`;

  // Build description
  let desc: string;
  if (catLabel && city) {
    desc = `Discover ${vendorCount > 0 ? `${vendorCount}+ ` : ""}top-rated ${catLabel.toLowerCase()} in ${city}. Compare listings, view galleries, and contact vendors directly on ${ecoLabel}.`;
  } else if (city) {
    desc = `Find the best ${ECOSYSTEM_DESC[ecosystem]} in ${city}. Browse verified vendor listings with reviews, photos, and direct contact.`;
  } else if (state) {
    desc = `Browse ${ECOSYSTEM_DESC[ecosystem]} across ${state}. Find verified vendors with reviews and direct contact.`;
  } else if (country) {
    desc = `Discover ${ECOSYSTEM_DESC[ecosystem]} across ${country}. Browse verified vendor listings with reviews, photos, and pricing.`;
  } else {
    desc = `${ecoLabel} is the global marketplace for ${ECOSYSTEM_DESC[ecosystem]}. Find and connect with verified vendors worldwide.`;
  }

  const path = buildPath(ctx);
  const url = `https://findmybites.com${path}`;

  return {
    title,
    description: desc,
    canonical: url,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: ecoLabel,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

/** Build the URL path for a given SEO context. */
export function buildPath(ctx: SEOContext): string {
  const { ecosystem, country, state, city, category } = ctx;
  const ecoSlug = ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";
  const segments = [ecoSlug];

  if (country) {
    segments.push(slugify(country));
    if (city) {
      segments.push(slugify(city));
      if (category) {
        segments.push(category);
      }
    } else if (state) {
      segments.push(slugify(state));
    }
  }

  return `/${segments.join("/")}`;
}

/** Generate JSON-LD structured data for a page. */
export function generateJsonLd(ctx: SEOContext, vendors: any[] = [], resolvedCatLabel?: string) {
  const { ecosystem, country, state, city, category } = ctx;
  const ecoLabel = ECOSYSTEM_LABEL[ecosystem];
  const catLabel = resolvedCatLabel ?? (category ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : undefined);
  const path = buildPath(ctx);
  const url = `https://findmybites.com${path}`;

  const jsonLd: Record<string, any>[] = [];

  // Organization / WebSite
  jsonLd.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ecoLabel,
    url: `https://findmybites.com/${ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty"}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `https://findmybites.com/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });

  // BreadcrumbList
  const breadcrumbs = generateBreadcrumbs(ctx);
  jsonLd.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.label,
      item: `https://findmybites.com${b.path}`,
    })),
  });

  // ItemList of vendors (LocalBusiness)
  if (vendors.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: vendors.slice(0, 20).map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: v.name,
          url: `https://findmybites.com/vendor/${v.slug}`,
          telephone: v.whatsapp ?? undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: v.city,
            addressRegion: v.state ?? undefined,
            addressCountry: v.country,
          },
          aggregateRating: v.reviewCount > 0 ? {
            "@type": "AggregateRating",
            ratingValue: v.rating,
            reviewCount: v.reviewCount,
          } : undefined,
        },
      })),
    });
  }

  // FAQPage for category+city pages
  if (cat && city) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `How do I find the best ${catLabel} in ${city}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Browse our verified listings of ${catLabel.toLowerCase()} in ${city} on ${ecoLabel}. Compare reviews, galleries, and pricing, then contact vendors directly via WhatsApp.`,
          },
        },
        {
          "@type": "Question",
          name: `How many ${catLabel} are listed in ${city}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `We currently have ${vendors.length} ${catLabel.toLowerCase()} listed in ${city}. New vendors are added regularly.`,
          },
        },
      ],
    });
  }

  return jsonLd;
}

/** Generate breadcrumb trail for a page. */
export function generateBreadcrumbs(ctx: SEOContext) {
  const { ecosystem, country, state, city, category } = ctx;
  const ecoSlug = ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";
  const ecoLabel = ECOSYSTEM_LABEL[ecosystem];
  const crumbs: { label: string; path: string }[] = [
    { label: "Home", path: "/" },
    { label: ecoLabel, path: `/${ecoSlug}` },
  ];

  if (country) {
    crumbs.push({ label: country, path: `/${ecoSlug}/${slugify(country)}` });
    if (city) {
      crumbs.push({ label: city, path: `/${ecoSlug}/${slugify(country)}/${slugify(city)}` });
      if (category) {
        crumbs.push({ label: catLabel ?? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), path: `/${ecoSlug}/${slugify(country)}/${slugify(city)}/${category}` });
      }
    } else if (state) {
      crumbs.push({ label: state, path: `/${ecoSlug}/${slugify(country)}/${slugify(state)}` });
    }
  }

  return crumbs;
}

/** Generate intro content for a page. */
export function generateIntroContent(ctx: SEOContext, vendorCount: number, resolvedCatLabel?: string): string {
  const { ecosystem, country, state, city, category } = ctx;
  const ecoLabel = ECOSYSTEM_LABEL[ecosystem];
  const catLabel = resolvedCatLabel ?? (category ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : undefined);

  if (catLabel && city) {
    return `Looking for the best ${catLabel.toLowerCase()} in ${city}? ${ecoLabel} connects you with ${vendorCount} verified ${catLabel.toLowerCase()}${vendorCount !== 1 ? "s" : ""} in ${city}. Browse galleries, compare pricing, read reviews, and contact vendors directly — all in one place.`;
  }

  if (city) {
    return `Discover top-rated ${ECOSYSTEM_DESC[ecosystem]} in ${city}. ${vendorCount}+ verified vendors with reviews, photos, and direct contact options.`;
  }

  if (state) {
    return `Browse ${ECOSYSTEM_DESC[ecosystem]} across ${state}. ${vendorCount}+ verified vendors available.`;
  }

  if (country) {
    return `Find the best ${ECOSYSTEM_DESC[ecosystem]} in ${country}. ${vendorCount}+ verified vendors across the country.`;
  }

  return `${ecoLabel} is the global marketplace for ${ECOSYSTEM_DESC[ecosystem]}. Find and connect with verified vendors worldwide.`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
