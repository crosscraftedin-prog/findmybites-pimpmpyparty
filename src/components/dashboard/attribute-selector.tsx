"use client";

import * as React from "react";
import { Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Reusable attribute selector — a grouped multi-select chip panel.
 *
 * Used by:
 *   - Vendor dashboard (MyListing) — select vendor specialties
 *   - Product wizard — select product attributes (badges)
 *
 * Fetches attributes from GET /api/attributes?grouped=true&ecosystem=X
 * and displays them grouped by Dietary / Service / Product Features / Business.
 *
 * Props:
 *   - selectedIds: string[] — currently selected attribute IDs
 *   - onChange: React state setter (accepts value OR updater fn).
 *       Because React state setters accept functional updaters, we pass
 *       `(prev) => next` so toggling always operates on the LATEST state —
 *       eliminating stale-closure / stale-ref bugs that caused chips to
 *       behave as single-select under rapid interaction.
 *   - ecosystem: "FINDMYBITES" | "PIMPMYPARTY" — filters which attributes show
 *   - groups?: string[] — restrict to specific groups (e.g. ["dietary","product_feature"])
 *   - maxSelectable?: number — optional limit
 */

interface AttributeItem {
  id: string;
  slug: string;
  name: string;
  group: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

interface AttributeGroup {
  group: string;
  groupLabel: string;
  attributes: AttributeItem[];
}

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

export function AttributeSelector({
  selectedIds,
  onChange,
  ecosystem,
  groups,
  maxSelectable,
}: {
  selectedIds: string[];
  /**
   * Accepts a React state setter (Dispatch<SetStateAction<string[]>>).
   * We call it with a functional updater `(prev) => next` so that toggling
   * always reads the most recent state — even when multiple toggles fire
   * before a re-render commits. This is the canonical fix for the
   * "selecting one chip deselects another" stale-state bug.
   */
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  ecosystem?: string;
  groups?: string[];
  maxSelectable?: number;
}) {
  const [groupedAttrs, setGroupedAttrs] = React.useState<AttributeGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Derive the selected set directly from props on every render — no ref,
  // no effect, no stale closure. For typical attribute counts (< 100) this
  // Set allocation is negligible and guarantees the UI never disagrees with
  // the actual selected array.
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  // Fetch attributes
  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ grouped: "true" });
    if (ecosystem) params.set("ecosystem", ecosystem);

    (async () => {
      try {
        const res = await fetch(`/api/attributes?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load attributes");
        const data = await res.json();
        if (cancelled) return;

        let groups_data: AttributeGroup[] = data.groups ?? [];
        // Filter to specific groups if requested
        if (groups && groups.length > 0) {
          groups_data = groups_data.filter((g) => groups.includes(g.group));
        }
        setGroupedAttrs(groups_data);
      } catch (e) {
        if (!cancelled) toast.error("Failed to load attributes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ecosystem, groups?.join(",")]);

  // Toggle a single attribute. Uses a functional updater so the parent's
  // state setter applies the change to the LATEST committed state — not a
  // potentially stale snapshot captured in this render's closure.
  const toggle = React.useCallback(
    (id: string) => {
      onChange((prev) => {
        if (prev.includes(id)) {
          // Already selected → remove it
          return prev.filter((x) => x !== id);
        }
        // Not yet selected → add it (respecting maxSelectable)
        if (maxSelectable && prev.length >= maxSelectable) {
          toast.error(`Maximum ${maxSelectable} attributes allowed.`);
          return prev; // no change
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
          a.slug.includes(search.toLowerCase())
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
            No attributes found.
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
