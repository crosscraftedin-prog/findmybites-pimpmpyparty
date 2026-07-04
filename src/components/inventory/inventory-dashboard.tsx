"use client";

import * as React from "react";
import {
  ShoppingCart, Boxes, CalendarClock, AlertTriangle, Bell, TrendingUp,
  PackageX, Snowflake, Loader2, RefreshCw, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fmtDate } from "@/lib/inventory/constants";

interface DashboardData {
  todaysOrders: number;
  upcomingBookings: { id: string; bookingNumber: string; bookingDate: string; customerName: string; eventType: string }[];
  lowStockCount: number;
  outOfStockCount: number;
  seasonalCount: number;
  totalActiveProducts: number;
  alerts: {
    id: string; productId: string; productName: string;
    type: string; severity: string; message: string; detail?: string;
  }[];
}

/**
 * Vendor inventory dashboard widget.
 * Shows: today's orders, remaining stock, upcoming bookings, live alerts.
 */
export function InventoryDashboard({ onManageProduct }: { onManageProduct?: (id: string, name: string) => void }) {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/inventory/dashboard");
      if (res.ok) setData(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 text-sm text-muted-foreground">Unable to load dashboard.</div>;
  }

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Today's Orders"
          value={String(data.todaysOrders)}
          tone="primary"
        />
        <KpiCard
          icon={<Boxes className="h-4 w-4" />}
          label="Low Stock"
          value={String(data.lowStockCount)}
          tone={data.lowStockCount > 0 ? "warning" : "neutral"}
          sub={`${data.outOfStockCount} out of stock`}
        />
        <KpiCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Upcoming Bookings"
          value={String(data.upcomingBookings.length)}
          tone="neutral"
        />
        <KpiCard
          icon={<Snowflake className="h-4 w-4" />}
          label="Seasonal / Active"
          value={String(data.totalActiveProducts)}
          tone="neutral"
          sub={`${data.seasonalCount} seasonal`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alerts */}
        <div className="rounded-xl border">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4" />
              Inventory Alerts
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          {data.alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <Boxes className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground">No inventory alerts right now.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="divide-y">
                {data.alerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onManageProduct?.(a.productId, a.productName)}
                    className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-accent"
                  >
                    <AlertIcon severity={a.severity} type={a.type} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{a.message}</div>
                      {a.detail && <div className="text-[11px] text-muted-foreground">{a.detail}</div>}
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Upcoming bookings */}
        <div className="rounded-xl border">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4" />
              Upcoming Bookings
            </h3>
            <Badge variant="secondary" className="text-[11px]">{data.upcomingBookings.length}</Badge>
          </div>
          {data.upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No upcoming bookings</p>
              <p className="text-xs text-muted-foreground">Confirmed bookings will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="divide-y">
                {data.upcomingBookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-[10px] font-semibold uppercase">{new Date(b.bookingDate).toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(b.bookingDate).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{b.customerName}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{b.eventType} · {b.bookingNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, tone = "neutral", sub,
}: {
  icon: React.ReactNode; label: string; value: string;
  tone?: "primary" | "warning" | "neutral"; sub?: string;
}) {
  const toneClass = tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
    : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", toneClass)}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function AlertIcon({ severity, type }: { severity: string; type: string }) {
  const cls = severity === "critical"
    ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : severity === "warning"
    ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
    : "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
  const Icon = type === "out_of_stock" ? PackageX : type === "season_ending" ? Snowflake : AlertTriangle;
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cls)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
