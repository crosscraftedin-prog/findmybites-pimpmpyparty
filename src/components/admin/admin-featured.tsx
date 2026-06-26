"use client";

import * as React from "react";
import { Search, Star, X, Plus, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const CORAL = "#D85A30";
const MAX_SLOTS = 6;

interface FeaturedVendor {
  id: string;
  name: string;
  category: string;
  city: string;
  heroImage: string;
  featured: boolean;
  ecosystem: string;
}

export function FeaturedSection() {
  const [slots, setSlots] = React.useState<FeaturedVendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [autoFeature, setAutoFeature] = React.useState(true);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<FeaturedVendor[]>([]);

  const fetchFeatured = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/featured");
      if (res.ok) {
        const data = await res.json();
        setSlots(data.vendors || []);
      }
    } catch {
      setSlots([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const searchVendors = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/admin/vendors?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.vendors || []);
      }
    } catch {
      setSearchResults([]);
    }
  };

  const addToFeatured = async (vendor: FeaturedVendor) => {
    if (slots.length >= MAX_SLOTS) {
      toast.error("All featured slots are full");
      return;
    }
    try {
      await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
    } catch {}
    setSlots([...slots, vendor]);
    toast.success(`${vendor.name} added to featured`);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeFromFeatured = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id));
    try {
      fetch("/api/admin/featured", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: id }),
      });
    } catch {}
    toast.success("Removed from featured");
  };

  const moveSlot = (from: number, to: number) => {
    if (to < 0 || to >= slots.length) return;
    const newSlots = [...slots];
    [newSlots[from], newSlots[to]] = [newSlots[to], newSlots[from]];
    setSlots(newSlots);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-medium">⭐ Featured Spots</h2>
          <p className="text-[11px] text-muted-foreground">Manage which vendors appear on the homepage (max {MAX_SLOTS})</p>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ background: CORAL }}
        >
          <Plus className="size-4" />
          Add vendor to featured
        </button>
      </div>

      {/* Auto-feature toggle */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-black/10 bg-white p-3">
        <div>
          <p className="text-[12px] font-medium">Auto-feature top rated paid vendors</p>
          <p className="text-[11px] text-muted-foreground">Fills empty slots automatically with highest-rated paid vendors</p>
        </div>
        <button
          onClick={() => setAutoFeature(!autoFeature)}
          className="relative h-5 w-10 rounded-full transition-colors"
          style={{ background: autoFeature ? CORAL : "rgba(0,0,0,0.12)" }}
        >
          <span
            className="absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: autoFeature ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>

      {/* Featured slots */}
      <div className="space-y-2">
        {slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-white py-12 text-center">
            <Star className="mx-auto size-8 text-muted-foreground/30" />
            <p className="mt-2 text-[12px] text-muted-foreground">No featured vendors yet. Add some to show on the homepage.</p>
          </div>
        ) : (
          slots.map((vendor, i) => (
            <div key={vendor.id} className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3">
              {/* Drag handle */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveSlot(i, i - 1)} className="text-muted-foreground/40 hover:text-foreground" disabled={i === 0}>
                  <GripVertical className="size-4 rotate-180" />
                </button>
                <button onClick={() => moveSlot(i, i + 1)} className="text-muted-foreground/40 hover:text-foreground" disabled={i === slots.length - 1}>
                  <GripVertical className="size-4" />
                </button>
              </div>
              {/* Slot number */}
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-soft-foreground">{i + 1}</span>
              {/* Photo */}
              <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {vendor.heroImage ? <img src={vendor.heroImage} alt={vendor.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><Star className="size-4 text-muted-foreground/40" /></div>}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium">{vendor.name}</p>
                <p className="text-[10px] text-muted-foreground">{vendor.category} · {vendor.city}</p>
              </div>
              {/* Plan badge */}
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Featured</span>
              {/* Remove */}
              <button onClick={() => removeFromFeatured(vendor.id)} className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600">
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, MAX_SLOTS - slots.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 rounded-lg border border-dashed border-black/10 p-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">{slots.length + i + 1}</span>
            <p className="text-[11px] text-muted-foreground">Empty slot {autoFeature ? "— will auto-fill" : ""}</p>
          </div>
        ))}
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Add vendor to featured</h3>
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchVendors()}
                placeholder="Search by name or city..."
                className="h-10 w-full rounded-lg border border-black/10 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                autoFocus
              />
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {searchResults.map((v) => (
                <button
                  key={v.id}
                  onClick={() => addToFeatured(v)}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {v.heroImage ? <img src={v.heroImage} alt={v.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{v.name}</p>
                    <p className="text-[10px] text-muted-foreground">{v.category} · {v.city}</p>
                  </div>
                  <Plus className="size-4 text-muted-foreground" />
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="py-4 text-center text-[11px] text-muted-foreground">No vendors found. Try a different search.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
