"use client";

import * as React from "react";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { LocationBanner } from "@/components/marketplace/location-banner";
import { Hero } from "@/components/marketplace/hero";
import { StatsBar } from "@/components/marketplace/stats-bar";
import { NearMeSection } from "@/components/marketplace/near-me-section";
import { CategoriesSection } from "@/components/marketplace/categories-section";
import { FeaturedSection } from "@/components/marketplace/featured-section";
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
        <FeaturedSection />
        <BrowseSection />
        <WorldPresence />
        <HowItWorks />
        <BecomeVendor />
      </main>
      <SiteFooter />
      <VendorModal />
      <ListVendorDialog />
      <SignInDialog />
    </div>
  );
}
