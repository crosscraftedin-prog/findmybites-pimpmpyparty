"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Search,
  X,
  Star,
  ArrowUpDown,
  SearchX,
  Loader2,
} from "lucide-react";
import { useMarketplace, type SortOption } from "@/lib/store";
import { useVendors, useCategories } from "@/lib/queries";
import { CATEGORIES, CONTINENTS, PRICE_RANGES, SORT_OPTIONS } from "@/lib/constants";
import { getPlaceholderVendors } from "@/lib/placeholder-vendors";
import { CategoryIcon } from "./icon";
import { VendorCard } from "./vendor-card";
import { FilterSidebar } from "./filter-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function BrowseSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const search = useMarketplace((s) => s.search);
  const setSearch = useMarketplace((s) => s.setSearch);
  const selectedCategory = useMarketplace((s) => s.selectedCategory);
  const setSelectedCategory = useMarketplace((s) => s.setSelectedCategory);
  const selectedContinent = useMarketplace((s) => s.selectedContinent);
  const setSelectedContinent = useMarketplace((s) => s.setSelectedContinent);
  const priceRange = useMarketplace((s) => s.priceRange);
  const setPriceRange = useMarketplace((s) => s.setPriceRange);
  const minRating = useMarketplace((s) => s.minRating);
  const setMinRating = useMarketplace((s) => s.setMinRating);
  const sortBy = useMarketplace((s) => s.sortBy);
  const setSortBy = useMarketplace((s) => s.setSortBy);
  const resetFilters = useMarketplace((s) => s.resetFilters);
  const filtersOpen = useMarketplace((s) => s.filtersOpen);
  const setFiltersOpen = useMarketplace((s) => s.setFiltersOpen);

  const { data, isLoading, isFetching } = useVendors();
  const { data: catData } = useCategories(ecosystem);

  // Use DB categories if available, otherwise fall back to hardcoded
  const cats = React.useMemo(() => {
    if (catData?.categories && catData.categories.length > 0) {
      return catData.categories.map((c: any) => ({
        id: c.id,
        label: c.label,
        ecosystem,
        icon: c.icon || "UtensilsCrossed",
        image: c.image || "",
        accent: c.accent || "from-amber-400 to-orange-500",
        description: c.description || "",
      }));
    }
    return CATEGORIES.filter((c) => c.ecosystem === ecosystem);
  }, [catData, ecosystem]);
  const catCountMap = React.useMemo(() => {
    const m = new Map<string, number>();
    catData?.categories.forEach((c) => m.set(c.id, c.count));
    return m;
  }, [catData]);

  const vendors = data?.vendors ?? [];
  const total = data?.total ?? 0;

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedContinent ? 1 : 0) +
    (priceRange ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  // When no real vendors exist (and no filters applied), show 10 placeholder
  // cards using the EXACT same VendorCard component so the design stays
  // consistent. When filters are applied but return nothing, we still show
  // the helpful "no matches" empty state so users know to widen filters.
  const isUsingPlaceholders = vendors.length === 0 && activeFilterCount === 0;
  const displayVendors = isUsingPlaceholders
    ? getPlaceholderVendors(ecosystem)
    : vendors;
  const totalDisplay = isUsingPlaceholders ? displayVendors.length : total;

  // ── Dynamic filter sidebar state ──────────────────────────────────────
  const [filteredVendors, setFilteredVendors] = React.useState<any[]>([]);
  const [filtersActive, setFiltersActive] = React.useState(false);
  const [filterSidebarLoading, setFilterSidebarLoading] = React.useState(false);

  // When filteredVendors exist, show them instead of default vendors
  const finalVendors = filtersActive ? filteredVendors : displayVendors;
  const finalTotal = filtersActive ? filteredVendors.length : totalDisplay;

  const ratingOptions = [
    { value: 4.5, label: "4.5 & up" },
    { value: 4.8, label: "4.8 & up" },
    { value: 4.9, label: "4.9 & up" },
  ];

  const FiltersPanel = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              !selectedCategory
                ? "bg-brand-soft font-semibold text-brand-soft-foreground"
                : "text-foreground hover:bg-accent"
            )}
          >
            <span>All categories</span>
            <span className={cn("text-xs", cats.reduce((acc, c) => acc + (catCountMap.get(c.id) ?? 0), 0) === 0 ? "text-muted-foreground/40" : "text-muted-foreground")}>
              ({cats.reduce((acc, c) => acc + (catCountMap.get(c.id) ?? 0), 0)})
            </span>
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                selectedCategory === c.id
                  ? "bg-brand-soft font-semibold text-brand-soft-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <span className="flex items-center gap-2">
                <CategoryIcon name={c.icon} className="size-4 text-muted-foreground" />
                {c.label}
              </span>
              <span className={cn("text-xs", (catCountMap.get(c.id) ?? 0) === 0 ? "text-muted-foreground/40" : "text-muted-foreground")}>
                ({catCountMap.get(c.id) ?? 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Continent */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Continent
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedContinent(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !selectedContinent
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-background hover:bg-accent"
            )}
          >
            Any
          </button>
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedContinent(selectedContinent === c ? null : c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedContinent === c
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Price range
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          {PRICE_RANGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPriceRange(priceRange === p.id ? null : p.id)}
              title={p.label}
              className={cn(
                "rounded-lg border py-2 text-center text-sm font-semibold transition-colors",
                priceRange === p.id
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Minimum rating
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setMinRating(0)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              minRating === 0
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-background hover:bg-accent"
            )}
          >
            Any
          </button>
          {ratingOptions.map((r) => (
            <button
              key={r.value}
              onClick={() => setMinRating(r.value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                minRating === r.value
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-background hover:bg-accent"
              )}
            >
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={resetFilters}
        >
          <X className="size-4" />
          Clear all filters ({activeFilterCount})
        </Button>
      )}

      {/* Dynamic category-specific filters */}
      {selectedCategory && (
        <div className="border-t border-border pt-4">
          <FilterSidebar
            category={selectedCategory}
            onResults={(results) => {
              setFilteredVendors(results);
              setFiltersActive(results.length > 0);
            }}
            onLoadingChange={setFilterSidebarLoading}
          />
        </div>
      )}
    </div>
  );

  return (
    <section id="explore" className="scroll-mt-16 border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              The marketplace
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Explore verified vendors worldwide
            </h2>
            <p className="mt-2 text-muted-foreground">
              Filter by category, continent, price and rating to find the perfect
              match for your event.
            </p>
          </div>
        </div>

        {/* Search + sort bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors, cities, cuisines, services…"
              className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter trigger */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 bg-brand text-brand-foreground">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs overflow-y-auto p-0">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">{FiltersPanel}</div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-11 w-[180px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {selectedCategory && (
              <FilterChip
                label={cats.find((c) => c.id === selectedCategory)?.label ?? selectedCategory}
                onClear={() => setSelectedCategory(null)}
              />
            )}
            {selectedContinent && (
              <FilterChip label={selectedContinent} onClear={() => setSelectedContinent(null)} />
            )}
            {priceRange && (
              <FilterChip label={`Price ${priceRange}`} onClear={() => setPriceRange(null)} />
            )}
            {minRating > 0 && (
              <FilterChip label={`${minRating}★ & up`} onClear={() => setMinRating(0)} />
            )}
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </h3>
              </div>
              {FiltersPanel}
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isFetching && !isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Updating…
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{finalTotal}</span>{" "}
                    {finalTotal === 1 ? "vendor" : "vendors"} found
                    {isUsingPlaceholders && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        · showing sample vendors
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <Skeleton className="aspect-[16/10] rounded-none" />
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : finalVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-muted">
                  <SearchX className="size-7 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No vendors match your filters</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Try widening your search — clear a filter, change continent, or
                  lower the minimum rating.
                </p>
                <Button onClick={resetFilters} className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
                  <X className="size-4" />
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {finalVendors.map((v, i) => (
                    <VendorCard key={v.id} vendor={v} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs font-medium text-brand-soft-foreground">
      {label}
      <button
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
        className="grid size-4 place-items-center rounded-full hover:bg-brand/20"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-muted">
        <SearchX className="size-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No vendors match your filters</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try widening your search — clear a filter, change continent, or lower the
        minimum rating.
      </p>
      <Button onClick={onReset} className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
        <X className="size-4" />
        Clear all filters
      </Button>
    </div>
  );
}
