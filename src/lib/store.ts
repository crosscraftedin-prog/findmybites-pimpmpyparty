"use client";

import { create } from "zustand";
import type { Ecosystem } from "./types";
import type { UserLocation } from "./geo";

export type SortOption =
  | "featured"
  | "rating"
  | "reviews"
  | "price-asc"
  | "price-desc"
  | "newest";

interface MarketplaceState {
  // active ecosystem
  ecosystem: Ecosystem;
  setEcosystem: (e: Ecosystem) => void;
  toggleEcosystem: () => void;

  // search & filters
  search: string;
  setSearch: (s: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  selectedContinent: string | null;
  setSelectedContinent: (c: string | null) => void;
  priceRange: string | null;
  setPriceRange: (p: string | null) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;

  // vendor detail modal
  selectedVendorSlug: string | null;
  openVendor: (slug: string) => void;
  closeVendor: () => void;

  // mobile filter sheet
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;

  // "List your business" dialog
  listVendorOpen: boolean;
  openListVendor: () => void;
  closeListVendor: () => void;
  // when set, the dialog opens in "edit" mode for this vendor slug
  editingSlug: string | null;
  openEditVendor: (slug: string) => void;

  // "Near Me" geo search mode
  nearMeOpen: boolean;
  setNearMeOpen: (open: boolean) => void;
  nearRadius: number; // 0 = global
  setNearRadius: (km: number) => void;
  /** Shared user location — set by the LocationBanner, read by NearMeSection. */
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation | null) => void;

  // Auth (vendor sign-in) dialog
  authDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  /** String intent persisted to localStorage so it survives the Google OAuth
   *  page reload. Values: "list-vendor", "edit-vendor:<slug>", "admin", or null. */
  authIntent: string | null;
  setAuthIntent: (intent: string | null) => void;

  resetFilters: () => void;
}

export const useMarketplace = create<MarketplaceState>((set, get) => ({
  ecosystem: "FINDMYBITES",
  setEcosystem: (e) =>
    set({
      ecosystem: e,
      selectedCategory: null,
      selectedContinent: null,
      priceRange: null,
      minRating: 0,
      search: "",
      sortBy: "featured",
    }),
  toggleEcosystem: () =>
    set((s) => ({
      ecosystem: s.ecosystem === "FINDMYBITES" ? "PIMPMYPARTY" : "FINDMYBITES",
      selectedCategory: null,
      selectedContinent: null,
      priceRange: null,
      minRating: 0,
      search: "",
      sortBy: "featured",
    })),

  search: "",
  setSearch: (s) => set({ search: s }),
  selectedCategory: null,
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  selectedContinent: null,
  setSelectedContinent: (c) => set({ selectedContinent: c }),
  priceRange: null,
  setPriceRange: (p) => set({ priceRange: p }),
  minRating: 0,
  setMinRating: (r) => set({ minRating: r }),
  sortBy: "featured",
  setSortBy: (s) => set({ sortBy: s }),

  selectedVendorSlug: null,
  openVendor: (slug) => set({ selectedVendorSlug: slug }),
  closeVendor: () => set({ selectedVendorSlug: null }),

  filtersOpen: false,
  setFiltersOpen: (open) => set({ filtersOpen: open }),

  listVendorOpen: false,
  openListVendor: () => set({ listVendorOpen: true, editingSlug: null }),
  closeListVendor: () => set({ listVendorOpen: false, editingSlug: null }),
  editingSlug: null,
  openEditVendor: (slug) => set({ editingSlug: slug, listVendorOpen: true }),

  nearMeOpen: false,
  setNearMeOpen: (open) => set({ nearMeOpen: open }),
  nearRadius: 10,
  setNearRadius: (km) => set({ nearRadius: km }),
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),

  authDialogOpen: false,
  openAuthDialog: () => set({ authDialogOpen: true }),
  closeAuthDialog: () => set({ authDialogOpen: false }),
  authIntent: null,
  setAuthIntent: (intent) => {
    // persist to localStorage so it survives the Google OAuth page reload
    try {
      if (intent) {
        localStorage.setItem("fmb-pmp:auth-intent", intent);
      } else {
        localStorage.removeItem("fmb-pmp:auth-intent");
      }
    } catch {
      // ignore
    }
    set({ authIntent: intent });
  },

  resetFilters: () =>
    set({
      search: "",
      selectedCategory: null,
      selectedContinent: null,
      priceRange: null,
      minRating: 0,
      sortBy: "featured",
    }),
}));

// helper hook for building query string from current filters
export function useVendorQueryParams() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const search = useMarketplace((s) => s.search);
  const selectedCategory = useMarketplace((s) => s.selectedCategory);
  const selectedContinent = useMarketplace((s) => s.selectedContinent);
  const priceRange = useMarketplace((s) => s.priceRange);
  const minRating = useMarketplace((s) => s.minRating);
  const sortBy = useMarketplace((s) => s.sortBy);

  const params = new URLSearchParams();
  params.set("ecosystem", ecosystem);
  params.set("sort", sortBy);
  if (search) params.set("search", search);
  if (selectedCategory) params.set("category", selectedCategory);
  if (selectedContinent) params.set("continent", selectedContinent);
  if (priceRange) params.set("priceRange", priceRange);
  if (minRating > 0) params.set("minRating", String(minRating));
  return params.toString();
}
