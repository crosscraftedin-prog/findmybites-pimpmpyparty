"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { CompareBar } from "@/components/marketplace/recently-viewed-compare";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { LocationBanner } from "@/components/marketplace/location-banner";
import { PremiumHero } from "@/components/marketplace/premium-hero";
import { TrustStrip } from "@/components/marketplace/trust-strip";
import { CategoriesSection } from "@/components/marketplace/categories-section";
import { PendingVendorBanner } from "@/components/marketplace/pending-vendor-banner";

// V24: Lazy-load ALL below-the-fold sections.
// These are not visible on initial render. Loading them dynamically
// defers their JS parsing/execution until after the above-the-fold
// content is interactive, improving LCP and INP.
const FeaturedSection = dynamic(() => import("@/components/marketplace/featured-section").then(m => ({ default: m.FeaturedSection })));
const NearMeSection = dynamic(() => import("@/components/marketplace/near-me-section").then(m => ({ default: m.NearMeSection })));
const BrowseSection = dynamic(() => import("@/components/marketplace/browse-section").then(m => ({ default: m.BrowseSection })));
const RecentVendorsSection = dynamic(() => import("@/components/marketplace/recent-vendors-section").then(m => ({ default: m.RecentVendorsSection })));
const TrendingProductsSection = dynamic(() => import("@/components/marketplace/trending-products-section").then(m => ({ default: m.TrendingProductsSection })));
const PopularCitiesSection = dynamic(() => import("@/components/marketplace/popular-cities-section").then(m => ({ default: m.PopularCitiesSection })));
const AnimatedCounters = dynamic(() => import("@/components/marketplace/animated-counters").then(m => ({ default: m.AnimatedCounters })));
const EventTypeSection = dynamic(() => import("@/components/marketplace/event-type-section").then(m => ({ default: m.EventTypeSection })));
const InspirationGallery = dynamic(() => import("@/components/marketplace/inspiration-gallery").then(m => ({ default: m.InspirationGallery })));
const ReviewsCarousel = dynamic(() => import("@/components/marketplace/reviews-carousel").then(m => ({ default: m.ReviewsCarousel })));
const HowItWorks = dynamic(() => import("@/components/marketplace/how-it-works").then(m => ({ default: m.HowItWorks })));
const VendorCTA = dynamic(() => import("@/components/marketplace/vendor-cta").then(m => ({ default: m.VendorCTA })));
const RecentlyViewedSection = dynamic(() => import("@/components/marketplace/recently-viewed-compare").then(m => ({ default: m.RecentlyViewedSection })));

// V23: Lazy-load heavy modals (not needed on initial render)
const VendorModal = dynamic(() => import("@/components/marketplace/vendor-modal").then(m => ({ default: m.VendorModal })), { ssr: false });
const ListVendorDialog = dynamic(() => import("@/components/marketplace/list-vendor-dialog").then(m => ({ default: m.ListVendorDialog })), { ssr: false });
const SignInDialog = dynamic(() => import("@/components/auth/sign-in-dialog").then(m => ({ default: m.SignInDialog })), { ssr: false });
const VendorComparison = dynamic(() => import("@/components/marketplace/vendor-comparison").then(m => ({ default: m.VendorComparison })), { ssr: false });

/**
 * Homepage — FindMyBites × PimpMyParty
 * Premium, conversion-focused marketplace landing.
 *
 * V24: Above-the-fold components are statically imported for immediate
 * rendering. Below-the-fold components are dynamically imported to
 * reduce initial JS bundle and improve Core Web Vitals.
 */
export default function Home() {
  useScrollToHash();
  const [compareIds, setCompareIds] = React.useState<string[] | null>(null);

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
      {/* Above the fold — static imports for immediate render */}
      <SiteHeader />
      <LocationBanner />
      <PendingVendorBanner />
      <main id="main-content" className="flex-1">
        <PremiumHero />
        <TrustStrip />
        <CategoriesSection />

        {/* Below the fold — dynamic imports for deferred loading */}
        <FeaturedSection />
        <NearMeSection />
        <BrowseSection />
        <RecentVendorsSection />
        <TrendingProductsSection />
        <PopularCitiesSection />
        <AnimatedCounters />
        <EventTypeSection />
        <InspirationGallery />
        <ReviewsCarousel />
        <RecentlyViewedSection />
        <HowItWorks />
        <VendorCTA />
      </main>
      <SiteFooter />
      <VendorModal />
      <ListVendorDialog />
      <SignInDialog />
      <CompareBar onCompare={(ids) => setCompareIds(ids)} />
      {compareIds && (
        <VendorComparison vendorIds={compareIds} onClose={() => setCompareIds(null)} />
      )}
    </div>
  );
}
