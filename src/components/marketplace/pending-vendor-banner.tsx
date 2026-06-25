"use client";

import * as React from "react";
import { Clock, Mail } from "lucide-react";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useVendorDashboard } from "@/lib/queries";

/**
 * Shows a banner below the nav bar when a vendor's listing is pending
 * approval or has been rejected. Only visible to the vendor who owns
 * the listing.
 */
export function PendingVendorBanner() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: vendorData, isLoading: vendorLoading } = useVendorDashboard(
    !!user && !sessionLoading
  );

  const vendor = vendorData?.vendors?.[0] ?? null;
  const isLoading = sessionLoading || (!!user && vendorLoading);

  if (isLoading || !user || !vendor) return null;

  // Only show for unapproved vendors
  if (vendor.approved) return null;

  return (
    <div className="border-b border-amber-300/40 bg-amber-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Clock className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">⏳ Your listing "{vendor.name}" is being reviewed.</span>{" "}
          We&apos;ll email you at {vendor.userEmail || "your registered email"} when it&apos;s approved.
        </p>
      </div>
    </div>
  );
}
