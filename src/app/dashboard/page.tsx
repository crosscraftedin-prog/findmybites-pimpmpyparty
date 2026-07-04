"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useVendorDashboard } from "@/lib/queries";
import { SiteHeader } from "@/components/marketplace/site-header";
import { LocationBanner } from "@/components/marketplace/location-banner";
import { Sidebar, type DashboardTab } from "@/components/dashboard/Sidebar";
import { Overview } from "@/components/dashboard/Overview";
import { SuccessCenter } from "@/components/success-center/success-center";
import { MyListing } from "@/components/dashboard/MyListing";
import { Products } from "@/components/dashboard/Products";
import { Enquiries } from "@/components/dashboard/Enquiries";
import { Availability } from "@/components/dashboard/Availability";
import { Analytics } from "@/components/dashboard/Analytics";
import { MarketingCenter } from "@/components/marketing/marketing-center";
import { GrowthManager } from "@/components/growth-manager/growth-manager";
import { SupportCenter } from "@/components/support/support-center";
import { PlanBilling } from "@/components/dashboard/PlanBilling";
import { Settings } from "@/components/dashboard/Settings";
import { Messages } from "@/components/dashboard/Messages";
import { Notifications } from "@/components/dashboard/Notifications";
import { VendorOnboarding } from "@/components/dashboard/vendor-onboarding";

/**
 * /dashboard — Protected vendor dashboard.
 *
 * Auth guard: if not logged in → redirect to homepage.
 * If logged in but no vendor listing → show "no business" state.
 * If logged in with a vendor listing → show full dashboard with sidebar nav.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { session, user, loading: sessionLoading } = useSupabaseSession();
  const { data: vendorData, isLoading: vendorLoading } = useVendorDashboard(
    !!session && !sessionLoading
  );

  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview");

  // Auth guard: redirect to homepage if not logged in
  React.useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const vendors = vendorData?.vendors ?? [];
  const vendor = vendors[0] ?? null;
  const bookings = vendorData?.bookings ?? [];

  // Loading state
  if (sessionLoading || vendorLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in (redirecting)
  if (!session || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Logged in but no vendor listing
  if (!vendor) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold">No business yet</h1>
          <p className="max-w-md text-muted-foreground">
            You don&apos;t have a vendor listing yet. List your business to get
            started.
          </p>
          <button
            onClick={() => router.push("/")}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            List your business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <LocationBanner />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <Sidebar
          vendor={vendor}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userEmail={user.email ?? ""}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <VendorOnboarding vendorId={vendor.id} onNavigate={setActiveTab} />
              <SuccessCenter vendor={vendor} onNavigate={setActiveTab} />
            </div>
          )}
          {activeTab === "listing" && <MyListing vendor={vendor} />}
          {activeTab === "products" && <Products vendor={vendor} />}
          {activeTab === "enquiries" && <Enquiries bookings={bookings} />}
          {activeTab === "messages" && <Messages vendorId={vendor.id} />}
          {activeTab === "availability" && <Availability vendorId={vendor.id} />}
          {activeTab === "analytics" && <Analytics vendor={vendor} />}
          {activeTab === "growth-manager" && <GrowthManager vendor={vendor} onNavigate={setActiveTab} />}
          {activeTab === "marketing" && <MarketingCenter vendor={vendor} />}
          {activeTab === "billing" && <PlanBilling vendor={vendor} />}
          {activeTab === "support" && <SupportCenter vendor={vendor} />}
          {activeTab === "settings" && <Settings vendor={vendor} userEmail={user.email ?? ""} />}
        </main>
      </div>
    </div>
  );
}
