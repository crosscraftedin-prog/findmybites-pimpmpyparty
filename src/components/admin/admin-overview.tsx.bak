"use client";

import * as React from "react";
import {
  Store,
  CalendarCheck,
  Star,
  Users,
  Clock,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useAdminStats } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, countryCodeToFlag } from "@/lib/format";
import { ECOSYSTEM_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AdminOverview() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { totals } = data;

  const stats = [
    {
      icon: Store,
      label: "Vendors",
      value: totals.vendors,
      accent: "bg-amber-500",
    },
    {
      icon: Star,
      label: "Reviews",
      value: totals.reviews,
      accent: "bg-rose-500",
    },
    {
      icon: CalendarCheck,
      label: "Bookings",
      value: totals.bookings,
      accent: "bg-fuchsia-500",
    },
    {
      icon: Clock,
      label: "Pending",
      value: totals.pendingBookings,
      accent: "bg-orange-500",
    },
    {
      icon: TrendingUp,
      label: "Confirmed",
      value: totals.confirmedBookings,
      accent: "bg-emerald-500",
    },
    {
      icon: Star,
      label: "Avg rating",
      value: totals.avgRating.toFixed(1),
      accent: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div
                className={cn(
                  "mb-2 grid size-9 place-items-center rounded-xl text-white",
                  s.accent
                )}
              >
                <Icon className="size-4.5" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Vendors by ecosystem */}
        <ChartCard title="Vendors by ecosystem">
          <div className="space-y-3">
            {data.vendorsByEcosystem.map((e) => {
              const pct = totals.vendors
                ? Math.round((e.count / totals.vendors) * 100)
                : 0;
              const meta = ECOSYSTEM_META[e.ecosystem as keyof typeof ECOSYSTEM_META];
              return (
                <div key={e.ecosystem}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {meta?.label ?? e.ecosystem}
                    </span>
                    <span className="text-muted-foreground">
                      {e.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        meta?.gradient ?? "from-amber-500 to-orange-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Bookings by status */}
        <ChartCard title="Bookings by status">
          <div className="space-y-3">
            {data.bookingsByStatus.map((b) => {
              const pct = totals.bookings
                ? Math.round((b.count / totals.bookings) * 100)
                : 0;
              const color =
                b.status === "confirmed"
                  ? "bg-emerald-500"
                  : b.status === "declined"
                    ? "bg-rose-500"
                    : "bg-amber-500";
              return (
                <div key={b.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{b.status}</span>
                    <span className="text-muted-foreground">
                      {b.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Vendors by continent */}
        <ChartCard title="Vendors by continent">
          <div className="grid grid-cols-2 gap-2">
            {data.vendorsByContinent.map((c) => (
              <div
                key={c.continent}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin className="size-3 text-brand" />
                  {c.continent}
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Top categories */}
        <ChartCard title="Top categories">
          <div className="space-y-2">
            {data.vendorsByCategory.slice(0, 6).map((c) => {
              const max = data.vendorsByCategory[0]?.count || 1;
              const pct = Math.round((c.count / max) * 100);
              return (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-xs font-medium capitalize">
                    {c.category.replace(/-/g, " ")}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
                    {c.count}
                  </span>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Recent bookings">
          <ul className="space-y-3">
            {data.recentBookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.eventType} · {b.vendorName}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    b.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : b.status === "declined"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                  )}
                >
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Recent vendors">
          <ul className="space-y-3">
            {data.recentVendors.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground text-xs font-bold">
                  {v.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{v.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {countryCodeToFlag(
                      ECOSYSTEM_META[v.ecosystem as keyof typeof ECOSYSTEM_META]
                        ? v.ecosystem === "FINDMYBITES"
                          ? "FMB"
                          : "PMP"
                        : ""
                    )}{" "}
                    {v.city}, {v.country} · {timeAgo(v.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-soft-foreground">
                  {ECOSYSTEM_META[v.ecosystem as keyof typeof ECOSYSTEM_META]?.short}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
