"use client";

import * as React from "react";
import { Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * AttributeSelector — a grouped multi-select chip panel.
 *
 * V2 (category-specific):
 *   When a `category` prop is provided, the selector fetches category-specific
 *   filter groups from GET /api/filters/category?category=X and displays ONLY
 *   the attributes relevant to that category. This uses the CategoryFilter
 *   table (the DB-driven category-to-filter-group mapping).
 *
 *   When no `category` is provided, falls back to the global attribute list
 *   via GET /api/attributes?grouped=true&ecosystem=X (backwards compatible).
 *
 * Used by:
 *   - Vendor dashboard (MyListing) — select vendor specialties (category-specific)
 *   - Product wizard — select product attributes (global fallback)
 *
 * Props:
 *   - selectedIds: string[] — currently selected attribute/filter-value IDs
 *   - onChange: React state setter (accepts value OR updater fn)
 *   - ecosystem: "FINDMYBITES" | "PIMPMYPARTY" — filters which attributes show
 *   - category?: string — when provided, shows ONLY category-specific filters
 *   - groups?: string[] — restrict to specific groups (global mode only)
 *   - maxSelectable?: number — optional limit
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface AttributeItem {
  id: string;
  slug?: string;
  name: string;
  group: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
}

interface AttributeGroup {
  group: string;
  groupLabel: string;
  attributes: AttributeItem[];
}

// ── Constants (used only in global fallback mode) ──────────────────────────

const GROUP_LABELS: Record<string, string> = {
  dietary: "Dietary",
  service: "Service",
  product_feature: "Product Features",
  business: "Business Features",
};

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

// ── Component ──────────────────────────────────────────────────────────────

export function AttributeSelector({
  selectedIds,
  onChange,
  ecosystem,
  category,
  groups,
  maxSelectable,
}: {
  selectedIds: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  ecosystem?: string;
  /** When provided, fetches category-specific filters from /api/filters/category */
  category?: string;
  groups?: string[];
  maxSelectable?: number;
}) {
  const [groupedAttrs, setGroupedAttrs] = React.useState<AttributeGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  // ── Fetch attributes ──
  // When `category` is provided, fetch category-specific filter groups.
  // Otherwise, fall back to the global attribute list (backwards compatible).
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (category) {
          // ── Category-specific mode: fetch from /api/filters/category ──
          // This uses the CategoryFilter table (DB-driven category-to-group mapping)
          const res = await fetch(
            `/api/filters/category?category=${encodeURIComponent(category)}`
          );
          if (!res.ok) throw new Error("Failed to load category filters");
          const data = await res.json();
          if (cancelled) return;

          // Transform the filter-groups response into the AttributeGroup shape
          const groups: AttributeGroup[] = (Array.isArray(data) ? data : []).map(
            (g: any) => ({
              group: g.id,
              groupLabel: g.name,
              attributes: (g.values || []).map((v: any) => ({
                id: v.id,
                name: v.value,
                group: g.id,
              })),
            })
          );
          setGroupedAttrs(groups);
        } else {
          // ── Global fallback mode: fetch from /api/attributes ──
          const params = new URLSearchParams({ grouped: "true" });
          if (ecosystem) params.set("ecosystem", ecosystem);

          const res = await fetch(`/api/attributes?${params.toString()}`);
          if (!res.ok) throw new Error("Failed to load attributes");
          const data = await res.json();
          if (cancelled) return;

          let groupsData: AttributeGroup[] = data.groups ?? [];
          if (groups && groups.length > 0) {
            groupsData = groupsData.filter((g) => groups.includes(g.group));
          }
          setGroupedAttrs(groupsData);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load attributes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, ecosystem, groups?.join(",")]);

  // Toggle a single attribute
  const toggle = React.useCallback(
    (id: string) => {
      onChange((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        if (maxSelectable && prev.length >= maxSelectable) {
          toast.error(`Maximum ${maxSelectable} attributes allowed.`);
          return prev;
        }
        return [...prev, id];
      });
    },
    [onChange, maxSelectable]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading attributes…
      </div>
    );
  }

  const filteredGroups = groupedAttrs
    .map((g) => ({
      ...g,
      attributes: g.attributes.filter(
        (a) =>
          search === "" ||
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.slug || "").includes(search.toLowerCase())
      ),
    }))
    .filter((g) => g.attributes.length > 0);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search attributes…"
          className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {maxSelectable && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} / {maxSelectable} selected
        </p>
      )}

      {/* Groups */}
      <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
        {filteredGroups.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {category
              ? "No attributes configured for this category yet."
              : "No attributes found."}
          </p>
        )}
        {filteredGroups.map((g) => (
          <div key={g.group}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {g.groupLabel}
            </h4>
            <div className="flex flex-wrap gap-2">
              {g.attributes.map((a) => {
                const isSelected = selectedSet.has(a.id);
                const colorClass = a.color
                  ? COLOR_CLASSES[a.color] ?? "bg-muted text-foreground border-border"
                  : "bg-muted text-foreground border-border";
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    title={a.description ?? undefined}
                    aria-pressed={isSelected}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      isSelected
                        ? colorClass + " ring-2 ring-ring/20"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted/50"
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
