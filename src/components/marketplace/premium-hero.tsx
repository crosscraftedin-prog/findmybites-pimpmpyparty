"use client";

import * as React from "react";
import {
  Search, Sparkles, ShieldCheck, Globe2, ArrowRight, MapPin,
  Navigation, ChevronDown, Star, Users, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/lib/store";
import { useStats, useCategories } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

const HERO_CONTENT = {
  FINDMYBITES: {
    eyebrow: "FindMyBites · Food marketplace",
    image: "/hero-findmybites.png",
    gradient: "from-amber-700 via-orange-700 to-rose-800",
    overlay: "from-amber-950/85 via-orange-950/70 to-rose-950/40",
    chips: ["Wedding Cakes", "Birthday Cakes", "Home Bakers", "Caterers", "Desserts", "Food Trucks"],
    stat1Label: "Food vendors",
    stat2Label: "Countries",
  },
  PIMPMYPARTY: {
    eyebrow: "PimpMyParty · Event marketplace",
    image: "/hero-pimpmpyparty.png",
    gradient: "from-fuchsia-700 via-purple-700 to-pink-800",
    overlay: "from-fuchsia-950/85 via-purple-950/70 to-pink-950/40",
    chips: ["Event Planners", "Decorators", "DJs", "Photographers", "Venues", "Florists"],
    stat1Label: "Party pros",
    stat2Label: "Countries",
  },
};

export function PremiumHero({ stats: serverStats, categories: serverCats }: { stats?: any; categories?: any[] } = {}) {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const search = useMarketplace((s) => s.search);
  const setSearch = useMarketplace((s) => s.setSearch);
  const setSelectedCategory = useMarketplace((s) => s.setSelectedCategory);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { user: session } = useSupabaseSession();
  const content = HERO_CONTENT[ecosystem];
  const { data: stats } = useStats(); const finalStats = serverStats || stats;
  const { data: catData } = useCategories(ecosystem); const finalCats = serverCats || catData;

  const foodCount = stats?.findmybitesCount ?? 0;
  const partyCount = stats?.pimpmpypartyCount ?? 0;
  const totalCount = stats?.totalVendors ?? 0;
  const countries = stats?.countries ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;
  const totalBookings = stats?.totalBookings ?? 0;
  const ecoCount = ecosystem === "FINDMYBITES" ? foodCount : partyCount;

  const cats = catData?.categories ?? [];
  const [selectedCat, setSelectedCat] = React.useState<string>("");
  const [selectedLocation, setSelectedLocation] = React.useState<string>("");
  const [locating, setLocating] = React.useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCat) setSelectedCategory(selectedCat);
    else setSelectedCategory(null);
    if (search.trim()) setSearch(search);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNearMe = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocating(false);
          document.getElementById("near-me")?.scrollIntoView({ behavior: "smooth" });
        },
        () => {
          setLocating(false);
          document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
        },
        { timeout: 5000 }
      );
    } else {
      setLocating(false);
      document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleListClick = () => {
    if (session) openListVendor();
    else { setAuthIntent("list-vendor"); openAuthDialog(); }
  };

  const heroStats = [
    { value: totalCount, label: "Verified Vendors", suffix: "+", icon: Users },
    { value: countries, label: "Countries", suffix: "", icon: Globe2 },
    { value: totalReviews, label: "Reviews", suffix: "+", icon: Star },
    { value: totalBookings, label: "Bookings", suffix: "+", icon: CheckCircle2 },
  ];

  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      {/* Background */}
      <div className="absolute inset-0">
        <HeroBackground src={content.image} gradient={content.gradient} overlay={content.overlay} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        
          <div
            key={ecosystem}
            
            
            
            
            className="mx-auto max-w-4xl text-center"
          >
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Sparkles className="size-3.5" />
              {content.eyebrow}
            </span>

            {/* Headline */}
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
              Find the world&apos;s best{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                food artisans & party professionals
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
              Discover verified bakers, caterers, decorators, photographers, event planners and more across every continent.
            </p>

            {/* Premium Search Box */}
            <form
              onSubmit={onSearch}
              className="mx-auto mt-8 max-w-3xl"
            >
              <div className="flex flex-col gap-2 rounded-2xl border border-white/20 bg-white/95 p-2 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cakes, caterers, decorators, chefs, venues or cities…"
                    className="h-12 w-full rounded-xl bg-transparent pl-10 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                    aria-label="Search vendors"
                  />
                </div>

                {/* Category dropdown */}
                <div className="relative border-t border-border/50 sm:border-l sm:border-t-0">
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl bg-transparent px-3 pr-8 text-sm font-medium text-foreground focus:outline-none sm:w-40"
                    aria-label="Select category"
                  >
                    <option value="">All categories</option>
                    {cats.slice(0, 12).map((c) => (
                      <option key={c.id} value={c.id}>{c.label || c.id}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                {/* Location input */}
                <div className="relative border-t border-border/50 sm:border-l sm:border-t-0">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    placeholder="Location"
                    className="h-12 w-full rounded-xl bg-transparent pl-9 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none sm:w-32"
                    aria-label="Location"
                  />
                </div>

                {/* Search button */}
                <Button
                  type="submit"
                  className="h-12 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-foreground shadow-lg transition-transform hover:scale-[1.02] sm:px-8"
                >
                  <Search className="size-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>

              {/* Near Me + List your business */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleNearMe}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-60"
                >
                  <Navigation className="size-3.5" />
                  {locating ? "Locating…" : "Near Me"}
                </button>
                <button
                  type="button"
                  onClick={handleListClick}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <Sparkles className="size-3.5" />
                  List your business
                </button>
              </div>
            </form>

            {/* Popular searches */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-white/70">Popular:</span>
              {content.chips.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setSearch(c);
                    setSelectedCategory(null);
                    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Live stats */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {heroStats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    
                    
                    
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md"
                  >
                    <Icon className="size-4 text-white/80" />
                    <div className="text-left">
                      <p className="text-lg font-extrabold leading-none text-white sm:text-xl">
                        {s.value.toLocaleString()}{s.suffix}
                      </p>
                      <p className="text-[10px] text-white/70">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        
      </div>
    </section>
  );
}

function HeroBackground({ src, gradient, overlay }: { src: string; gradient: string; overlay: string }) {
  const [errored, setErrored] = React.useState(false);
  return (
    <div className="absolute inset-0">
      {!errored ? (
        <img src={src} alt="" onError={() => setErrored(true)} className="h-full w-full object-cover" loading="eager" />
      ) : (
        <div className={cn("h-full w-full bg-gradient-to-br", gradient)} />
      )}
      <div className={cn("absolute inset-0 bg-gradient-to-r", overlay)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
    </div>
  );
}
