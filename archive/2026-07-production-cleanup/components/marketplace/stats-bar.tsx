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
import { Users, Globe2, Star, MessageSquareQuote } from "lucide-react";
import { useStats } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsBar() {
  const { data, isLoading } = useStats();

  const stats = [
    {
      icon: Users,
      label: "Verified vendors",
      value: data ? formatNumber(data.totalVendors) : "0",
      hint: "across both ecosystems",
    },
    {
      icon: Globe2,
      label: "Countries",
      value: data ? String(data.countries) : "0",
      hint: "on 6 continents",
    },
    {
      icon: Star,
      label: "Avg. rating",
      value: data ? data.avgRating.toFixed(1) : "0.0",
      hint: data ? `${data.totalReviews} reviews` : "loading…",
    },
    {
      icon: MessageSquareQuote,
      label: "Customer reviews",
      value: data ? formatNumber(data.totalReviews) : "0",
      hint: "verified & honest",
    },
  ];

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                
                
                
                
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <p className="text-xl font-extrabold tabular-nums tracking-tight">
                      {s.value}
                    </p>
                  )}
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
