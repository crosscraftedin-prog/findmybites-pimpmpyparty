"use client";

import * as React from "react";

/**
 * useCategoryLabels — fetches category labels from the DB via /api/categories
 * and provides a lookup function. Used by display components (VendorCard,
 * VendorModal, etc.) to show DB-driven category labels instead of hardcoded
 * constants.ts labels.
 *
 * Usage:
 *   const { getLabel } = useCategoryLabels();
 *   const label = getLabel(vendor.category); // "Home Bakers" (from DB)
 */

interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  accent: string;
  image: string;
  description: string;
}

// Global cache — shared across all components
let categoryCache: Map<string, CategoryInfo> | null = null;
let fetchPromise: Promise<Map<string, CategoryInfo>> | null = null;

async function fetchCategories(): Promise<Map<string, CategoryInfo>> {
  if (categoryCache) return categoryCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const map = new Map<string, CategoryInfo>();
    try {
      const res = await fetch("/api/categories?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        const cats = data.categories ?? [];
        for (const c of cats) {
          map.set(c.id, {
            id: c.id,
            label: c.label,
            icon: c.icon || "UtensilsCrossed",
            accent: c.accent || "from-amber-400 to-orange-500",
            image: c.image || "",
            description: c.description || "",
          });
        }
        // Also map old slugs to new categories for backward compat
        const migrations: Record<string, string> = {
          "cake-artists": "bakers-bakery",
          "bakers": "bakers-bakery",
          "cupcake-specialists": "bakers-bakery",
          "chocolatiers": "bakers-bakery",
          "dessert-makers": "bakers-bakery",
          "catering": "caterers",
          "private-chefs": "chef-staff",
          "specialty-foods": "specialty-food",
        };
        for (const [oldSlug, newSlug] of Object.entries(migrations)) {
          const newCat = map.get(newSlug);
          if (newCat) {
            map.set(oldSlug, newCat);
          }
        }
        categoryCache = map;
      }
    } catch {
      // fallback to empty — components will use a title-cased slug
    }
    return map;
  })();

  return fetchPromise;
}

export function useCategoryLabels() {
  const [categories, setCategories] = React.useState<Map<string, CategoryInfo>>(categoryCache ?? new Map());

  React.useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const getLabel = React.useCallback((slug: string | null | undefined): string => {
    if (!slug) return "";
    const cat = categories.get(slug);
    if (cat) return cat.label;
    // Fallback: title-case the slug
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [categories]);

  const getCategory = React.useCallback((slug: string | null | undefined): CategoryInfo | undefined => {
    if (!slug) return undefined;
    return categories.get(slug);
  }, [categories]);

  return { getLabel, getCategory, categories };
}
