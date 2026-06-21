"use client";

import * as React from "react";
import Link from "next/link";
import {
  Navigation,
  MapPin,
  Star,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useNearMe } from "@/hooks/use-near-me";
import { useMarketplace } from "@/lib/store";
import { CATEGORIES, CURRENCY_SYMBOLS } from "@/lib/constants";
import { countryCodeToFlag } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NearVendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  city: string;
  state: string | null;
  country: string;
  countryCode: string;
  rating: number;
  reviewCount: number;
  heroImage: string;
  tagline: string;
  basePrice: number;
  currency: string;
  featured: boolean;
  verified: boolean;
  distance: number;
}

const RADII = [5, 10, 25, 50, 100];

export function NearMePageClient() {
  const { location, loading, error, requestLocation, clearLocation } = useNearMe();
  const ecosystem = useMarketplace((s) => s.ecosystem);

  const [radius, setRadius] = React.useState(25);
  const [category, setCategory] = React.useState("all");
  const [minRating, setMinRating] = React.useState(0);
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  const [vendors, setVendors] = React.useState<NearVendor[]>([]);
  const [loadingVendors, setLoadingVendors] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Fetch vendors when location or filters change
  React.useEffect(() => {
    if (!location) {
      setVendors([]);
      return;
    }

    let cancelled = false;
    const fetchVendors = async () => {
      setLoadingVendors(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
          radius: String(radius),
          ecosystem,
          limit: "50",
        });
        if (category !== "all") params.set("category", category);
        if (minRating > 0) params.set("minRating", String(minRating));
        if (verifiedOnly) params.set("verified", "true");
        if (featuredOnly) params.set("featured", "true");

        const res = await fetch(`/api/vendors/near?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setVendors(data.vendors ?? []);
        }
      } catch {
        if (!cancelled) {
          setFetchError("Could not load nearby vendors. Please try again.");
        }
      } finally {
        if (!cancelled) setLoadingVendors(false);
      }
    };

    fetchVendors();
    return () => {
      cancelled = true;
    };
  }, [location, radius, category, minRating, verifiedOnly, featuredOnly, ecosystem]);

  // Auto-request location on mount if not already set
  React.useEffect(() => {
    if (!location && !loading && !error) {
      requestLocation();
    }
  }, [location, loading, error, requestLocation]);

  const cats = CATEGORIES.filter((c) => c.ecosystem === ecosystem);

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Header */}
      <header className="border-b border-black/10 bg-white px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <Navigation className="size-6 text-brand" />
            <h1 className="text-[24px] font-bold tracking-tight">Vendors Near Me</h1>
          </div>
          <p className="mt-2 text-[14px] text-black/60">
            Discover food and event vendors closest to your current location.
            {location && (
              <span className="ml-1 text-brand">
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Location status */}
        {!location && !loading && !error && (
          <div className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-center">
            <Navigation className="mx-auto size-10 text-brand" />
            <p className="mt-3 text-[15px] font-medium">Find vendors near you</p>
            <p className="mt-1 text-[13px] text-black/50">
              We'll use your location to find the closest vendors.
            </p>
            <button
              onClick={requestLocation}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Navigation className="size-4" />
              Allow Location Access
            </button>
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-dashed border-black/15 bg-white p-8 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-brand" />
            <p className="mt-3 text-[14px] text-black/60">Getting your location…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-6 text-center">
            <AlertCircle className="mx-auto size-8 text-amber-500" />
            <p className="mt-3 text-[14px] font-medium text-amber-700">{error}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={requestLocation}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium hover:bg-black/5"
              >
                Browse All Vendors
              </Link>
            </div>
          </div>
        )}

        {location && (
          <>
            {/* Filters bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* Radius selector */}
              <div className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2">
                <span className="text-[12px] font-medium text-black/50">Radius:</span>
                {RADII.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                      radius === r
                        ? "bg-brand text-white"
                        : "text-black/60 hover:bg-black/5"
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium hover:bg-black/5"
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
              </button>

              {/* Clear location */}
              <button
                onClick={() => {
                  clearLocation();
                  setVendors([]);
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-black/60 hover:bg-black/5"
              >
                <X className="size-3.5" />
                Clear Location
              </button>
            </div>

            {/* Expandable filters */}
            {showFilters && (
              <div className="mb-4 rounded-xl border border-black/10 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Category */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-black/50">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="all">All Categories</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Min rating */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-black/50">Min Rating</label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={3}>3+ Stars</option>
                      <option value={4}>4+ Stars</option>
                      <option value={4.5}>4.5+ Stars</option>
                    </select>
                  </div>

                  {/* Verified */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-black/50">Verified Only</label>
                    <label className="flex h-9 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="size-4 rounded"
                      />
                      <span className="text-sm">Show verified vendors only</span>
                    </label>
                  </div>

                  {/* Featured */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-black/50">Featured Only</label>
                    <label className="flex h-9 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                        className="size-4 rounded"
                      />
                      <span className="text-sm">Show featured vendors only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {loadingVendors ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto size-8 animate-spin text-brand" />
                <p className="mt-3 text-[14px] text-black/60">Finding vendors near you…</p>
              </div>
            ) : fetchError ? (
              <div className="py-16 text-center">
                <AlertCircle className="mx-auto size-8 text-red-500" />
                <p className="mt-3 text-[14px] font-medium">{fetchError}</p>
                <button
                  onClick={() => {
                    if (location) {
                      setVendors([]);
                      // Trigger re-fetch by toggling a state
                      setRadius((r) => r);
                    }
                  }}
                  className="mt-3 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium hover:bg-black/5"
                >
                  Retry
                </button>
              </div>
            ) : vendors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
                <MapPin className="mx-auto size-10 text-black/20" />
                <p className="mt-3 text-[15px] font-medium">No vendors found within {radius} km</p>
                <p className="mt-1 text-[13px] text-black/40">
                  Try increasing your search radius, or be the first to list your business here.
                </p>
                <button
                  onClick={() => setRadius(Math.min(100, radius * 2))}
                  className="mt-4 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white"
                >
                  Expand to {Math.min(100, radius * 2)} km
                </button>
              </div>
            ) : (
              <>
                {/* Result count */}
                <p className="mb-3 text-[13px] text-black/50">
                  {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"} within {radius} km of your location
                </p>

                {/* Vendor grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {vendors.map((v, i) => (
                    <NearVendorCard key={v.id} vendor={v} rank={i + 1} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function NearVendorCard({ vendor, rank }: { vendor: NearVendor; rank: number }) {
  const symbol = CURRENCY_SYMBOLS[vendor.currency as string] ?? vendor.currency ?? "$";
  const ecoColor = vendor.ecosystem === "FINDMYBITES" ? "#D85A30" : "#7F77DD";

  return (
    <Link
      href={vendor?.slug ? `/vendor/${vendor.slug}` : "#"}
      className="group overflow-hidden rounded-xl border border-black/10 bg-white transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {vendor.heroImage ? (
          <img
            src={vendor.heroImage}
            alt={vendor.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: ecoColor + "15" }}>
            <MapPin className="size-8" style={{ color: ecoColor }} />
          </div>
        )}
        {/* Rank badge */}
        <span
          className="absolute left-2 top-2 grid size-7 place-items-center rounded-full text-[11px] font-bold text-white"
          style={{ background: ecoColor }}
        >
          {rank}
        </span>
        {/* Distance badge */}
        <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-brand shadow-sm">
          📍 {vendor.distance} km
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h3 className="truncate text-[14px] font-bold">{vendor.name}</h3>
          {vendor.verified && (
            <span className="shrink-0 text-[10px]" style={{ color: ecoColor }}>✓</span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-black/50">{vendor.tagline || vendor.category}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px]">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
            <span className="text-black/40">({vendor.reviewCount})</span>
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-black/50">
            <MapPin className="size-3" />
            {vendor.city}
          </span>
        </div>
        {vendor.basePrice > 0 && (
          <p className="mt-1.5 text-[12px] font-bold" style={{ color: ecoColor }}>
            from {symbol}{vendor.basePrice.toLocaleString("en-US")}
          </p>
        )}
      </div>
    </Link>
  );
}
