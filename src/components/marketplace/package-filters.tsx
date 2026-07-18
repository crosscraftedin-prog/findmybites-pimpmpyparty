"use client";

import * as React from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface PackageFilterState {
  budget?: string; // "300-500" | "500-700" | "700-1000" | "1000+"
  guests?: number; // 10 | 25 | 50 | 100 | 250 | 500
  occasion?: string[]; // ["Birthday", "Wedding"]
  foodType?: string; // "Veg" | "Non Veg" | "Both"
  cuisine?: string[]; // ["North Indian", "Chinese"]
  services?: string[]; // ["Buffet", "Live Counter", "Delivery"]
  rating?: number; // 4 | 4.5 | 5
  availability?: string; // "Today" | "Tomorrow" | "Weekend"
}

export interface PackageFiltersProps {
  filters: PackageFilterState;
  onChange: (filters: PackageFilterState) => void;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Option catalogs                                                            */
/* -------------------------------------------------------------------------- */

const BUDGET_OPTIONS: { value: string; label: string }[] = [
  { value: "300-500", label: "₹300 – 500 / guest" },
  { value: "500-700", label: "₹500 – 700 / guest" },
  { value: "700-1000", label: "₹700 – 1,000 / guest" },
  { value: "1000+", label: "₹1,000+ / guest" },
];

const GUEST_OPTIONS: number[] = [10, 25, 50, 100, 250, 500];

const OCCASION_OPTIONS: string[] = [
  "Birthday",
  "Wedding",
  "Reception",
  "Corporate",
  "House Party",
  "Baby Shower",
  "Anniversary",
  "Festival",
  "Engagement",
];

const FOOD_TYPE_OPTIONS: string[] = ["Veg", "Non Veg", "Both"];

const CUISINE_OPTIONS: string[] = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Italian",
  "Continental",
  "Hyderabadi",
  "Multi Cuisine",
];

const SERVICE_OPTIONS: string[] = [
  "Buffet",
  "Live Counter",
  "Chef",
  "Waiters",
  "Delivery",
  "Setup Included",
  "Decoration Included",
];

const RATING_OPTIONS: number[] = [4, 4.5, 5];

const AVAILABILITY_OPTIONS: string[] = ["Today", "Tomorrow", "Weekend"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function countActive(filters: PackageFilterState): number {
  let n = 0;
  if (filters.budget) n++;
  if (filters.guests != null) n++;
  if (filters.occasion && filters.occasion.length > 0) n += filters.occasion.length;
  if (filters.foodType) n++;
  if (filters.cuisine && filters.cuisine.length > 0) n += filters.cuisine.length;
  if (filters.services && filters.services.length > 0) n += filters.services.length;
  if (filters.rating != null) n++;
  if (filters.availability) n++;
  return n;
}

function hasAnyFilters(filters: PackageFilterState): boolean {
  return countActive(filters) > 0;
}

function toggleArrayValue(arr: string[] | undefined, value: string): string[] {
  const next = new Set(arr ?? []);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return Array.from(next);
}

/* -------------------------------------------------------------------------- */
/* Filter pill sub-component                                                  */
/* -------------------------------------------------------------------------- */

interface FilterPillProps {
  label: string;
  activeCount: number;
  isActive: boolean;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
}

function FilterPill({
  label,
  activeCount,
  isActive,
  children,
  align = "start",
  width = "w-60",
}: FilterPillProps) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            isActive
              ? "border-brand bg-brand text-brand-foreground hover:bg-brand/90"
              : "border-border bg-card text-foreground hover:border-brand-border hover:bg-accent"
          )}
        >
          <span>{label}</span>
          {activeCount > 0 && (
            <span
              className={cn(
                "grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold leading-none",
                isActive
                  ? "bg-white/25 text-brand-foreground"
                  : "bg-brand text-brand-foreground"
              )}
            >
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className={cn("p-3", width)}
      >
        {children(close)}
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Single-select (radio) list                                                 */
/* -------------------------------------------------------------------------- */

function RadioList({
  options,
  value,
  onSelect,
  onClear,
  close,
}: {
  options: { value: string; label: string }[];
  value: string | undefined;
  onSelect: (v: string) => void;
  onClear?: () => void;
  close: () => void;
}) {
  return (
    <div className="space-y-1">
      <RadioGroup
        value={value ?? ""}
        onValueChange={(v) => {
          onSelect(v);
          close();
        }}
        className="gap-1"
      >
        {options.map((opt) => {
          const id = `opt-${opt.value}`;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                "hover:bg-accent"
              )}
            >
              <RadioGroupItem id={id} value={opt.value} />
              <span className="flex-1 truncate">{opt.label}</span>
            </label>
          );
        })}
      </RadioGroup>
      {value && onClear && (
        <button
          type="button"
          onClick={() => {
            onClear();
            close();
          }}
          className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Multi-select (checkbox) list                                               */
/* -------------------------------------------------------------------------- */

function CheckboxList({
  options,
  selected,
  onToggle,
  onClear,
  close,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear?: () => void;
  close: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {options.map((opt) => {
        const id = `chk-${opt.replace(/\s+/g, "-").toLowerCase()}`;
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
              "hover:bg-accent"
            )}
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={() => onToggle(opt)}
            />
            <span className="flex-1 truncate">{opt}</span>
            {checked && <Check className="size-3.5 text-brand" />}
          </label>
        );
      })}
      {selected.length > 0 && onClear && (
        <button
          type="button"
          onClick={() => {
            onClear();
            close();
          }}
          className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Clear all ({selected.length})
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

/**
 * PackageFilters — a sticky, horizontally-scrollable row of filter pills for
 * the packages listing page. Inspired by Airbnb's filter chips.
 *
 * Each pill opens a popover with either radio buttons (single-select) or
 * checkboxes (multi-select). A "Clear All" button appears at the end whenever
 * any filter is active.
 */
export function PackageFilters({ filters, onChange, className }: PackageFiltersProps) {
  const activeCount = countActive(filters);
  const hasFilters = hasAnyFilters(filters);

  const update = (patch: Partial<PackageFilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const clearAll = () => {
    onChange({});
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:px-6 lg:px-8">
        <div
          className={cn(
            "no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto",
            "[scrollbar-width:none] [-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden"
          )}
        >
          {/* Budget — single select */}
          <FilterPill
            label="Budget"
            activeCount={filters.budget ? 1 : 0}
            isActive={!!filters.budget}
            width="w-64"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Price per guest
                </p>
                <RadioList
                  options={BUDGET_OPTIONS}
                  value={filters.budget}
                  onSelect={(v) => update({ budget: v })}
                  onClear={() => update({ budget: undefined })}
                  close={close}
                />
              </div>
            )}
          </FilterPill>

          {/* Guests — single select */}
          <FilterPill
            label="Guests"
            activeCount={filters.guests != null ? 1 : 0}
            isActive={filters.guests != null}
            width="w-56"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Minimum guests
                </p>
                <RadioGroup
                  value={filters.guests != null ? String(filters.guests) : ""}
                  onValueChange={(v) => {
                    update({ guests: Number(v) });
                    close();
                  }}
                  className="gap-1"
                >
                  {GUEST_OPTIONS.map((g) => {
                    const id = `gst-${g}`;
                    return (
                      <label
                        key={g}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        <RadioGroupItem id={id} value={String(g)} />
                        <span className="flex-1">{g}+ guests</span>
                      </label>
                    );
                  })}
                </RadioGroup>
                {filters.guests != null && (
                  <button
                    type="button"
                    onClick={() => {
                      update({ guests: undefined });
                      close();
                    }}
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </FilterPill>

          {/* Occasion — multi select */}
          <FilterPill
            label="Occasion"
            activeCount={filters.occasion?.length ?? 0}
            isActive={(filters.occasion?.length ?? 0) > 0}
            width="w-60"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Occasion
                </p>
                <CheckboxList
                  options={OCCASION_OPTIONS}
                  selected={filters.occasion ?? []}
                  onToggle={(v) =>
                    update({ occasion: toggleArrayValue(filters.occasion, v) })
                  }
                  onClear={() => update({ occasion: [] })}
                  close={close}
                />
              </div>
            )}
          </FilterPill>

          {/* Food Type — single select */}
          <FilterPill
            label="Food Type"
            activeCount={filters.foodType ? 1 : 0}
            isActive={!!filters.foodType}
            width="w-52"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Food preference
                </p>
                <RadioList
                  options={FOOD_TYPE_OPTIONS.map((f) => ({ value: f, label: f }))}
                  value={filters.foodType}
                  onSelect={(v) => update({ foodType: v })}
                  onClear={() => update({ foodType: undefined })}
                  close={close}
                />
              </div>
            )}
          </FilterPill>

          {/* Cuisine — multi select */}
          <FilterPill
            label="Cuisine"
            activeCount={filters.cuisine?.length ?? 0}
            isActive={(filters.cuisine?.length ?? 0) > 0}
            width="w-60"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cuisine
                </p>
                <CheckboxList
                  options={CUISINE_OPTIONS}
                  selected={filters.cuisine ?? []}
                  onToggle={(v) =>
                    update({ cuisine: toggleArrayValue(filters.cuisine, v) })
                  }
                  onClear={() => update({ cuisine: [] })}
                  close={close}
                />
              </div>
            )}
          </FilterPill>

          {/* Services — multi select */}
          <FilterPill
            label="Services"
            activeCount={filters.services?.length ?? 0}
            isActive={(filters.services?.length ?? 0) > 0}
            width="w-64"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Services included
                </p>
                <CheckboxList
                  options={SERVICE_OPTIONS}
                  selected={filters.services ?? []}
                  onToggle={(v) =>
                    update({ services: toggleArrayValue(filters.services, v) })
                  }
                  onClear={() => update({ services: [] })}
                  close={close}
                />
              </div>
            )}
          </FilterPill>

          {/* Rating — single select */}
          <FilterPill
            label="Rating"
            activeCount={filters.rating != null ? 1 : 0}
            isActive={filters.rating != null}
            width="w-52"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Minimum rating
                </p>
                <RadioGroup
                  value={filters.rating != null ? String(filters.rating) : ""}
                  onValueChange={(v) => {
                    update({ rating: Number(v) });
                    close();
                  }}
                  className="gap-1"
                >
                  {RATING_OPTIONS.map((r) => {
                    const id = `rt-${String(r).replace(".", "-")}`;
                    return (
                      <label
                        key={r}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        <RadioGroupItem id={id} value={String(r)} />
                        <span className="flex-1">
                          {r.toFixed(1)}{" "}
                          <span className="text-amber-500">★ & up</span>
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
                {filters.rating != null && (
                  <button
                    type="button"
                    onClick={() => {
                      update({ rating: undefined });
                      close();
                    }}
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </FilterPill>

          {/* Availability — single select */}
          <FilterPill
            label="Availability"
            activeCount={filters.availability ? 1 : 0}
            isActive={!!filters.availability}
            width="w-52"
          >
          {(close) => (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Available on
                </p>
                <RadioList
                  options={AVAILABILITY_OPTIONS.map((a) => ({ value: a, label: a }))}
                  value={filters.availability}
                  onSelect={(v) => update({ availability: v })}
                  onClear={() => update({ availability: undefined })}
                  close={close}
                />
              </div>
            )}
          </FilterPill>

          {/* Clear All */}
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-10 shrink-0 gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
              <span>Clear All</span>
              {activeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-foreground"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PackageFilters;
