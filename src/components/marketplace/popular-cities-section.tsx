"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { countryCodeToFlag } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PopularCity {
  city: string;
  country: string;
  countryCode: string;
  continent: string;
  count: number;
  topImage: string | null;
}

export function PopularCitiesSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const [cities, setCities] = React.useState<PopularCity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const setSearch = useMarketplace((s) => s.setSearch);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/cities/popular?ecosystem=${ecosystem}&limit=12&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        setCities(d.cities ?? []);
        setLoading(false);
      })
      .catch(() => {
        setCities([]);
        setLoading(false);
      });
  }, [ecosystem]);

  const handlePick = (city: string) => {
    setSearch(city);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="cities" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Popular locations
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {ecosystem === "FINDMYBITES" ? "Bites near you" : "Parties near you"}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Explore vendors in the world's most vibrant food and event destinations.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/2] rounded-2xl" />
              ))
            : cities.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                City data loading — check back soon.
              </p>
            ) : (
              cities.map((c, i) => (
                <motion.button
                  key={`${c.city}-${c.country}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  onClick={() => handlePick(c.city)}
                  className="group relative flex aspect-[3/2] flex-col overflow-hidden rounded-2xl border border-border text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Background image or gradient */}
                  {c.topImage ? (
                    <img
                      src={c.topImage}
                      alt={c.city}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      ecosystem === "FINDMYBITES"
                        ? "from-amber-400 via-orange-400 to-rose-400"
                        : "from-fuchsia-400 via-purple-400 to-pink-400"
                    )} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="relative mt-auto p-4 text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{countryCodeToFlag(c.countryCode)}</span>
                      <h3 className="text-lg font-bold leading-tight">{c.city}</h3>
                    </div>
                    <p className="text-xs text-white/80">{c.country}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/90">
                      <Users className="size-3" />
                      {c.count} {c.count === 1 ? "vendor" : "vendors"}
                    </p>
                  </div>
                </motion.button>
              ))
            )}
        </div>
      </div>
    </section>
  );
}
