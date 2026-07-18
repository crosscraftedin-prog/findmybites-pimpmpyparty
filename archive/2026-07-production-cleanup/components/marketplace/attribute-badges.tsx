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
import { cn } from "@/lib/utils";

/**
 * Reusable attribute badge component.
 *
 * Renders colored badges for a list of attributes. Used on:
 *   - Vendor cards (compact, max 3-4 badges)
 *   - Vendor profile (full list, "Specializes In" section)
 *   - Product cards / product page (near title)
 *
 * Fetches nothing — accepts pre-loaded attribute data (slug, name, color, icon).
 * Parent components should batch-fetch via getVendorAttributesBatch for lists.
 */

export interface AttributeBadgeData {
  slug: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  group?: string | null;
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  green: "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  sky: "bg-sky-100 text-sky-700 border-sky-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  lime: "bg-lime-100 text-lime-700 border-lime-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export function getBadgeColorClass(color?: string | null): string {
  if (!color) return "bg-muted text-foreground border-border";
  return COLOR_CLASSES[color] ?? "bg-muted text-foreground border-border";
}

/**
 * Compact badge row — for vendor cards and product cards.
 * Shows up to `maxBadges` attributes as small pills.
 */
export function AttributeBadges({
  attributes,
  maxBadges = 3,
  size = "sm",
  className,
}: {
  attributes: AttributeBadgeData[];
  maxBadges?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  if (!attributes || attributes.length === 0) return null;

  const shown = attributes.slice(0, maxBadges);
  const remaining = attributes.length - shown.length;

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {shown.map((a) => (
        <span
          key={a.slug}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border font-medium",
            getBadgeColorClass(a.color),
            sizeClasses[size]
          )}
        >
          {a.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className={cn(
          "inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
          sizeClasses[size]
        )}>
          +{remaining}
        </span>
      )}
    </div>
  );
}

/**
 * Full badge grid — for vendor profile "Specializes In" section.
 * Groups badges by their `group` field.
 */
export function AttributeBadgesGrouped({
  attributes,
  className,
}: {
  attributes: AttributeBadgeData[];
  className?: string;
}) {
  if (!attributes || attributes.length === 0) return null;

  const groupLabels: Record<string, string> = {
    dietary: "Dietary",
    service: "Services",
    product_feature: "Features",
    business: "Business",
  };

  const groups = Object.keys(groupLabels)
    .map((g) => ({
      group: g,
      label: groupLabels[g],
      items: attributes.filter((a) => a.group === g),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {groups.map((g) => (
        <div key={g.group}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {g.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {g.items.map((a) => (
              <span
                key={a.slug}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                  getBadgeColorClass(a.color)
                )}
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to batch-fetch vendor attributes for a list of vendors.
 * Returns a map: vendorId → AttributeBadgeData[].
 * Useful for vendor card grids (avoids N+1).
 */
export function useVendorAttributesBatch(vendorIds: string[]) {
  const [map, setMap] = React.useState<Map<string, AttributeBadgeData[]>>(new Map());
  const [loading, setLoading] = React.useState(false);

  const idsKey = vendorIds.sort().join(",");

  React.useEffect(() => {
    if (vendorIds.length === 0) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Fetch all attributes once (cached), then fetch per-vendor assignments.
        // For efficiency with large vendor lists, we'd ideally have a batch API,
        // but for now we parallel-fetch (attributes are cached at the CDN level).
        const attrRes = await fetch("/api/attributes");
        const attrData = await attrRes.json();
        const attrMap = new Map<string, AttributeBadgeData>(
          (attrData.attributes ?? []).map((a: any) => [a.id, {
            slug: a.slug, name: a.name, color: a.color, icon: a.icon, group: a.group,
          }])
        );

        // For each vendor, fetch their attribute IDs
        const results = await Promise.all(
          vendorIds.map(async (vid) => {
            try {
              const res = await fetch(`/api/vendors/${vid}/attributes`);
              if (!res.ok) return [vid, []] as const;
              const data = await res.json();
              const attrs = (data.attributes ?? [])
                .map((a: any) => attrMap.get(a.id))
                .filter(Boolean) as AttributeBadgeData[];
              return [vid, attrs] as const;
            } catch {
              return [vid, []] as const;
            }
          })
        );

        if (cancelled) return;
        setMap(new Map(results as [string, AttributeBadgeData[]][]));
      } catch {
        // fail silently — badges are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [idsKey]);

  return { map, loading };
}
