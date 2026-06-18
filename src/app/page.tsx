"use client";

import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
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
import { AdminPanel } from "@/components/admin/admin-panel";
import { VendorDashboard } from "@/components/vendor-dashboard/vendor-dashboard";
import { SignInDialog } from "@/components/auth/sign-in-dialog";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
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
      <AdminPanel />
      <VendorDashboard />
      <SignInDialog />
    </div>
  );
}
