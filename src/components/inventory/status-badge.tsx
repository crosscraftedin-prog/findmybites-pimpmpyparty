"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/inventory/constants";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Color-coded product status badge used throughout the dashboard.
 * Reads the unified status taxonomy (active | draft | out_of_stock |
 * temporarily_unavailable | seasonal | archived).
 */
export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        meta.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/** Compact stock-remaining pill for product cards. */
export function StockPill({
  stockType,
  stockCount,
  lowStockThreshold,
  className,
}: {
  stockType?: string | null;
  stockCount?: number | null;
  lowStockThreshold?: number | null;
  className?: string;
}) {
  if (stockType === "unlimited" || !stockType) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400", className)}>
        ● Unlimited
      </span>
    );
  }
  const count = stockCount ?? 0;
  const threshold = lowStockThreshold && lowStockThreshold > 0 ? lowStockThreshold : 10;
  if (count <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400", className)}>
        ● Out of stock
      </span>
    );
  }
  const low = count < threshold;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        low ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      ● {count} remaining
    </span>
  );
}
