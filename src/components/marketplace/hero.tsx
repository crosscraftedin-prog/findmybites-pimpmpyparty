"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, ShieldCheck, Globe2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/lib/store";
import { ECOSYSTEM_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HERO_CONTENT = {
  FINDMYBITES: {
    eyebrow: "FindMyBites · Food marketplace",
    title: "Taste the world's best,",
    titleAccent: "baked fresh & delivered",
    subtitle:
      "Discover artisan bakers, caterers, cake artists and private chefs across 6 continents. Compare, book and savour — all in one place.",
    image: "/hero-findmybites.png",
    chips: ["Wedding cakes", "Catering", "Sourdough", "Dessert tables", "Food trucks"],
    stat1: { value: "9,400+", label: "Food vendors" },
    stat2: { value: "62", label: "Countries" },
  },
  PIMPMYPARTY: {
    eyebrow: "PimpMyParty · Event marketplace",
    title: "Throw the party people,",
    titleAccent: "will never stop talking about",
    subtitle:
      "From planners and decorators to DJs, entertainers and stunning venues — find the pros to bring any celebration to life, anywhere on earth.",
    image: "/hero-pimpmpyparty.png",
    chips: ["Event planners", "Decorators", "DJs", "Entertainers", "Venues"],
    stat1: { value: "7,800+", label: "Party pros" },
    stat2: { value: "54", label: "Countries" },
  },
};

export function Hero() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const search = useMarketplace((s) => s.search);
  const setSearch = useMarketplace((s) => s.setSearch);
  const setSelectedCategory = useMarketplace((s) => s.setSelectedCategory);
  const content = HERO_CONTENT[ecosystem];

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  const exploreRef = React.useRef<HTMLDivElement>(null);

  return (
    <section
      id="top"
      ref={exploreRef}
      className={cn(
        "relative overflow-hidden",
        "border-b border-border"
      )}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <VendorImageBg src={content.image} ecosystem={ecosystem} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <motion.div
          key={ecosystem}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Sparkles className="size-3.5" />
            {content.eyebrow}
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            {content.title}{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
              {content.titleAccent}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            {content.subtitle}
          </p>

          {/* Search bar */}
          <form
            onSubmit={onSearch}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors, cities, cuisines…"
                className="h-14 w-full rounded-full border border-white/20 bg-white/95 pl-12 pr-4 text-sm font-medium text-foreground shadow-xl backdrop-blur placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-brand/30"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 rounded-full bg-brand px-8 text-base font-semibold text-brand-foreground shadow-xl hover:bg-brand/90"
            >
              Explore
              <ArrowRight className="size-4" />
            </Button>
          </form>

          {/* Quick chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-white/70">Popular:</span>
            {content.chips.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSearch(c);
                  setSelectedCategory(null);
                  document
                    .getElementById("explore")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">
                {content.stat1.value}
              </p>
              <p className="text-xs text-white/70">{content.stat1.label}</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">
                {content.stat2.value}
              </p>
              <p className="text-xs text-white/70">{content.stat2.label}</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">100%</p>
              <p className="flex items-center gap-1 text-xs text-white/80">
                <ShieldCheck className="size-4" />
                Verified vendors
              </p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">6</p>
              <p className="flex items-center gap-1 text-xs text-white/80">
                <Globe2 className="size-4" />
                Continents
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VendorImageBg({
  src,
  ecosystem,
}: {
  src: string;
  ecosystem: "FINDMYBITES" | "PIMPMYPARTY";
}) {
  const [errored, setErrored] = React.useState(false);
  const gradient =
    ecosystem === "FINDMYBITES"
      ? "from-amber-700 via-orange-700 to-rose-800"
      : "from-fuchsia-700 via-purple-700 to-pink-800";
  return (
    <div className="absolute inset-0">
      {!errored ? (
        <img
          src={src}
          alt=""
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={cn("h-full w-full bg-gradient-to-br", gradient)} />
      )}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          ecosystem === "FINDMYBITES"
            ? "from-amber-950/85 via-orange-950/70 to-rose-950/40"
            : "from-fuchsia-950/85 via-purple-950/70 to-pink-950/40"
        )}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
