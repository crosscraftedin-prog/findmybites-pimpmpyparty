"use client";

import * as React from "react";
import { Filter, Loader2, Check, X, SlidersHorizontal } from "lucide-react";

interface FilterValue {
  id: string;
  value: string;
}

interface FilterGroup {
  id: string;
  name: string;
  type: string;
  unit: string | null;
  required: boolean;
  values: FilterValue[];
}

interface FilterSidebarProps {
  category: string;
  onResults: (vendors: any[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * FilterSidebar — customer-facing filter panel shown alongside vendor results.
 *
 * - Fetches filter groups for the selected category
 * - Renders checkboxes (multi), pill toggles (single), number inputs (range)
 * - On any change, calls POST /api/filters/search and passes results to parent
 * - Shows active filter count + "Clear all" button
 */
export function FilterSidebar({ category, onResults, onLoadingChange }: FilterSidebarProps) {
  const [filters, setFilters] = React.useState<FilterGroup[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Fetch filters when category changes
  React.useEffect(() => {
    if (!category) {
      setFilters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelected(new Set());
    setHasSearched(false);
    fetch(`/api/filters/category?category=${encodeURIComponent(category)}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        setFilters(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setFilters([]);
        setLoading(false);
      });
  }, [category]);

  // Run search whenever selections change (debounced)
  const runSearch = React.useCallback(
    (newSelected: Set<string>) => {
      clearTimeout(searchTimeoutRef.current);
      if (newSelected.size === 0) {
        // No filters selected — tell parent to show default results
        onResults([]);
        setHasSearched(false);
        onLoadingChange?.(false);
        return;
      }

      setSearching(true);
      onLoadingChange?.(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/filters/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              filterValueIds: [...newSelected],
            }),
          });
          const data = await res.json();
          onResults(data.vendors || []);
          setHasSearched(true);
        } catch {
          onResults([]);
        } finally {
          setSearching(false);
          onLoadingChange?.(false);
        }
      }, 400);
    },
    [category, onResults, onLoadingChange]
  );

  const toggle = (valueId: string, groupId: string, groupType: string) => {
    const newSelected = new Set(selected);
    if (groupType === "single") {
      const group = filters.find((f) => f.id === groupId);
      group?.values.forEach((v) => newSelected.delete(v.id));
    }
    if (newSelected.has(valueId)) {
      newSelected.delete(valueId);
    } else {
      newSelected.add(valueId);
    }
    setSelected(newSelected);
    runSearch(newSelected);
  };

  const clearAll = () => {
    setSelected(new Set());
    onResults([]);
    setHasSearched(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading filters...
      </div>
    );
  }

  if (filters.length === 0) return null;

  const activeCount = selected.size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Searching indicator */}
      {searching && (
        <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
          <Loader2 className="size-3 animate-spin" /> Searching...
        </div>
      )}

      {/* Filter groups */}
      <div className="space-y-4">
        {filters.map((group) => {
          const groupSelected = group.values.filter((v) => selected.has(v.id));
          const hasSelection = groupSelected.length > 0;

          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold">
                  {group.name}
                  {group.unit && (
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      ({group.unit})
                    </span>
                  )}
                </label>
                {hasSelection && (
                  <button
                    onClick={() => {
                      const newSelected = new Set(selected);
                      group.values.forEach((v) => newSelected.delete(v.id));
                      setSelected(newSelected);
                      runSearch(newSelected);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              {group.type === "range" ? (
                <input
                  type="number"
                  placeholder={`Max ${group.unit || ""}`}
                  className="h-9 w-full rounded-lg border border-border px-3 text-[12px]"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {group.values.map((v) => {
                    const isSelected = selected.has(v.id);
                    return (
                      <button
                        key={v.id}
                        onClick={() => toggle(v.id, group.id, group.type)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isSelected
                            ? "bg-brand text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {isSelected && group.type === "multi" && <Check className="size-2.5" />}
                        {v.value}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results count */}
      {hasSearched && !searching && (
        <div className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          Showing filtered results
        </div>
      )}
    </div>
  );
}
