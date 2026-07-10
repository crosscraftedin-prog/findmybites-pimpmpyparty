"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Star, MapPin, Loader2 } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrustBadges } from "./trust-badges";

/**
 * VerifiedVendorsSection — shows verified vendors on the homepage.
 * Fetches from /api/vendors?verified=true&limit=10
 */
export function VerifiedVendorsSection() {
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/vendors?verified=true&limit=10&sort=rating")
      .then(r => r.ok ? r.json() : { vendors: [] })
      .then(data => setVendors(data.vendors ?? []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <BadgeCheck className="size-5 text-blue-600" />
          <h2 className="text-xl font-bold">Verified Vendors</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-64 shrink-0 animate-pulse rounded-xl border border-border bg-card p-3">
              <div className="h-24 rounded-lg bg-muted" />
              <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
              <div className="mt-1 h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (vendors.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-5 text-blue-600" />
          <h2 className="text-xl font-bold">Verified Vendors</h2>
        </div>
        <Link href="/search?verified=true" className="text-sm font-medium text-brand hover:underline">
          View all →
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {vendors.map((v, i) => {
          const symbol = CURRENCY_SYMBOLS[v.currency as keyof typeof CURRENCY_SYMBOLS] ?? v.currency + " ";
          return (
            <div
              key={v.id}
              
              
              
            >
              <Link href={`/vendor/${v.slug}`} className="block w-64 shrink-0 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md">
                <div className="relative h-24 overflow-hidden rounded-lg bg-muted">
                  {v.heroImage ? (
                    <img src={v.heroImage} alt={v.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><BadgeCheck className="size-8 text-muted-foreground/30" /></div>
                  )}
                  <div className="absolute right-1.5 top-1.5">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-medium text-white">
                      <BadgeCheck className="size-2.5" /> Verified
                    </span>
                  </div>
                </div>
                <p className="mt-2 truncate text-sm font-bold">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.category.replace(/-/g, " ")}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="size-2.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{v.rating.toFixed(1)}</span>
                    <span>({v.reviewCount})</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="size-2.5" />{v.city}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-brand">
                  from {symbol}{v.basePrice.toLocaleString()}
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
