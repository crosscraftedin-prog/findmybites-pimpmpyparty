import * as React from "react";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { RecentlyViewedSection, CompareBar } from "@/components/marketplace/recently-viewed-compare";
import { VendorComparison } from "@/components/marketplace/vendor-comparison";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { LocationBanner } from "@/components/marketplace/location-banner";
import { PremiumHero } from "@/components/marketplace/premium-hero";
import { TrustStrip } from "@/components/marketplace/trust-strip";
import { NearMeSection } from "@/components/marketplace/near-me-section";
import { CategoriesSection } from "@/components/marketplace/categories-section";
import { FeaturedSection } from "@/components/marketplace/featured-section";
import { TrendingProductsSection } from "@/components/marketplace/trending-products-section";
import { PopularCitiesSection } from "@/components/marketplace/popular-cities-section";
import { RecentVendorsSection } from "@/components/marketplace/recent-vendors-section";
import { VerifiedVendorsSection } from "@/components/marketplace/verified-vendors-section";
import { ReviewsCarousel } from "@/components/marketplace/reviews-carousel";
import { EventTypeSection } from "@/components/marketplace/event-type-section";
import { InspirationGallery } from "@/components/marketplace/inspiration-gallery";
import { BrowseSection } from "@/components/marketplace/browse-section";
import { HowItWorks } from "@/components/marketplace/how-it-works";
import { AnimatedCounters } from "@/components/marketplace/animated-counters";
import { VendorCTA } from "@/components/marketplace/vendor-cta";
import { VendorModal } from "@/components/marketplace/vendor-modal";
import { ListVendorDialog } from "@/components/marketplace/list-vendor-dialog";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { PendingVendorBanner } from "@/components/marketplace/pending-vendor-banner";

// ── Force dynamic rendering (data changes frequently) ──
export const dynamic = "force-dynamic";
export const revalidate = 30; // ISR: revalidate every 30 seconds

// ── Server-side data fetching ────────────────────────────────────────────
// Fetch ALL homepage data in parallel on the server.
// This eliminates the 12 client-side API waterfall requests.
async function getHomepageData() {
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };

  const [
    stats,
    categories,
    featuredVendors,
    trendingProducts,
    popularCities,
    recentVendors,
    verifiedVendors,
    recentReviews,
    inspirationVendors,
  ] = await Promise.all([
    safe(async () => {
      const [totalVendors, totalReviews, totalBookings, findmybitesCount, pimpmpypartyCount, continentGroups, categoryGroups, avgAgg] = await Promise.all([
        db.vendor.count(),
        db.review.count(),
        db.booking.count().catch(() => 0),
        db.vendor.count({ where: { ecosystem: "FINDMYBITES" } }),
        db.vendor.count({ where: { ecosystem: "PIMPMYPARTY" } }),
        db.vendor.groupBy({ by: ["continent"], _count: { _all: true } }),
        db.vendor.groupBy({ by: ["ecosystem", "category"], _count: { _all: true } }),
        db.vendor.aggregate({ _avg: { rating: true } }),
      ]);
      return {
        totalVendors, totalReviews, totalBookings,
        countries: new Set<string>().size,
        findmybitesCount, pimpmpypartyCount,
        avgRating: avgAgg._avg.rating ?? 0,
        continents: continentGroups.map((g) => ({ continent: g.continent, count: g._count._all })),
        categories: categoryGroups.map((g) => ({ ecosystem: g.ecosystem, category: g.category, count: g._count._all })),
      };
    }, null),

    safe(async () => {
      return await db.category.findMany({
        where: { ecosystem: "FINDMYBITES", active: true },
        orderBy: { sortOrder: "asc" },
        take: 8,
        select: { id: true, label: true, ecosystem: true, icon: true, image: true, accent: true, description: true },
      });
    }, []),

    safe(async () => {
      const vendors = await db.vendor.findMany({
        where: { approved: true, featured: true, ecosystem: "FINDMYBITES" },
        select: { id: true, name: true, slug: true, ecosystem: true, category: true, city: true, country: true, countryCode: true, tagline: true, description: true, rating: true, reviewCount: true, priceRange: true, basePrice: true, currency: true, featured: true, verified: true, tags: true, heroImage: true, avatarImage: true, whatsapp: true, responseTime: true, yearsActive: true, completedBookings: true, deliveryAvailable: true, pickupAvailable: true },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: 8,
      });
      return vendors.map((v) => ({ ...v, tags: parseJsonArray<string>(v.tags) }));
    }, []),

    safe(async () => {
      const products = await db.product.findMany({
        where: { isAvailable: true, status: "active", forceHidden: false, vendor: { approved: true } },
        select: { id: true, name: true, slug: true, description: true, price: true, offerPrice: true, currency: true, image: true, images: true, packageType: true, isFeatured: true, vendor: { select: { id: true, name: true, slug: true, city: true, avatarImage: true } } },
        orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
        take: 14,
      });
      return products.map((p) => ({
        ...p,
        images: p.images ? parseJsonArray<string>(p.images) : [],
      }));
    }, []),

    safe(async () => {
      const cities = await db.vendor.findMany({
        where: { approved: true, ecosystem: "FINDMYBITES" },
        select: { city: true, country: true, countryCode: true },
      });
      const cityMap = new Map<string, { city: string; country: string; countryCode: string; count: number }>();
      for (const c of cities) {
        const key = c.city;
        if (!cityMap.has(key)) cityMap.set(key, { city: c.city, country: c.country, countryCode: c.countryCode ?? "", count: 0 });
        cityMap.get(key)!.count++;
      }
      return Array.from(cityMap.values()).sort((a, b) => b.count - a.count).slice(0, 12);
    }, []),

    safe(async () => {
      const vendors = await db.vendor.findMany({
        where: { approved: true, ecosystem: "FINDMYBITES" },
        select: { id: true, name: true, slug: true, ecosystem: true, category: true, city: true, country: true, countryCode: true, tagline: true, rating: true, reviewCount: true, priceRange: true, basePrice: true, currency: true, featured: true, verified: true, tags: true, heroImage: true, avatarImage: true, whatsapp: true, responseTime: true, yearsActive: true, completedBookings: true, deliveryAvailable: true, pickupAvailable: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      });
      return vendors.map((v) => ({ ...v, tags: parseJsonArray<string>(v.tags) }));
    }, []),

    safe(async () => {
      const vendors = await db.vendor.findMany({
        where: { approved: true, verified: true },
        select: { id: true, name: true, slug: true, ecosystem: true, category: true, city: true, country: true, countryCode: true, tagline: true, rating: true, reviewCount: true, priceRange: true, basePrice: true, currency: true, featured: true, verified: true, tags: true, heroImage: true, avatarImage: true, whatsapp: true, responseTime: true, yearsActive: true, completedBookings: true, deliveryAvailable: true, pickupAvailable: true },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: 10,
      });
      return vendors.map((v) => ({ ...v, tags: parseJsonArray<string>(v.tags) }));
    }, []),

    safe(async () => {
      return await db.review.findMany({
        where: { vendor: { approved: true } },
        select: { id: true, author: true, avatar: true, rating: true, comment: true, eventDate: true, createdAt: true, vendor: { select: { id: true, name: true, slug: true, city: true, avatarImage: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    }, []),

    safe(async () => {
      const vendors = await db.vendor.findMany({
        where: { approved: true, featured: true, ecosystem: "PIMPMYPARTY" },
        select: { id: true, name: true, slug: true, ecosystem: true, category: true, city: true, country: true, tagline: true, rating: true, reviewCount: true, heroImage: true, avatarImage: true },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: 20,
      });
      return vendors;
    }, []),
  ]);

  return { stats, categories, featuredVendors, trendingProducts, popularCities, recentVendors, verifiedVendors, recentReviews, inspirationVendors };
}

/**
 * Homepage — FindMyBites × PimpMyParty
 * Premium, conversion-focused marketplace landing.
 *
 * Now a Server Component — fetches ALL data server-side in parallel.
 * Client components receive data as props (no client-side API waterfall).
 */
export default async function Home() {
  const data = await getHomepageData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Marketplace",
    name: "FindMyBites × PimpMyParty",
    url: "https://www.findmybites.com",
    description: "The world's dual marketplace for food artisans and party professionals. Discover and book verified vendors across 6 continents.",
    areaServed: "Worldwide",
    knowsAbout: ["Food vendors", "Event planners", "Caterers", "Bakers", "Decorators", "Photographers", "DJs", "Venues"],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <LocationBanner />
      <PendingVendorBanner />
      <main id="main-content" className="flex-1">
        {data.stats && <PremiumHero stats={data.stats} categories={data.categories} />}
        <TrustStrip />
        {data.categories.length > 0 && <CategoriesSection categories={data.categories} />}
        {data.featuredVendors.length > 0 && <FeaturedSection vendors={data.featuredVendors} />}
        <NearMeSection />
        <BrowseSection />
        {data.recentVendors.length > 0 && <RecentVendorsSection vendors={data.recentVendors} />}
        {data.trendingProducts.length > 0 && <TrendingProductsSection products={data.trendingProducts} />}
        {data.popularCities.length > 0 && <PopularCitiesSection cities={data.popularCities} />}
        {data.stats && <AnimatedCounters stats={data.stats} />}
        <EventTypeSection />
        {data.inspirationVendors.length > 0 && <InspirationGallery vendors={data.inspirationVendors} />}
        {data.recentReviews.length > 0 && <ReviewsCarousel reviews={data.recentReviews} />}
        <HowItWorks />
        <VendorCTA />
      </main>
      <SiteFooter />
      <VendorModal />
      <ListVendorDialog />
      <SignInDialog />
      <HomepageClient compareIds={null} />
    </div>
  );
}

// ── Client-side wrapper for CompareBar + VendorComparison ────────────────
// These need client state (compareIds) but are the ONLY client logic on the page.
function HomepageClient({ compareIds: initial }: { compareIds: string[] | null }) {
  const [compareIds, setCompareIds] = React.useState<string[] | null>(initial);
  return (
    <>
      <CompareBar onCompare={(ids) => setCompareIds(ids)} />
      {compareIds && (
        <VendorComparison vendorIds={compareIds} onClose={() => setCompareIds(null)} />
      )}
    </>
  );
}
