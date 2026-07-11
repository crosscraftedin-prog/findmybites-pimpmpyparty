"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, X, GitCompare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fmb_recently_viewed";
const COMPARE_KEY = "fmb_compare_list";
const MAX_ITEMS = 12;
const MAX_COMPARE = 3;

/**
 * Track a vendor as recently viewed.
 * Call this from the vendor profile page on mount.
 */
export function trackRecentlyViewed(vendorId: string, vendorName: string, vendorSlug: string, avatarImage?: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: { id: string; name: string; slug: string; avatar?: string; viewedAt: string }[] = raw ? JSON.parse(raw) : [];
    // Remove if already exists
    const filtered = list.filter((v) => v.id !== vendorId);
    // Add to front
    filtered.unshift({ id: vendorId, name: vendorName, slug: vendorSlug, avatar: avatarImage, viewedAt: new Date().toISOString() });
    // Trim to max
    const trimmed = filtered.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Get recently viewed vendor IDs from localStorage.
 */
export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.map((v: any) => v.id);
  } catch {
    return [];
  }
}

/**
 * Add a vendor to the comparison list (max 3).
 */
export function addToCompare(vendorId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(vendorId) && list.length < MAX_COMPARE) {
      list.push(vendorId);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Remove a vendor from the comparison list.
 */
export function removeFromCompare(vendorId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((id) => id !== vendorId);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

/**
 * Get the comparison list.
 */
export function getCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * RecentlyViewedSection — shows recently viewed vendors on the homepage.
 * Fetches vendor data from /api/recently-viewed?ids=xxx
 */
export function RecentlyViewedSection() {
  const [vendors, setVendors] = React.useState<any[]>([]);

  React.useEffect(() => {
    const ids = getRecentlyViewedIds();
    if (ids.length === 0) return;
    fetch(`/api/recently-viewed?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .catch(() => {});
  }, []);

  if (vendors.length === 0) return null;

  return (
    <section id="recently-viewed" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-brand" />
          <h2 className="text-2xl font-extrabold tracking-tight">Recently Viewed</h2>
        </div>
        <div className="mt-6 flex w-full gap-4 overflow-x-auto pb-2">
          {vendors.map((v, i) => (
            <div
              key={v.id}
              
              
              
              className="w-48 shrink-0"
            >
              <Link
                href={`/vendor/${v.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {v.heroImage ? (
                    <img src={v.heroImage} alt={v.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Clock className="size-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{v.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.city}, {v.country}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <span className="text-amber-500">★</span>
                    <span className="font-medium">{v.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * CompareBar — sticky bar at the bottom showing vendors selected for comparison.
 * Shows when the user has 2+ vendors in the compare list.
 */
export function CompareBar({ onCompare }: { onCompare: (ids: string[]) => void }) {
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [vendors, setVendors] = React.useState<any[]>([]);

  React.useEffect(() => {
    setCompareIds(getCompareList());
  }, []);

  React.useEffect(() => {
    if (compareIds.length === 0) {
      setVendors([]);
      return;
    }
    fetch(`/api/recently-viewed?ids=${compareIds.join(",")}`)
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .catch(() => {});
  }, [compareIds]);

  // Listen for changes to compare list (from vendor cards)
  React.useEffect(() => {
    const handler = () => setCompareIds(getCompareList());
    window.addEventListener("compare-list-changed", handler);
    return () => window.removeEventListener("compare-list-changed", handler);
  }, []);

  if (compareIds.length < 2) return null;

  const remove = (id: string) => {
    const newList = removeFromCompare(id);
    setCompareIds(newList);
    window.dispatchEvent(new Event("compare-list-changed"));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <GitCompare className="size-5 text-brand" />
          <span className="text-sm font-bold">Compare ({compareIds.length}/{MAX_COMPARE})</span>
        </div>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {vendors.map((v) => (
            <div key={v.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
              {v.avatarImage && <img loading="lazy" src={v.avatarImage} alt={v.name} className="size-6 rounded-full object-cover" />}
              <span className="truncate text-xs font-medium">{v.name}</span>
              <button onClick={() => remove(v.id)} className="text-muted-foreground hover:text-destructive">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button
          onClick={() => onCompare(compareIds)}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={compareIds.length < 2}
        >
          <GitCompare className="size-4" /> Compare Now
        </Button>
      </div>
    </div>
  );
}
