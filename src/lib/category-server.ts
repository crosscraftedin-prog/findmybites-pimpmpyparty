import { db } from "@/lib/db";

/**
 * Server-side category label cache.
 * Fetches all categories from the DB on first call, caches in memory.
 * Used by server components (vendor page, product page, SEO pages) that
 * can't use the client-side useCategoryLabels hook.
 */

let cache: Map<string, { label: string; icon: string; accent: string; image: string }> | null = null;
let fetchPromise: Promise<Map<string, { label: string; icon: string; accent: string; image: string }>> | null = null;

async function loadCategories(): Promise<Map<string, { label: string; icon: string; accent: string; image: string }>> {
  if (cache) return cache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const map = new Map<string, { label: string; icon: string; accent: string; image: string }>();
    try {
      const cats = await db.category.findMany({
        where: { active: true },
        select: { slug: true, label: true, icon: true, accent: true, image: true },
      });
      for (const c of cats) {
        map.set(c.slug, {
          label: c.label,
          icon: c.icon || "UtensilsCrossed",
          accent: c.accent || "from-amber-400 to-orange-500",
          image: c.image || "",
        });
      }
      // Add backward-compat aliases
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
        if (newCat) map.set(oldSlug, newCat);
      }
      cache = map;
    } catch {
      // DB unavailable — return empty map, callers fall back to title-cased slug
    }
    return map;
  })();

  return fetchPromise;
}

/**
 * Get the label for a category slug (server-side).
 * Returns the DB-driven label, or a title-cased slug as fallback.
 */
export async function getCategoryLabel(slug: string | null | undefined): Promise<string> {
  if (!slug) return "";
  const cats = await loadCategories();
  const cat = cats.get(slug);
  if (cat) return cat.label;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get full category info for a slug (server-side).
 */
export async function getCategoryInfo(slug: string | null | undefined): Promise<{
  label: string;
  icon: string;
  accent: string;
  image: string;
} | undefined> {
  if (!slug) return undefined;
  const cats = await loadCategories();
  return cats.get(slug);
}

/**
 * Clear the cache (useful for testing or after admin updates).
 */
export function clearCategoryCache() {
  cache = null;
  fetchPromise = null;
}
