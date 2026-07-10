"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { VendorCard } from "./vendor-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vendor } from "@/lib/types";

export function RecentVendorsSection({ vendors: serverVendors }: { vendors?: any[] } = {}) {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
  const vendors = serverVendors;
    fetch(`/api/vendors?ecosystem=${ecosystem}&sort=newest&limit=8`)
      .then((r) => r.json())
      .then((d) => {
        setVendors(d.vendors ?? []);
        setLoading(false);
      })
      .catch(() => {
        setVendors([]);
        setLoading(false);
      });
  }, [ecosystem]);

  return (
    <section id="recent" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <Sparkles className="size-4" />
              Just joined
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {ecosystem === "FINDMYBITES" ? "Fresh faces, fresh flavours" : "New pros on the block"}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {ecosystem === "FINDMYBITES"
                ? "Discover the latest bakers, caterers and food artisans to join the marketplace."
                : "Meet the newest planners, decorators, DJs and venues ready to make your event unforgettable."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-muted-foreground">
            New vendors joining daily — be the first to discover them.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vendors.map((v, i) => (
              <VendorCard key={v.id} vendor={v} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
