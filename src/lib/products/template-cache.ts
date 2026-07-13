/**
 * Template Engine V3 — Runtime Cache.
 * ─────────────────────────────────────────────────────────────────────────
 * In-memory cache for template resolution results.
 * Prevents repeated DB queries when rendering multiple products.
 *
 * Cache invalidates:
 *   - Automatically after CACHE_TTL_MS (60 seconds).
 *   - Manually via invalidateTemplateCache() when a template is published.
 *
 * The cache is per-category (not per-product) — all products in the same
 * category share the same template resolution.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Map: cacheKey → CacheEntry
const cache = new Map<string, CacheEntry<unknown>>();

function makeKey(prefix: string, category: string, subcategory?: string | null): string {
  return `${prefix}:${category}:${subcategory ?? ""}`;
}

/**
 * Get a cached value, or call the fetcher and cache the result.
 * Returns null if the fetcher returns null (negative cache for 5s).
 */
export async function getCached<T>(
  prefix: string,
  category: string,
  subcategory: string | null | undefined,
  fetcher: () => Promise<T>
): Promise<T> {
  const key = makeKey(prefix, category, subcategory);
  const now = Date.now();

  // Check cache
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  // Fetch
  const value = await fetcher();

  // Cache (including null values for 5s to prevent repeated DB misses)
  const ttl = value === null || value === undefined ? 5_000 : CACHE_TTL_MS;
  cache.set(key, { value, expiresAt: now + ttl });

  return value;
}

/**
 * Invalidate all cache entries for a category.
 * Call this when a template is published/updated.
 */
export function invalidateTemplateCache(category?: string): void {
  if (!category) {
    cache.clear();
    return;
  }
  // Delete all entries that match the category (any prefix, any subcategory)
  for (const key of cache.keys()) {
    if (key.includes(`:${category}:`)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate all cache entries.
 * Call this when any template is published/updated.
 */
export function invalidateAllTemplateCaches(): void {
  cache.clear();
}

/**
 * Get cache stats (for admin dashboard / debugging).
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
