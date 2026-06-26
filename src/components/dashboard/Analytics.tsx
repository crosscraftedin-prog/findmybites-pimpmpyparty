"use client";

import * as React from "react";
import {
  Eye,
  Users,
  MessageSquare,
  Search,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

type DateRange = "7d" | "30d" | "3m" | "all";

export function Analytics({ vendor }: { vendor: Vendor }) {
  const [range, setRange] = React.useState<DateRange>("30d");

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight">Your Performance</h1>

      {/* Date range selector */}
      <div className="mb-6 flex gap-2">
        {[
          { id: "7d" as DateRange, label: "Last 7 days" },
          { id: "30d" as DateRange, label: "Last 30 days" },
          { id: "3m" as DateRange, label: "Last 3 months" },
          { id: "all" as DateRange, label: "All time" },
        ].map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              range === r.id
                ? "bg-brand text-brand-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Row 1: Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Eye} label="Profile Views" value="0" />
        <StatCard icon={Users} label="Unique Visitors" value="0" />
        <StatCard icon={MessageSquare} label="Enquiries" value="0" />
        <StatCard icon={Search} label="Search Appearances" value="0" />
      </div>

      {/* Row 2: Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Line chart placeholder */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold">Profile views over time</h2>
          <div className="flex h-48 items-end justify-between gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-brand/20"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Last 14 days
          </p>
        </div>

        {/* Pie/donut chart placeholder */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-bold">How customers found you</h2>
          <div className="flex items-center justify-center py-4">
            <div className="relative size-32">
              <div className="absolute inset-0 rounded-full border-8 border-brand" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">No data</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {[
              { label: "Search", color: "bg-brand" },
              { label: "Featured", color: "bg-amber-400" },
              { label: "Direct link", color: "bg-emerald-400" },
              { label: "Josh AI", color: "bg-purple-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className={cn("size-2.5 rounded-full", item.color)} />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top search terms table */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold">Top search terms that led to your profile</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-semibold">Search term</th>
                <th className="pb-2 pr-4 font-semibold">Appearances</th>
                <th className="pb-2 font-semibold">Clicks</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">{vendor.category.replace(/-/g, " ")} {vendor.city.toLowerCase()}</td>
                <td className="py-2 pr-4 tabular-nums">0</td>
                <td className="py-2 tabular-nums">0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No search data yet — start getting views to see insights here.
        </p>
      </div>

      {/* Row 4: Insights */}
      <div className="rounded-xl border border-brand-border bg-brand-soft p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="size-5 shrink-0 text-brand" />
          <div>
            <p className="text-sm font-semibold text-brand-soft-foreground">
              Josh&apos;s tip
            </p>
            <p className="mt-1 text-sm text-foreground/80">
              Vendors with gallery photos get 3x more enquiries. Add photos to boost your visibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-5 text-muted-foreground" />
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}
