"use client";

import * as React from "react";
import {
  Check, AlertTriangle, X, CalendarClock, Truck, Clock, MapPin, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/inventory/constants";

interface ProductAvailabilityBannerProps {
  productId: string;
  /** Pass static product fields to render prep/delivery/area without an extra fetch. */
  preparationTimeCategory?: string | null;
  preparationTimeCustom?: string | null;
  prepTime?: string | null;
  bookingNoticeHours?: number | null;
  serviceAreaType?: string | null;
  deliveryAvailable?: boolean;
  stockType?: string | null;
  stockCount?: number | null;
  lowStockThreshold?: number | null;
  status?: string | null;
}

/**
 * Customer-facing availability banner shown on the public product page.
 * Renders: ✓ Available / ⚠ Only N left / ❌ Out of Stock / 📅 Next Available /
 * 🚚 Preparation Time / 📍 Delivery Available.
 */
export function ProductAvailabilityBanner(props: ProductAvailabilityBannerProps) {
  const [check, setCheck] = React.useState<{
    available: boolean; message: string; nextAvailableDate?: string | null;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${props.productId}/availability?track=1`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCheck(data);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [props.productId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
      </div>
    );
  }

  const inStock = props.stockType === "unlimited" || (props.stockCount ?? 0) > 0;
  const lowStock = props.stockType === "limited" && (props.stockCount ?? 0) > 0 && (props.stockCount ?? 0) < (props.lowStockThreshold ?? 10);
  const prepLabel = props.preparationTimeCategory && props.preparationTimeCategory !== "custom"
    ? ({ same_day: "Same Day", "24_hours": "24 Hours", "2_days": "2 Days", "3_days": "3 Days", "1_week": "1 Week" } as Record<string, string>)[props.preparationTimeCategory] ?? null
    : props.preparationTimeCategory === "custom" ? props.preparationTimeCustom : props.prepTime;

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      {/* Main status line */}
      <div className="flex flex-wrap items-center gap-2">
        {!check?.available ? (
          <StatusChip tone="destructive" icon={<X className="h-3.5 w-3.5" />}>
            {check?.message || "Unavailable"}
          </StatusChip>
        ) : lowStock ? (
          <StatusChip tone="warning" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            Only {props.stockCount} left
          </StatusChip>
        ) : (
          <StatusChip tone="success" icon={<Check className="h-3.5 w-3.5" />}>
            Available
          </StatusChip>
        )}

        {check?.nextAvailableDate && !check.available && (
          <StatusChip tone="info" icon={<CalendarClock className="h-3.5 w-3.5" />}>
            Next available: {fmtDate(check.nextAvailableDate)}
          </StatusChip>
        )}
      </div>

      {/* Secondary attributes */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {prepLabel && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Prep: {prepLabel}
          </span>
        )}
        {props.bookingNoticeHours && props.bookingNoticeHours > 0 && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {props.bookingNoticeHours < 24 ? `${props.bookingNoticeHours}h notice` : `${Math.round(props.bookingNoticeHours / 24)}d notice`}
          </span>
        )}
        {props.deliveryAvailable && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Truck className="h-3.5 w-3.5" /> Delivery Available
          </span>
        )}
        {props.serviceAreaType && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {props.serviceAreaType}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusChip({
  tone, icon, children,
}: {
  tone: "success" | "warning" | "destructive" | "info";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls = tone === "success"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
    : tone === "warning"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
    : tone === "destructive"
    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      {icon}
      {children}
    </span>
  );
}
