"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Store,
  CalendarCheck,
  Star,
  X,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMarketplace } from "@/lib/store";
import { AdminOverview } from "./admin-overview";
import { AdminVendors } from "./admin-vendors";
import { AdminBookings } from "./admin-bookings";
import { AdminReviews } from "./admin-reviews";

type Tab = "overview" | "vendors" | "bookings" | "reviews";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "reviews", label: "Reviews", icon: Star },
];

export function AdminPanel() {
  const open = useMarketplace((s) => s.adminOpen);
  const close = useMarketplace((s) => s.closeAdmin);
  const [tab, setTab] = React.useState<Tab>("overview");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[95vh] gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogTitle className="sr-only">Admin panel</DialogTitle>
        <DialogDescription className="sr-only">
          Manage vendors, bookings, reviews and platform metrics.
        </DialogDescription>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-brand-soft to-background px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">
                Manage your marketplace
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close admin panel"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors " +
                  (active
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground")
                }
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content (scrollable) */}
        <div className="max-h-[75vh] overflow-y-auto custom-scrollbar p-5 sm:p-6">
          {tab === "overview" && <AdminOverview />}
          {tab === "vendors" && <AdminVendors />}
          {tab === "bookings" && <AdminBookings />}
          {tab === "reviews" && <AdminReviews />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
