"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateVendorForm } from "@/components/marketplace/create-vendor-form";
import { useVendor } from "@/lib/queries";
import type { Vendor } from "@/lib/types";

interface MyListingProps {
  vendor: Vendor;
}

export function MyListing({ vendor }: MyListingProps) {
  const router = useRouter();
  const { data: fullVendor, isLoading } = useVendor(vendor.slug);

  if (isLoading || !fullVendor) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Editing
            </p>
            <p className="text-base font-bold">{vendor.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/vendor/${vendor.slug}`)}
            >
              <Eye className="size-4" />
              Preview Listing
            </Button>
          </div>
        </div>
      </div>

      {/* The form (in edit mode) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <CreateVendorForm
          ecosystem={vendor.ecosystem}
          onCreated={() => {}}
          editingVendor={fullVendor}
          onUpdated={() => {
            // form handles its own success state
          }}
        />
      </div>
    </div>
  );
}
