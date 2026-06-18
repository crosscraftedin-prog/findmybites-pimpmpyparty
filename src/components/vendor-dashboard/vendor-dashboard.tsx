"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Store,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Star,
  TrendingUp,
  Plus,
  Edit3,
  Eye,
  MapPin,
  Mail,
  Calendar,
  Users,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketplace } from "@/lib/store";
import { useVendorDashboard } from "@/lib/queries";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { getCategory } from "@/lib/constants";
import { CategoryIcon } from "@/components/marketplace/icon";
import { formatPrice, countryCodeToFlag, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
};

export function VendorDashboard() {
  const open = useMarketplace((s) => s.vendorDashboardOpen);
  const close = useMarketplace((s) => s.closeVendorDashboard);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openEditVendor = useMarketplace((s) => s.openEditVendor);
  const openVendor = useMarketplace((s) => s.openVendor);
  const { user } = useSupabaseSession();
  const { data, isLoading } = useVendorDashboard(open && !!user);

  const stats = data?.stats ?? {
    totalListings: 0,
    pending: 0,
    approved: 0,
    totalBookings: 0,
    pendingBookings: 0,
    avgRating: 0,
  };

  const statCards = [
    {
      icon: Store,
      label: "Listings",
      value: stats.totalListings,
      sub: `${stats.approved} live`,
      color: "bg-amber-500",
    },
    {
      icon: Clock,
      label: "Pending",
      value: stats.pending,
      sub: "awaiting approval",
      color: "bg-orange-500",
    },
    {
      icon: CalendarCheck,
      label: "Bookings",
      value: stats.totalBookings,
      sub: `${stats.pendingBookings} pending`,
      color: "bg-fuchsia-500",
    },
    {
      icon: Star,
      label: "Avg rating",
      value: stats.avgRating.toFixed(1),
      sub: "across listings",
      color: "bg-purple-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[95vh] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogTitle className="sr-only">Vendor dashboard</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your business listings, bookings and reviews.
        </DialogDescription>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-brand-soft to-background px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">My Dashboard</h2>
              <p className="text-xs text-muted-foreground">
                {user?.email ?? "Vendor"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              close();
              setTimeout(() => openListVendor(), 150);
            }}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" />
            New listing
          </Button>
        </div>

        <ScrollArea className="max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6 p-5 sm:p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))
                : statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="rounded-2xl border border-border bg-card p-4"
                      >
                        <div
                          className={cn(
                            "mb-2 grid size-9 place-items-center rounded-xl text-white",
                            s.color
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <p className="text-2xl font-extrabold tabular-nums">
                          {s.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {s.sub}
                        </p>
                      </div>
                    );
                  })}
            </div>

            {/* My listings */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Store className="size-4 text-brand" />
                My listings
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                  ))}
                </div>
              ) : !data?.vendors.length ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <Store className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-medium">No listings yet</p>
                  <p className="text-xs text-muted-foreground">
                    Click "New listing" to create your first business listing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.vendors.map((v) => {
                    const cat = getCategory(v.category);
                    return (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                      >
                        {/* thumbnail */}
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {v.heroImage && (
                            <img
                              src={v.heroImage}
                              alt={v.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {/* info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">{v.name}</p>
                            {v.approved ? (
                              <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
                                ✅ Live
                              </Badge>
                            ) : (
                              <Badge className="border-0 bg-amber-100 text-[10px] text-amber-700">
                                ⏳ Pending
                              </Badge>
                            )}
                            {v.featured && (
                              <Badge className="border-0 bg-brand-soft text-[10px] text-brand-soft-foreground">
                                ⭐ Featured
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {countryCodeToFlag(v.countryCode)} {v.city} ·{" "}
                            {cat?.label ?? v.category}
                            {v.subcategory ? ` · ${v.subcategory}` : ""}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {v.rating.toFixed(1)} ({v.reviewCount})
                            </span>
                            <span className="text-muted-foreground">
                              · from {formatPrice(v.basePrice, v.currency)}
                            </span>
                          </div>
                        </div>
                        {/* actions */}
                        <div className="flex shrink-0 gap-1">
                          <button
                            title="Edit listing"
                            onClick={() => {
                              close();
                              setTimeout(() => openEditVendor(v.slug), 150);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            title="View listing"
                            onClick={() => {
                              close();
                              setTimeout(() => openVendor(v.slug), 150);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Eye className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent bookings + reviews */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Bookings */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CalendarCheck className="size-4 text-brand" />
                  Recent bookings
                </h3>
                {isLoading ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : !data?.bookings.length ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No bookings yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.bookings.slice(0, 5).map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5"
                      >
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                          <Users className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">
                            {b.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {b.eventType} · {b.vendorName}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                            STATUS_STYLE[b.status]
                          )}
                        >
                          {b.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Reviews */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Star className="size-4 text-brand" />
                  Recent reviews
                </h3>
                {isLoading ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : !data?.reviews.length ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No reviews yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.reviews.slice(0, 5).map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-border bg-background p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold">
                            {r.author}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[11px]">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {r.rating}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                          on {r.vendorName} · {timeAgo(r.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
