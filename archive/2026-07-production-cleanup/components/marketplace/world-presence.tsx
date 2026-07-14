/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

"use client";

import * as React from "react";
import { Globe2, MapPin, Users } from "lucide-react";
import { useStats } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const REGION_META: Record<string, { emoji: string; gradient: string }> = {
  Africa: { emoji: "🌍", gradient: "from-emerald-400 to-teal-500" },
  Asia: { emoji: "🌏", gradient: "from-rose-400 to-orange-500" },
  Europe: { emoji: "🌍", gradient: "from-sky-400 to-indigo-500" },
  "North America": { emoji: "🌎", gradient: "from-amber-400 to-orange-500" },
  "South America": { emoji: "🌎", gradient: "from-lime-400 to-emerald-500" },
  Oceania: { emoji: "🌏", gradient: "from-cyan-400 to-blue-500" },
  "Middle East": { emoji: "🌍", gradient: "from-amber-500 to-rose-500" },
};

export function WorldPresence() {
  const { data, isLoading } = useStats();
  const continents = data?.continents ?? [];
  const max = Math.max(1, ...continents.map((c) => c.count));

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          {/* Copy */}
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <Globe2 className="size-4" />
              Truly global
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              One platform, every continent
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              FindMyBites × PimpMyParty isn&apos;t regional. We connect customers
              and vendors across the entire planet — so whether you&apos;re in
              Nairobi, Naples or New York, the right pro is one tap away.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <MiniStat
                icon={<Users className="size-4" />}
                value={data ? String(data.totalVendors) : "—"}
                label="Vendors"
              />
              <MiniStat
                icon={<MapPin className="size-4" />}
                value={data ? String(data.countries) : "—"}
                label="Countries"
              />
              <MiniStat
                icon={<Globe2 className="size-4" />}
                value={data ? String(data.continents.length) : "—"}
                label="Continents"
              />
            </div>
          </div>

          {/* Continent breakdown */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Globe2 className="size-4 text-brand" />
              Vendors by continent
            </h3>
            <div className="mt-5 space-y-4">
              {isLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>
                  ))
                : continents
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((c, i) => {
                      const meta = REGION_META[c.continent] ?? {
                        emoji: "🌍",
                        gradient: "from-amber-400 to-orange-500",
                      };
                      const pct = Math.round((c.count / max) * 100);
                      return (
                        <div
                          key={c.continent}
                          
                          
                          
                          
                        >
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium">
                              <span>{meta.emoji}</span>
                              {c.continent}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {c.count} vendor{c.count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              
                              
                              
                              
                              className={cn(
                                "h-full rounded-full bg-gradient-to-r",
                                meta.gradient
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 text-center">
      <div className="mx-auto mb-1 grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </div>
      <p className="text-xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
