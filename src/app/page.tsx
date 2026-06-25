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
import { useMarketplace } from "@/lib/store";

// Lazy-load heavy components that only open when user interacts (admin panel,
// vendor dashboard). These ship recharts + framer-motion (~500KB) which
// shouldn't be in the initial bundle for logged-out visitors.
const AdminPanel = React.lazy(() =>
  import("@/components/admin/admin-panel").then((m) => ({ default: m.AdminPanel }))
);
const VendorDashboard = React.lazy(() =>
  import("@/components/vendor-dashboard/vendor-dashboard").then((m) => ({ default: m.VendorDashboard }))
);

export default function Home() {
  const adminOpen = useMarketplace((s) => s.adminOpen);
  const vendorDashboardOpen = useMarketplace((s) => s.vendorDashboardOpen);

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
      {/* Lazy-loaded: only rendered when opened */}
      {adminOpen && (
        <React.Suspense fallback={null}>
          <AdminPanel />
        </React.Suspense>
      )}
      {vendorDashboardOpen && (
        <React.Suspense fallback={null}>
          <VendorDashboard />
        </React.Suspense>
      )}
    </div>
  );
}
