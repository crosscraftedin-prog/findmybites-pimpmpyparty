"use client";

import * as React from "react";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
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
import { useMarketplace } from "@/lib/store";

/**
 * Homepage — FindMyBites × PimpMyParty
 * Premium, conversion-focused marketplace landing.
 *
 * Section order (8px spacing system, semantic HTML, one H1):
 *   1. PremiumHero       — headline + powerful search box + live stats
 *   2. TrustStrip        — 6 trust badges
 *   3. CategoriesSection — featured category cards
 *   4. FeaturedSection   — featured vendor cards (hover/zoom/shadow)
 *   5. NearMeSection     — geo-discovery
 *   6. BrowseSection (#explore) — main vendor grid
 *   7. RecentVendorsSection — newest joins (skeleton loaders)
 *   8. TrendingProductsSection — auto-hides if empty
 *   9. PopularCitiesSection — city cards
 *  10. AnimatedCounters  — global marketplace with animated numbers
 *  11. EventTypeSection  — PimpMyParty event types
 *  12. InspirationGallery — mosaic of vendor work
 *  13. ReviewsCarousel   — customer testimonials
 *  14. HowItWorks        — 3 steps
 *  15. VendorCTA         — strong vendor acquisition CTA
 *  16. SiteFooter        — expanded footer
 */
export default function Home() {
  useScrollToHash();
  const [compareIds, setCompareIds] = React.useState<string[] | null>(null);
  const openListVendor = useMarketplace((s) => s.openListVendor);

  // Auto-open onboarding dialog when ?list-vendor=1 is in the URL
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("list-vendor=1")) {
      openListVendor();
      // Clean the URL
      window.history.replaceState({}, "", "/");
    }
  }, [openListVendor]);

  // SEO structured data — Marketplace + Organization schema for rich results
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
        <PremiumHero />
        <TrustStrip />
        <CategoriesSection />
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
