"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useScrollToHash } from "@/hooks/use-scroll-to-hash";
import { RecentlyViewedSection, CompareBar } from "@/components/marketplace/recently-viewed-compare";
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
import { ReviewsCarousel } from "@/components/marketplace/reviews-carousel";
import { EventTypeSection } from "@/components/marketplace/event-type-section";
import { InspirationGallery } from "@/components/marketplace/inspiration-gallery";
import { BrowseSection } from "@/components/marketplace/browse-section";
import { HowItWorks } from "@/components/marketplace/how-it-works";
import { AnimatedCounters } from "@/components/marketplace/animated-counters";
import { VendorCTA } from "@/components/marketplace/vendor-cta";
import { PendingVendorBanner } from "@/components/marketplace/pending-vendor-banner";

// Lazy-load heavy modals that are NOT needed on initial page render.
// These are only opened when the user takes an action (click vendor card,
// click "List your business", click "Sign In", select 2+ vendors to compare).
// This reduces the initial JS bundle by ~1,680+ lines of component code.
const VendorModal = dynamic(() => import("@/components/marketplace/vendor-modal").then(m => ({ default: m.VendorModal })), { ssr: false });
const ListVendorDialog = dynamic(() => import("@/components/marketplace/list-vendor-dialog").then(m => ({ default: m.ListVendorDialog })), { ssr: false });
const SignInDialog = dynamic(() => import("@/components/auth/sign-in-dialog").then(m => ({ default: m.SignInDialog })), { ssr: false });
const VendorComparison = dynamic(() => import("@/components/marketplace/vendor-comparison").then(m => ({ default: m.VendorComparison })), { ssr: false });

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
