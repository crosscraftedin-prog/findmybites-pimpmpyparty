"use client";

import * as React from "react";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { RecentlyViewedSection, CompareBar } from "@/components/marketplace/recently-viewed-compare";
import { VendorComparison } from "@/components/marketplace/vendor-comparison";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { LocationBanner } from "@/components/marketplace/location-banner";
import { Hero } from "@/components/marketplace/hero";
import { StatsBar } from "@/components/marketplace/stats-bar";
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
import { WorldPresence } from "@/components/marketplace/world-presence";
import { HowItWorks } from "@/components/marketplace/how-it-works";
import { BecomeVendor } from "@/components/marketplace/become-vendor";
import { VendorModal } from "@/components/marketplace/vendor-modal";
import { ListVendorDialog } from "@/components/marketplace/list-vendor-dialog";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { PendingVendorBanner } from "@/components/marketplace/pending-vendor-banner";

// Admin panel is now a full-page route at /admin — no modal overlay needed.

export default function Home() {
  // Scroll to the hash section when arriving from another route (e.g. /dashboard → /#explore)
  useScrollToHash();
  const [compareIds, setCompareIds] = React.useState<string[] | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <LocationBanner />
      <PendingVendorBanner />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <NearMeSection />
        <CategoriesSection />
        {/* PimpMyParty: browse by event type */}
        <EventTypeSection />
        <FeaturedSection />
        <VerifiedVendorsSection />
        {/* FindMyBites: trending products / PimpMyParty: trending services */}
        <TrendingProductsSection />
        {/* PimpMyParty: inspiration gallery (mosaic of vendor work) */}
        <InspirationGallery />
        <PopularCitiesSection />
        <RecentVendorsSection />
        <RecentlyViewedSection />
        <ReviewsCarousel />
        <BrowseSection />
        <WorldPresence />
        <HowItWorks />
        <BecomeVendor />
      </main>
      <SiteFooter />
      <VendorModal />
      <ListVendorDialog />
      <SignInDialog />
      {/* Comparison bar (sticky bottom) + modal */}
      <CompareBar onCompare={(ids) => setCompareIds(ids)} />
      {compareIds && (
        <VendorComparison vendorIds={compareIds} onClose={() => setCompareIds(null)} />
      )}
    </div>
  );
}
