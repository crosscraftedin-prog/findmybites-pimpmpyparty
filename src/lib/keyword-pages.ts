import type { Metadata } from "next";
import type { Ecosystem } from "./types";
import { db } from "./db";
import { migrateCategory, getCategoryMigrated } from "./constants";

/**
 * Keyword landing pages — dedicated SEO pages targeting high-intent searches
 * like "wedding cakes dubai", "dj near me", "catering hyderabad".
 *
 * Each entry maps a URL slug → a keyword + location + category + ecosystem,
 * so we can render a focused, content-rich landing page that ranks for that
 * exact search term.
 */

export interface KeywordPage {
  /** URL slug, e.g. "wedding-cakes-dubai" */
  slug: string;
  /** Display keyword, e.g. "Wedding Cakes" */
  keyword: string;
  /** Display location, e.g. "Dubai" */
  location: string;
  /** City name used to filter vendors in the DB (case-insensitive) */
  city: string;
  /** Country name used to filter vendors (case-insensitive) */
  country: string;
  /** ISO country code for flags / context */
  countryCode: string;
  /** Ecosystem this keyword belongs to */
  ecosystem: Ecosystem;
  /** Category id (new architecture) to match vendors */
  category: string;
  /** Human category label */
  categoryLabel: string;
  /** Price range string for FAQ */
  priceRange: string;
  /** Currency symbol for the location */
  currencySymbol: string;
  /** FAQ entries (also emitted as FAQPage JSON-LD) */
  faqs: { q: string; a: string }[];
  /** Related keyword pages (internal links) */
  related: { label: string; slug: string }[];
  /** Other cities to link to (same keyword) */
  otherCities: { label: string; slug: string }[];
}

export const KEYWORD_PAGES: KeywordPage[] = [
  {
    slug: "wedding-cakes-dubai",
    keyword: "Wedding Cakes",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "FINDMYBITES",
    category: "bakers-bakery",
    categoryLabel: "Bakers & Bakery",
    priceRange: "AED 500 – AED 3,500",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much do wedding cakes cost in Dubai?",
        a: "Wedding cakes in Dubai typically cost between AED 500 and AED 3,500 depending on size, design complexity, and servings. Multi-tier fondant cakes and custom designer cakes sit at the higher end, while buttercream cakes for smaller guest counts are more affordable.",
      },
      {
        q: "How do I find the best wedding cake maker near me in Dubai?",
        a: "Use FindMyBites to browse verified wedding cake vendors in Dubai. Compare galleries, read real customer reviews, check pricing, and contact bakers directly via WhatsApp — no commission, no middleman.",
      },
      {
        q: "Are the wedding cake vendors on FindMyBites verified?",
        a: "Yes. Every baker and cake artist on FindMyBites is reviewed by our team before their listing goes live. Look for the verified badge on each vendor profile.",
      },
      {
        q: "Can I order an eggless or vegan wedding cake in Dubai?",
        a: "Absolutely. Many of our Dubai bakers offer eggless, vegan, gluten-free, and sugar-free wedding cakes. Filter by dietary preference or message the vendor directly to customise your order.",
      },
    ],
    related: [
      { label: "Smash Cakes Dubai", slug: "smash-cakes-dubai" },
      { label: "Catering Dubai", slug: "catering-dubai" },
      { label: "Private Chef Dubai", slug: "private-chef-dubai" },
    ],
    otherCities: [
      { label: "London", slug: "wedding-cakes-london" },
    ],
  },
  {
    slug: "wedding-cakes-london",
    keyword: "Wedding Cakes",
    location: "London",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    ecosystem: "FINDMYBITES",
    category: "bakers-bakery",
    categoryLabel: "Bakers & Bakery",
    priceRange: "£200 – £1,800",
    currencySymbol: "£",
    faqs: [
      {
        q: "How much do wedding cakes cost in London?",
        a: "Wedding cakes in London typically cost between £200 and £1,800 depending on tiers, design, and servings. Bespoke fondant designs cost more, while simpler buttercream cakes are more budget-friendly.",
      },
      {
        q: "How do I find the best wedding cake maker near me in London?",
        a: "Use FindMyBites to browse verified wedding cake makers across London. Compare galleries, read reviews, check pricing, and contact bakers directly — no commission.",
      },
      {
        q: "Are the wedding cake vendors on FindMyBites verified?",
        a: "Yes. Every baker on FindMyBites is reviewed by our team before going live. Look for the verified badge on each profile.",
      },
    ],
    related: [
      { label: "Private Chef London", slug: "private-chef-london" },
      { label: "Halal Catering London", slug: "halal-catering-london" },
    ],
    otherCities: [
      { label: "Dubai", slug: "wedding-cakes-dubai" },
    ],
  },
  {
    slug: "dj-dubai",
    keyword: "DJs",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "PIMPMYPARTY",
    category: "djs",
    categoryLabel: "DJs",
    priceRange: "AED 1,500 – AED 6,000",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much does a DJ cost in Dubai?",
        a: "DJs in Dubai typically charge between AED 1,500 and AED 6,000 per event depending on experience, equipment, and event length. Top-tier club DJs and wedding specialists command higher fees.",
      },
      {
        q: "How do I find the best DJ near me in Dubai?",
        a: "Use FindMyBites to browse verified DJs in Dubai. Compare genres, listen to mixes, read reviews, and message DJs directly via WhatsApp to check availability.",
      },
      {
        q: "Are the DJs on FindMyBites verified?",
        a: "Yes. Every DJ on FindMyBites is reviewed before their listing goes live. Look for the verified badge and real customer reviews on each profile.",
      },
      {
        q: "What music genres do Dubai DJs specialise in?",
        a: "Dubai DJs cover open-format, house/EDM, Bollywood, Arabic, Latin, Afrobeats, hip-hop, and techno. Filter by genre on FindMyBites to find the right fit for your event.",
      },
    ],
    related: [
      { label: "Photographers Dubai", slug: "photographers-dubai" },
      { label: "Event Planners Dubai", slug: "event-planners-dubai" },
      { label: "Kids Party Dubai", slug: "kids-party-dubai" },
    ],
    otherCities: [
      { label: "London", slug: "dj-london" },
    ],
  },
  {
    slug: "dj-london",
    keyword: "DJs",
    location: "London",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    ecosystem: "PIMPMYPARTY",
    category: "djs",
    categoryLabel: "DJs",
    priceRange: "£300 – £1,500",
    currencySymbol: "£",
    faqs: [
      {
        q: "How much does a DJ cost in London?",
        a: "DJs in London typically charge between £300 and £1,500 per event depending on experience, equipment, and hours. Club and wedding DJs are at the higher end.",
      },
      {
        q: "How do I find the best DJ near me in London?",
        a: "Use FindMyBites to browse verified DJs across London. Compare genres, read reviews, and contact DJs directly — no commission.",
      },
      {
        q: "Are the DJs on FindMyBites verified?",
        a: "Yes. Every DJ on FindMyBites is reviewed before going live. Look for the verified badge on each profile.",
      },
    ],
    related: [
      { label: "Photographers Dubai", slug: "photographers-dubai" },
      { label: "Wedding Cakes London", slug: "wedding-cakes-london" },
    ],
    otherCities: [
      { label: "Dubai", slug: "dj-dubai" },
    ],
  },
  {
    slug: "catering-dubai",
    keyword: "Catering",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "FINDMYBITES",
    category: "caterers",
    categoryLabel: "Caterers",
    priceRange: "AED 80 – AED 350 per guest",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much does catering cost in Dubai?",
        a: "Catering in Dubai typically costs between AED 80 and AED 350 per guest depending on menu, service style (buffet vs plated), and cuisine. Premium and live-counter setups cost more.",
      },
      {
        q: "How do I find the best catering near me in Dubai?",
        a: "Use FindMyBites to browse verified caterers in Dubai. Compare menus, pricing per head, read reviews, and contact caterers directly via WhatsApp.",
      },
      {
        q: "Are the caterers on FindMyBites verified?",
        a: "Yes. Every caterer on FindMyBites is reviewed before their listing goes live. Look for the verified badge and customer reviews.",
      },
      {
        q: "Can I get halal catering in Dubai?",
        a: "Yes — the vast majority of caterers in Dubai offer halal menus. Many also provide vegetarian, vegan, and gluten-free options. Message the caterer directly to confirm.",
      },
    ],
    related: [
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Private Chef Dubai", slug: "private-chef-dubai" },
      { label: "Event Planners Dubai", slug: "event-planners-dubai" },
    ],
    otherCities: [
      { label: "London", slug: "halal-catering-london" },
    ],
  },
  {
    slug: "photographers-dubai",
    keyword: "Photographers",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "PIMPMYPARTY",
    category: "photographers",
    categoryLabel: "Photographers",
    priceRange: "AED 1,200 – AED 8,000",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much does a photographer cost in Dubai?",
        a: "Photographers in Dubai typically charge between AED 1,200 and AED 8,000 per event depending on hours, deliverables, and experience. Wedding and pre-wedding shoots sit at the higher end.",
      },
      {
        q: "How do I find the best photographer near me in Dubai?",
        a: "Use FindMyBites to browse verified photographers in Dubai. Compare portfolios, read reviews, check pricing, and message photographers directly.",
      },
      {
        q: "Are the photographers on FindMyBites verified?",
        a: "Yes. Every photographer on FindMyBites is reviewed before their listing goes live. Look for the verified badge and real client reviews.",
      },
    ],
    related: [
      { label: "DJs Dubai", slug: "dj-dubai" },
      { label: "Event Planners Dubai", slug: "event-planners-dubai" },
      { label: "Kids Party Dubai", slug: "kids-party-dubai" },
    ],
    otherCities: [],
  },
  {
    slug: "kids-party-dubai",
    keyword: "Kids Party Entertainment",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "PIMPMYPARTY",
    category: "kids-party-services",
    categoryLabel: "Kids Party Services",
    priceRange: "AED 500 – AED 4,000",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much does kids party entertainment cost in Dubai?",
        a: "Kids party entertainment in Dubai typically costs between AED 500 and AED 4,000 depending on the activity — bounce houses, mascots, face painting, and themed decor each have different price points.",
      },
      {
        q: "How do I find the best kids party entertainment near me in Dubai?",
        a: "Use FindMyBites to browse verified kids party vendors in Dubai. Compare activities, read reviews, check pricing, and contact vendors directly via WhatsApp.",
      },
      {
        q: "Are the kids party vendors on FindMyBites verified?",
        a: "Yes. Every kids party vendor on FindMyBites is reviewed before going live. Look for the verified badge on each profile.",
      },
    ],
    related: [
      { label: "DJs Dubai", slug: "dj-dubai" },
      { label: "Photographers Dubai", slug: "photographers-dubai" },
      { label: "Event Planners Dubai", slug: "event-planners-dubai" },
    ],
    otherCities: [],
  },
  {
    slug: "private-chef-dubai",
    keyword: "Private Chef",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "FINDMYBITES",
    category: "chef-staff",
    categoryLabel: "Chef & Staff",
    priceRange: "AED 250 – AED 800 per guest",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much does a private chef cost in Dubai?",
        a: "A private chef in Dubai typically costs between AED 250 and AED 800 per guest depending on the menu, courses, and ingredients. Fine-dining and bespoke tasting menus cost more.",
      },
      {
        q: "How do I find the best private chef near me in Dubai?",
        a: "Use FindMyBites to browse verified private chefs in Dubai. Compare menus, read reviews, check pricing, and message chefs directly to plan your meal.",
      },
      {
        q: "Are the private chefs on FindMyBites verified?",
        a: "Yes. Every private chef on FindMyBites is reviewed before their listing goes live. Look for the verified badge and real customer reviews.",
      },
    ],
    related: [
      { label: "Catering Dubai", slug: "catering-dubai" },
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
    ],
    otherCities: [
      { label: "London", slug: "private-chef-london" },
    ],
  },
  {
    slug: "private-chef-london",
    keyword: "Private Chef",
    location: "London",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    ecosystem: "FINDMYBITES",
    category: "chef-staff",
    categoryLabel: "Chef & Staff",
    priceRange: "£50 – £200 per guest",
    currencySymbol: "£",
    faqs: [
      {
        q: "How much does a private chef cost in London?",
        a: "A private chef in London typically costs between £50 and £200 per guest depending on the menu, courses, and ingredients. Fine-dining tasting menus cost more.",
      },
      {
        q: "How do I find the best private chef near me in London?",
        a: "Use FindMyBites to browse verified private chefs across London. Compare menus, read reviews, check pricing, and message chefs directly.",
      },
      {
        q: "Are the private chefs on FindMyBites verified?",
        a: "Yes. Every private chef on FindMyBites is reviewed before going live. Look for the verified badge and real customer reviews.",
      },
    ],
    related: [
      { label: "Wedding Cakes London", slug: "wedding-cakes-london" },
      { label: "Halal Catering London", slug: "halal-catering-london" },
    ],
    otherCities: [
      { label: "Dubai", slug: "private-chef-dubai" },
    ],
  },
  {
    slug: "halal-catering-london",
    keyword: "Halal Catering",
    location: "London",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    ecosystem: "FINDMYBITES",
    category: "caterers",
    categoryLabel: "Caterers",
    priceRange: "£15 – £60 per guest",
    currencySymbol: "£",
    faqs: [
      {
        q: "How much does halal catering cost in London?",
        a: "Halal catering in London typically costs between £15 and £60 per guest depending on menu, cuisine, and service style. Premium menus and live counters cost more.",
      },
      {
        q: "How do I find the best halal catering near me in London?",
        a: "Use FindMyBites to browse verified halal caterers across London. Compare menus, read reviews, check pricing, and contact caterers directly — no commission.",
      },
      {
        q: "Are the halal caterers on FindMyBites verified?",
        a: "Yes. Every caterer on FindMyBites is reviewed before going live. Look for the verified badge and real customer reviews on each profile.",
      },
      {
        q: "Can I get certified halal catering for a wedding in London?",
        a: "Yes. Many of our London caterers are certified halal and experienced with large weddings. Message the caterer directly to confirm certification and menus.",
      },
    ],
    related: [
      { label: "Wedding Cakes London", slug: "wedding-cakes-london" },
      { label: "Private Chef London", slug: "private-chef-london" },
    ],
    otherCities: [
      { label: "Dubai", slug: "catering-dubai" },
    ],
  },
  {
    slug: "event-planners-dubai",
    keyword: "Event Planners",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "PIMPMYPARTY",
    category: "event-planners",
    categoryLabel: "Event Planners",
    priceRange: "AED 3,000 – AED 30,000",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much does an event planner cost in Dubai?",
        a: "Event planners in Dubai typically charge between AED 3,000 and AED 30,000 depending on event size, scope, and whether they handle end-to-end production. Some charge a percentage of the total event budget.",
      },
      {
        q: "How do I find the best event planner near me in Dubai?",
        a: "Use FindMyBites to browse verified event planners in Dubai. Compare past events, read reviews, check pricing, and contact planners directly via WhatsApp.",
      },
      {
        q: "Are the event planners on FindMyBites verified?",
        a: "Yes. Every event planner on FindMyBites is reviewed before their listing goes live. Look for the verified badge and real client reviews.",
      },
    ],
    related: [
      { label: "DJs Dubai", slug: "dj-dubai" },
      { label: "Photographers Dubai", slug: "photographers-dubai" },
      { label: "Kids Party Dubai", slug: "kids-party-dubai" },
    ],
    otherCities: [],
  },
  {
    slug: "smash-cakes-dubai",
    keyword: "Smash Cakes",
    location: "Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    ecosystem: "FINDMYBITES",
    category: "bakers-bakery",
    categoryLabel: "Bakers & Bakery",
    priceRange: "AED 150 – AED 600",
    currencySymbol: "AED",
    faqs: [
      {
        q: "How much do smash cakes cost in Dubai?",
        a: "Smash cakes in Dubai typically cost between AED 150 and AED 600 depending on design, size, and whether they're part of a first-birthday package. Many bakers offer smash cake + main cake combo deals.",
      },
      {
        q: "How do I find the best smash cake maker near me in Dubai?",
        a: "Use FindMyBites to browse verified bakers in Dubai who specialise in smash cakes. Compare galleries, read reviews, and message bakers directly to order.",
      },
      {
        q: "Are the smash cake bakers on FindMyBites verified?",
        a: "Yes. Every baker on FindMyBites is reviewed before their listing goes live. Look for the verified badge and real customer reviews.",
      },
    ],
    related: [
      { label: "Wedding Cakes Dubai", slug: "wedding-cakes-dubai" },
      { label: "Catering Dubai", slug: "catering-dubai" },
      { label: "Kids Party Dubai", slug: "kids-party-dubai" },
    ],
    otherCities: [],
  },
];

const KEYWORD_PAGE_MAP = new Map(KEYWORD_PAGES.map((p) => [p.slug, p]));

export function getKeywordPage(slug: string): KeywordPage | undefined {
  return KEYWORD_PAGE_MAP.get(slug);
}

export function generateKeywordMetadata(page: KeywordPage): Metadata {
  const title = `${page.keyword} in ${page.location} | FindMyBites`;
  const description = `Find the best ${page.keyword.toLowerCase()} in ${page.location}. Compare prices, read reviews and book directly. Free to enquire — no commission.`;
  const url = `https://www.findmybites.com/${page.slug}`;

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
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Build JSON-LD structured data for a keyword landing page. */
export function buildKeywordJsonLd(
  page: KeywordPage,
  vendors: any[]
): Record<string, any>[] {
  const url = `https://www.findmybites.com/${page.slug}`;
  const ecoLabel = page.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty";
  const ecoSlug = page.ecosystem === "FINDMYBITES" ? "findmybites" : "pimpmyparty";

  const out: Record<string, any>[] = [];

  // BreadcrumbList
  out.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.findmybites.com" },
      { "@type": "ListItem", position: 2, name: ecoLabel, item: `https://www.findmybites.com/${ecoSlug}` },
      { "@type": "ListItem", position: 3, name: `${page.keyword} in ${page.location}`, item: url },
    ],
  });

  // ItemList of LocalBusiness vendors
  if (vendors.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${page.keyword} in ${page.location}`,
      itemListElement: vendors.slice(0, 20).map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: v.name,
          url: `https://www.findmybites.com/vendor/${v.slug}`,
          telephone: v.whatsapp ?? undefined,
          image: v.heroImage ?? undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: v.city,
            addressCountry: v.countryCode ?? undefined,
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
    });
  }

  // FAQPage
  out.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  return out;
}

export interface KeywordVendor {
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

/**
 * Fetch vendors matching a keyword page's ecosystem + category + city.
 * Mirrors the query pattern used in the [ecosystem] route.
 */
export async function fetchKeywordVendors(
  page: KeywordPage
): Promise<{ vendors: KeywordVendor[]; total: number }> {
  try {
    const migrated = migrateCategory(page.category);
    const where = {
      ecosystem: page.ecosystem,
      approved: true,
      city: { contains: page.city, mode: "insensitive" as const },
      OR: [{ category: migrated }, { category: page.category }],
    };

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
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
      }),
      db.vendor.count({ where }),
    ]);

    return { vendors: vendors as KeywordVendor[], total };
  } catch {
    // DB unavailable — return empty so the page still renders with FAQ + content
    return { vendors: [], total: 0 };
  }
}

/** Title-case a city/country name for display ("dubai" → "Dubai"). */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
