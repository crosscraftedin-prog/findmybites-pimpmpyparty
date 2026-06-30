import type { SEOPage, SEOCity, SEOVendor } from "@/lib/seo-data";
import { titleCase } from "@/lib/seo-data";

/**
 * Automatic SEO content generation — FAQs, price guides, and JSON-LD schemas
 * for every auto-generated SEO page. All dynamic, no manual content.
 */

// ─── Currency / price helpers ──────────────────────────────────────────────

const CURRENCY_BY_COUNTRY: Record<string, { symbol: string; multiplier: number }> = {
  AE: { symbol: "AED", multiplier: 1 },
  SA: { symbol: "SAR", multiplier: 1.02 },
  GB: { symbol: "£", multiplier: 0.22 },
  US: { symbol: "$", multiplier: 0.27 },
  IN: { symbol: "₹", multiplier: 22 },
  NG: { symbol: "₦", multiplier: 500 },
  SG: { symbol: "S$", multiplier: 0.35 },
  AU: { symbol: "A$", multiplier: 0.41 },
  CA: { symbol: "C$", multiplier: 0.37 },
  ZA: { symbol: "R", multiplier: 4.9 },
  KE: { symbol: "KSh", multiplier: 35 },
  FR: { symbol: "€", multiplier: 0.25 },
  DE: { symbol: "€", multiplier: 0.25 },
  IT: { symbol: "€", multiplier: 0.25 },
  ES: { symbol: "€", multiplier: 0.25 },
  NL: { symbol: "€", multiplier: 0.25 },
  BR: { symbol: "R$", multiplier: 1.5 },
  JP: { symbol: "¥", multiplier: 40 },
  TH: { symbol: "฿", multiplier: 9 },
  ID: { symbol: "Rp", multiplier: 4300 },
  PH: { symbol: "₱", multiplier: 15 },
};

export function getCurrencyForCountry(countryCode: string) {
  return CURRENCY_BY_COUNTRY[countryCode?.toUpperCase()] ?? { symbol: "USD", multiplier: 0.27 };
}

// ─── Price guide ───────────────────────────────────────────────────────────

interface BasePriceRow {
  type: string;
  min: number; // in AED base
  max: number; // in AED base
}

const BASE_PRICES: Record<string, BasePriceRow[]> = {
  "bakers-bakery": [
    { type: "Simple birthday cake", min: 150, max: 300 },
    { type: "Custom themed cake", min: 300, max: 700 },
    { type: "Wedding cake (3-tier)", min: 800, max: 3000 },
    { type: "Cupcake tower (50)", min: 300, max: 600 },
  ],
  caterers: [
    { type: "Per guest (basic)", min: 50, max: 100 },
    { type: "Per guest (standard)", min: 100, max: 200 },
    { type: "Per guest (premium)", min: 200, max: 400 },
  ],
  "chef-staff": [
    { type: "Private chef (per guest)", min: 150, max: 400 },
    { type: "Bartender (per event)", min: 500, max: 1200 },
    { type: "Wait staff (per event)", min: 300, max: 800 },
  ],
  "food-trucks": [
    { type: "Per guest (street food)", min: 40, max: 90 },
    { type: "Half-day booking", min: 2000, max: 5000 },
    { type: "Full-day booking", min: 4000, max: 9000 },
  ],
  "beverage-specialists": [
    { type: "Coffee bar (per guest)", min: 30, max: 60 },
    { type: "Mocktail bar (per guest)", min: 50, max: 100 },
    { type: "Full beverage station", min: 1500, max: 4000 },
  ],
  "specialty-food": [
    { type: "Specialty platter", min: 200, max: 600 },
    { type: "Per guest (dietary)", min: 60, max: 150 },
  ],
  "event-planners": [
    { type: "Partial planning", min: 3000, max: 10000 },
    { type: "Full planning", min: 10000, max: 40000 },
    { type: "Luxury / destination", min: 40000, max: 120000 },
  ],
  decorators: [
    { type: "Balloon decor", min: 800, max: 3000 },
    { type: "Floral decor", min: 1500, max: 6000 },
    { type: "Full venue styling", min: 5000, max: 25000 },
  ],
  photographers: [
    { type: "2-hour shoot", min: 800, max: 1800 },
    { type: "Half day", min: 1500, max: 3500 },
    { type: "Full wedding day", min: 4000, max: 12000 },
  ],
  videographers: [
    { type: "Event highlight film", min: 2000, max: 5000 },
    { type: "Full wedding film", min: 5000, max: 15000 },
  ],
  djs: [
    { type: "3-hour set", min: 1200, max: 2500 },
    { type: "Half day (5 hrs)", min: 2000, max: 4000 },
    { type: "Full wedding day", min: 4000, max: 9000 },
  ],
  entertainers: [
    { type: "Single performer (1 hr)", min: 800, max: 2000 },
    { type: "Kids party package", min: 1500, max: 3500 },
    { type: "Full stage show", min: 5000, max: 15000 },
  ],
  venues: [
    { type: "Small venue (50 guests)", min: 3000, max: 8000 },
    { type: "Mid venue (200 guests)", min: 10000, max: 30000 },
    { type: "Luxury venue (500+)", min: 30000, max: 100000 },
  ],
  florists: [
    { type: "Bridal bouquet", min: 300, max: 800 },
    { type: "Centerpieces (per table)", min: 150, max: 400 },
    { type: "Full wedding florals", min: 4000, max: 15000 },
  ],
  "rental-services": [
    { type: "Furniture rental", min: 1000, max: 5000 },
    { type: "Tent & structure", min: 3000, max: 12000 },
  ],
  "makeup-artists": [
    { type: "Party makeup", min: 400, max: 900 },
    { type: "Bridal makeup", min: 1200, max: 3500 },
  ],
  "beauty-services": [
    { type: "Hair styling", min: 400, max: 1000 },
    { type: "Mehndi / henna", min: 300, max: 1200 },
  ],
  transportation: [
    { type: "Limousine (per hour)", min: 500, max: 1200 },
    { type: "Party bus (per hour)", min: 800, max: 1800 },
  ],
  "invitation-printing": [
    { type: "Digital invite set", min: 200, max: 600 },
    { type: "Printed invitations (100)", min: 500, max: 2000 },
  ],
  "kids-party-services": [
    { type: "Bounce house rental", min: 500, max: 1500 },
    { type: "Mascot appearance", min: 600, max: 1500 },
    { type: "Full kids party package", min: 2000, max: 6000 },
  ],
  "audio-visual-services": [
    { type: "Sound system", min: 1500, max: 5000 },
    { type: "Stage lighting", min: 2000, max: 6000 },
    { type: "Full AV production", min: 8000, max: 25000 },
  ],
};

const FALLBACK_PRICES: BasePriceRow[] = [
  { type: "Basic package", min: 300, max: 800 },
  { type: "Standard package", min: 800, max: 2500 },
  { type: "Premium package", min: 2500, max: 8000 },
];

export interface PriceRow {
  type: string;
  range: string;
}

export function generatePriceGuide(
  categorySlug: string,
  countryCode: string
): { currency: string; rows: PriceRow[] } {
  const { symbol, multiplier } = getCurrencyForCountry(countryCode);
  const baseRows = BASE_PRICES[categorySlug] ?? FALLBACK_PRICES;

  const rows: PriceRow[] = baseRows.map((row) => {
    const min = Math.round(row.min * multiplier);
    const max = Math.round(row.max * multiplier);
    return {
      type: row.type,
      range: `${symbol} ${min.toLocaleString()} – ${symbol} ${max.toLocaleString()}`,
    };
  });

  return { currency: symbol, rows };
}

// ─── FAQ generation ────────────────────────────────────────────────────────

export interface FAQ {
  q: string;
  a: string;
}

export function generateFAQs(
  categoryLabel: string,
  categorySlug: string,
  city: string,
  country: string,
  _vendors: SEOVendor[]
): FAQ[] {
  const cat = categoryLabel.toLowerCase();
  const slug = categorySlug.toLowerCase();
  const isCake = slug.includes("baker") || cat.includes("cake");
  const isWedding = cat.includes("wedding");
  const isDJ = slug.includes("dj");
  const isPhoto = slug.includes("photo");
  const isVenue = slug.includes("venue");
  const isFood = ["baker", "cater", "chef", "food", "dessert", "beverage", "specialty"].some((k) =>
    slug.includes(k)
  );
  const { symbol } = getCurrencyForCountry(_vendors[0]?.countryCode ?? "");

  const faqs: FAQ[] = [
    {
      q: `How much do ${cat} cost in ${city}?`,
      a: `${categoryLabel} in ${city} typically cost between ${symbol}300 and ${symbol}8,000 depending on the package, experience, and event size. Use FindMyBites to compare prices from multiple verified vendors in ${city} for free — no commission, no middleman.`,
    },
    {
      q: `How do I find the best ${cat} in ${city}?`,
      a: `Browse verified ${cat} on FindMyBites. All vendors are checked before listing. Read reviews, compare galleries and prices, then contact vendors directly via WhatsApp — no middleman, no commission.`,
    },
    {
      q: `Are ${cat} vendors on FindMyBites in ${city} verified?`,
      a: `Yes — every vendor on FindMyBites goes through our verification process before their listing goes live. You can see verified badges and customer reviews on each vendor profile.`,
    },
    {
      q: `How far in advance should I book ${cat} in ${city}?`,
      a: isWedding
        ? `For wedding services in ${city}, we recommend booking 2–4 months in advance, especially during peak season (October–April in ${city}).`
        : `For most ${cat} in ${city}, booking 1–2 weeks in advance is sufficient. For large events, book 1–2 months ahead.`,
    },
    {
      q: `Is it free to enquire about ${cat} in ${city}?`,
      a: `Yes — enquiring on FindMyBites is completely free. We never charge customers or add commission to bookings. You contact vendors directly and agree terms with them.`,
    },
  ];

  if (isCake) {
    faqs.push({
      q: `Do cake makers in ${city} offer Halal options?`,
      a: `Many cake makers in ${city} on FindMyBites offer Halal-certified ingredients. Look for the Halal badge on vendor profiles or ask when you send your enquiry.`,
    });
  }
  if (isDJ) {
    faqs.push({
      q: `Do DJs in ${city} provide their own equipment?`,
      a: `Most DJs listed on FindMyBites in ${city} bring their own professional sound and lighting equipment. Check each vendor's profile for what's included in their packages.`,
    });
  }
  if (isPhoto) {
    faqs.push({
      q: `How many photos will I receive from a photographer in ${city}?`,
      a: `This varies by package. Most photographers in ${city} on FindMyBites include 100–500 edited digital photos depending on the duration booked. Check each vendor's package details.`,
    });
  }
  if (isVenue) {
    faqs.push({
      q: `Do venues in ${city} include catering and decor?`,
      a: `Some venues in ${city} offer all-inclusive packages with catering and decor; others are dry-hire only. Check each venue's profile or enquire directly to confirm what's included.`,
    });
  }
  if (isFood && !isCake) {
    faqs.push({
      q: `Do ${cat} in ${city} offer Halal and dietary options?`,
      a: `Yes — most food vendors in ${city} on FindMyBites offer Halal ingredients, and many accommodate vegetarian, vegan, gluten-free, and other dietary requirements. Ask when you enquire.`,
    });
  }

  return faqs.slice(0, 6);
}

// ─── JSON-LD schemas ───────────────────────────────────────────────────────

export function generateBreadcrumbJsonLd(
  crumbs: { label: string; url: string }[]
): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.url,
    })),
  };
}

export function generateFAQJsonLd(faqs: FAQ[]): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function generateItemListJsonLd(
  vendors: SEOVendor[],
  name: string
): Record<string, any> | null {
  if (vendors.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: vendors.slice(0, 12).map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": v.ecosystem === "FINDMYBITES" ? "FoodEstablishment" : "LocalBusiness",
        name: v.name,
        url: `https://www.findmybites.com/vendor/${v.slug}`,
        image: v.heroImage || undefined,
        telephone: v.whatsapp || undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: v.city,
          addressCountry: v.countryCode || undefined,
        },
        aggregateRating:
          v.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: v.rating,
                reviewCount: v.reviewCount,
              }
            : undefined,
      },
    })),
  };
}

// ─── Metadata helpers ──────────────────────────────────────────────────────

const VERB: Record<string, string> = {
  FINDMYBITES: "Order",
  PIMPMYPARTY: "Book",
};

export function generateKeywordMetadata(page: SEOPage) {
  const city = titleCase(page.city);
  const verb = VERB[page.ecosystem] ?? "Book";
  const title = `${page.category} in ${city} | FindMyBites`;
  const description = `${verb} ${page.category.toLowerCase()} in ${city}, ${page.country}. Browse verified vendors, compare prices, and enquire for free. No commission, direct contact.`;
  const url = `https://www.findmybites.com/${page.keyword}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "FindMyBites × PimpMyParty",
      type: "website",
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
    other: {
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
  };
}

export function generateCityMetadata(city: SEOCity) {
  const cityDisplay = titleCase(city.city);
  const title = `Vendors in ${cityDisplay} | FindMyBites`;
  const description = `Find the best food and event vendors in ${cityDisplay}, ${city.country}. Browse ${city.vendorCount}+ verified vendors — bakers, caterers, DJs, photographers, and more. Free to enquire.`;
  const url = `https://www.findmybites.com/${city.citySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "FindMyBites × PimpMyParty",
      type: "website",
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
    other: {
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
  };
}

export function generateCityCategoryMetadata(page: SEOPage, city: SEOCity) {
  const cityDisplay = titleCase(city.city);
  const title = `${page.category} in ${cityDisplay} | FindMyBites`;
  const description = `Find the best ${page.category.toLowerCase()} in ${cityDisplay}, ${city.country}. Browse verified vendors, compare prices, and enquire for free. No commission.`;
  const url = `https://www.findmybites.com/${page.citySlug}/${page.categorySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "FindMyBites × PimpMyParty",
      type: "website",
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
    other: {
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
  };
}

export function generateNearMeMetadata(categoryLabel: string, categorySlug: string) {
  const title = `${categoryLabel} Near Me | FindMyBites`;
  const description = `Find ${categoryLabel.toLowerCase()} near you. Browse verified vendors in your city, compare prices, and enquire for free. No commission, direct contact.`;
  const url = `https://www.findmybites.com/near-me/${categorySlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "FindMyBites × PimpMyParty",
      type: "website",
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
    other: {
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
  };
}

// Re-export for convenience
export { titleCase };
export type { SEOPage, SEOCity, SEOVendor };
