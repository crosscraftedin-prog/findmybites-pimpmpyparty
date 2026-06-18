"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LocateFixed,
  Loader2,
  MapPin,
  Navigation,
  Expand,
  X,
  Search,
  AlertCircle,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplace } from "@/lib/store";
import { useNearVendors } from "@/lib/queries";
import {
  detectUserLocation,
  geocodeToLocation,
  clearCachedLocation,
  type UserLocation,
} from "@/lib/geo";
import { countryCodeToFlag } from "@/lib/format";
import { getCategory } from "@/lib/constants";
import { CategoryIcon } from "./icon";
import { VendorImage } from "./vendor-image";
import { StarRating } from "./star-rating";
import { formatPrice } from "@/lib/format";
import type { VendorWithDistance } from "@/lib/types";

const RADII = [
  { km: 5, label: "5 km" },
  { km: 10, label: "10 km" },
  { km: 25, label: "25 km" },
  { km: 50, label: "50 km" },
  { km: 0, label: "Global" },
];

const SOURCE_LABEL: Record<UserLocation["source"], string> = {
  gps: "GPS",
  ip: "approximate (IP)",
  cached: "saved",
  manual: "manual",
};

export function NearMeSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const open = useMarketplace((s) => s.nearMeOpen);
  const setOpen = useMarketplace((s) => s.setNearMeOpen);
  const radius = useMarketplace((s) => s.nearRadius);
  const setRadius = useMarketplace((s) => s.setNearRadius);
  const openVendor = useMarketplace((s) => s.openVendor);

  const [location, setLocation] = React.useState<UserLocation | null>(null);
  const [detecting, setDetecting] = React.useState(false);
  const [reason, setReason] = React.useState<
    "denied" | "unavailable" | "gps-failed" | null
  >(null);
  const [manualQuery, setManualQuery] = React.useState("");
  const [manualSearching, setManualSearching] = React.useState(false);

  const { data, isLoading, isFetching } = useNearVendors(
    location?.lat ?? null,
    location?.lng ?? null,
    radius,
    ecosystem,
    open && !!location
  );

  const vendors = data?.vendors ?? [];
  const total = data?.total ?? 0;

  const detect = async () => {
    setDetecting(true);
    setReason(null);
    try {
      const { location: loc, reason: r } = await detectUserLocation();
      if (loc) {
        setLocation(loc);
        setOpen(true);
        if (r) setReason(r);
        if (r === "denied") {
          toast.info("Using your approximate location (GPS was denied).");
        }
      } else {
        setReason("unavailable");
        toast.error(
          "Couldn't detect your location. Enter your city manually below."
        );
        setOpen(true);
      }
    } finally {
      setDetecting(false);
    }
  };

  const onManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    setManualSearching(true);
    try {
      const loc = await geocodeToLocation(manualQuery.trim());
      if (loc) {
        setLocation(loc);
        setOpen(true);
        setReason(null);
        toast.success(`Showing vendors near ${manualQuery.trim()}.`);
      } else {
        toast.error("Couldn't find that place. Try a city name.");
      }
    } finally {
      setManualSearching(false);
    }
  };

  const onChangeLocation = () => {
    clearCachedLocation();
    setLocation(null);
    setReason(null);
    setManualQuery("");
  };

  return (
    <section id="near-me" className="scroll-mt-16 border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <LocateFixed className="size-4" />
              Near you
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Vendors close to you, anywhere on earth
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Share your location and we&apos;ll surface the closest food artisans
              and party pros — sorted by real-world distance, updated live as you
              expand the radius.
            </p>
          </div>

          {!open && (
            <Button
              onClick={detect}
              disabled={detecting}
              size="lg"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {detecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Detecting…
                </>
              ) : (
                <>
                  <LocateFixed className="size-4" />
                  Near Me
                </>
              )}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-8">
                {/* Location status bar */}
                <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Navigation className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {location ? (
                      <>
                        <p className="text-sm font-semibold">
                          Showing {ecosystem === "FINDMYBITES" ? "food" : "party"} vendors within{" "}
                          {radius === 0 ? "the whole world" : `${radius} km`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          📍{" "}
                          {location.label
                            ? location.label
                            : `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`}{" "}
                          · location via {SOURCE_LABEL[location.source]}
                          {reason === "denied" && " (GPS denied — using IP)"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Enter your city to find vendors near you
                      </p>
                    )}
                  </div>
                  {location && (
                    <button
                      onClick={onChangeLocation}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      <X className="size-3" />
                      Change
                    </button>
                  )}
                </div>

                {/* Manual location search (shown when no location yet, or after change) */}
                {!location && (
                  <form
                    onSubmit={onManualSearch}
                    className="mb-5 flex flex-col gap-2 sm:flex-row"
                  >
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={manualQuery}
                        onChange={(e) => setManualQuery(e.target.value)}
                        placeholder="Enter your city or address — e.g. Lisbon, Portugal"
                        className="h-11 rounded-full pl-10"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={manualSearching || !manualQuery.trim()}
                      className="h-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                    >
                      {manualSearching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      Search
                    </Button>
                  </form>
                )}

                {/* Radius toggle */}
                {location && (
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Radius:
                    </span>
                    {RADII.map((r) => (
                      <button
                        key={r.km}
                        onClick={() => setRadius(r.km)}
                        className={
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                          (radius === r.km
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-border bg-background hover:bg-accent")
                        }
                      >
                        {r.km === 0 && <Globe2 className="size-3" />}
                        {r.label}
                      </button>
                    ))}
                    {radius !== 0 && radius < 50 && (
                      <button
                        onClick={() => {
                          const next =
                            radius < 10 ? 10 : radius < 25 ? 25 : 50;
                          setRadius(next);
                        }}
                        className="ml-1 inline-flex items-center gap-1 rounded-full border border-dashed border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-soft-foreground transition-colors hover:bg-brand-soft"
                      >
                        <Expand className="size-3" />
                        Expand
                      </button>
                    )}
                  </div>
                )}

                {/* Results */}
                {location && (
                  <div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {isFetching && !isLoading ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" /> Updating…
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-foreground">
                            {total}
                          </span>{" "}
                          {total === 1 ? "vendor" : "vendors"}
                          {radius === 0
                            ? " worldwide"
                            : ` within ${radius} km`}
                        </>
                      )}
                    </p>

                    {isLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-72 rounded-2xl" />
                        ))}
                      </div>
                    ) : vendors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                        <div className="grid size-14 place-items-center rounded-full bg-muted">
                          <AlertCircle className="size-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                          No vendors this close yet
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                          Try expanding the radius — or switch to Global to see
                          top-rated vendors worldwide.
                        </p>
                        <div className="mt-4 flex gap-2">
                          {radius < 50 && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                const next =
                                  radius < 10 ? 10 : radius < 25 ? 25 : 50;
                                setRadius(next);
                              }}
                            >
                              <Expand className="size-4" />
                              Expand radius
                            </Button>
                          )}
                          <Button onClick={() => setRadius(0)}>
                            <Globe2 className="size-4" />
                            Show global
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                          {vendors.map((v, i) => (
                            <NearVendorCard
                              key={v.id}
                              vendor={v}
                              index={i}
                              onClick={() => openVendor(v.slug)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function NearVendorCard({
  vendor,
  index,
  onClick,
}: {
  vendor: VendorWithDistance;
  index: number;
  onClick: () => void;
}) {
  const cat = getCategory(vendor.category);
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-border hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <VendorImage
          src={vendor.heroImage}
          alt={vendor.name}
          accent={cat?.accent ?? "from-amber-400 to-orange-500"}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          categoryIcon={
            <CategoryIcon
              name={cat?.icon ?? "UtensilsCrossed"}
              className="size-14"
            />
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* distance badge — the key Near Me UI */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-brand-foreground shadow-md">
          <MapPin className="size-3" />
          {vendor.distance < 1
            ? `${Math.round(vendor.distance * 1000)} m away`
            : `${vendor.distance} km away`}
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          from {formatPrice(vendor.basePrice, vendor.currency)}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-bold leading-tight">
          {vendor.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {vendor.tagline}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {countryCodeToFlag(vendor.countryCode)} {vendor.city}
            {vendor.serviceRadiusKm
              ? ` · travels ${vendor.serviceRadiusKm}km`
              : ""}
          </span>
        </div>
        <div className="mt-2">
          <StarRating
            rating={vendor.rating}
            size={14}
            showValue
            count={vendor.reviewCount}
          />
        </div>
        {cat && (
          <div className="mt-3">
            <Badge variant="secondary" className="border-0">
              <CategoryIcon name={cat.icon} className="size-3" />
              {vendor.subcategory ?? cat.label}
            </Badge>
          </div>
        )}
      </div>
    </motion.button>
  );
}
