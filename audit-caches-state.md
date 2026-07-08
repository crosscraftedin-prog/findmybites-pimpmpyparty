# Audit: Caches & Frontend State — Ecosystem Keying

**Task ID:** CATEGORY-AUDIT-CACHES-STATE
**Agent:** Principal QA Engineer (Explore)
**Scope:** All caching mechanisms and frontend state that store category / subcategory data, audited for proper `ecosystem` keying so that FindMyBites (FMB) and PimpMyParty (PMP) data cannot leak across marketplaces.
**Mode:** READ-ONLY — no files were modified.

---

## Part A — Cache Audit

### A.1 In-memory caches

| # | File | Line(s) | What is cached | Cache key | Includes `ecosystem`? | Cross-marketplace leak risk |
|---|------|---------|----------------|-----------|----------------------|-----------------------------|
| 1 | `src/app/api/categories/route.ts` | 11, 65, 134 | Categories array (DB-driven) per ecosystem | `cacheKey = ecosystemParam \|\| "_all"` (e.g. `"FINDMYBITES"`, `"PIMPMYPARTY"`, `"__all__"`) | **YES** ✅ | None — server cache is keyed by ecosystem; DB query also filters by ecosystem (line 80). The `"_all"` path is only used by admin panels. |
| 2 | `src/lib/category-server.ts` | 10-58 | Map of `slug → { label, icon, accent, image, description, seoTitle, seoDescription, featured }` for ALL active categories | `slug` (keyed inside the Map) | **NO** ❌ | **HIGH** — DB query at line 20-22 is `where: { active: true }` with NO ecosystem filter. The single shared Map is populated with categories from BOTH ecosystems. If a FMB slug and a PMP slug ever collide (e.g. a future "cakes" category added to both), `getCategoryLabel(slug)` will return whichever label was inserted last. Even without collision, this returns the wrong ecosystem's metadata when slugs happen to share names across the two marketplaces. Used by every server-rendered SEO page (vendor page, product page, `/near-me/[category]`, ecosystem landing pages). |
| 3 | `src/hooks/use-category-labels.ts` | 26-76 | Map of `slug → { id, label, icon, accent, image, description }` for ALL categories | `slug` (keyed inside the Map) | **NO** ❌ | **HIGH** — `fetchCategories()` calls `/api/categories?t=${Date.now()}` with **no `ecosystem` param** (line 36). The server falls back to the `"_all"` cache key and returns categories from BOTH ecosystems. The client-side `categoryCache` Map then mixes FMB and PMP labels. Used by `VendorCard`, `VendorModal`, and other display components to render DB-driven category labels. |
| 4 | `src/lib/rate-limit.ts` | 26-79 | Per-IP request timestamps for API rate limiting | `${ip}:${pathname}` | N/A (rate limiting is per-user, not per-marketplace) | None — correct as-is. |
| 5 | `src/lib/ai/rate-limiter.ts` | 30-58 | Per-vendor AI request count (daily) | `vendorId` | N/A — vendor IDs are globally unique | None — correct as-is. |
| 6 | `src/components/ui/toast.tsx` (via `use-toast.ts`) | 59 | Toast timeout handles | toast ID | N/A | None — UI only. |

### A.2 React Query / TanStack Query caches

QueryClient configured in `src/lib/providers.tsx` line 9-20 with `staleTime: 60s`, `refetchOnWindowFocus: false`, `retry: 1`.

| # | Hook | File:line | queryKey | Includes `ecosystem`? | Risk |
|---|------|-----------|----------|----------------------|------|
| 1 | `useVendors()` | `src/lib/queries.ts:126-132` | `["vendors", params]` where `params` is the URLSearchParams string built by `useVendorQueryParams()` (which always sets `ecosystem`) | **YES** ✅ | None |
| 2 | `useFeaturedVendors(ecosystem)` | `src/lib/queries.ts:134-144` | `["vendors", "featured", ecosystem]` | **YES** ✅ | None |
| 3 | `useVendor(slug)` | `src/lib/queries.ts:146-154` | `["vendor", slug]` | N/A — vendor slugs are globally unique | None |
| 4 | `useCategories(ecosystem)` | `src/lib/queries.ts:156-164` | `["categories", ecosystem]` | **YES** ✅ | None |
| 5 | `useReviews(vendorId)` | `src/lib/queries.ts:166-174` | `["reviews", vendorId]` | N/A — vendor-specific | None |
| 6 | `useStats()` | `src/lib/queries.ts:176-181` | `["stats"]` | N/A — global platform stats (response includes both ecosystems separately) | None |
| 7 | `useNearVendors(lat,lng,radius,ecosystem)` | `src/lib/queries.ts:305-323` | `["vendors", "near", lat, lng, radius, ecosystem]` | **YES** ✅ | None |
| 8 | `useGeocode(address)` | `src/lib/queries.ts:326-339` | `["geocode", address]` | N/A — address-specific | None |
| 9 | `useAdminVendors({ ecosystem, ... })` | `src/lib/queries.ts:352-379` | `["admin", "vendors", qs.toString()]` where `qs` includes `ecosystem` if provided | **YES** ✅ (conditional) | None — admin panel |
| 10 | `useAdminBookings`, `useAdminReviews`, `useAdminStats` | `src/lib/queries.ts:450-610` | various admin keys | N/A — admin-scoped, vendor-specific | None |
| 11 | `useVendorDashboard()` | `src/lib/queries.ts:628-649` | `["vendor", "dashboard"]` | N/A — vendor-scoped (auth-based) | None |
| 12 | `useProducts(vendorId)` | `src/lib/queries.ts:653-663` | `["products", vendorId]` | N/A — vendor-specific | None |

**Mutation invalidations** in `queries.ts` use prefix matching (e.g. `qc.invalidateQueries({ queryKey: ["categories"] })`) which correctly invalidates ALL ecosystem-keyed category queries. ✅

### A.3 Next.js cache directives

| # | File:line | Directive | Affected data | Includes `ecosystem`? | Risk |
|---|-----------|-----------|---------------|----------------------|------|
| 1 | `src/app/sitemap.ts:22` | `export const revalidate = 3600` | Sitemap entries (both ecosystems) | N/A — sitemap explicitly generates URLs for both `findmybites` and `pimpmyparty` prefixes (lines 126-153, 171) | None |
| 2 | `src/app/[ecosystem]/[[...path]]/page.tsx:58` | `export const revalidate = 3600` | ISR cache for ecosystem landing + keyword + city + city/category pages | **YES** ✅ — URL path includes ecosystem segment, so each ecosystem has its own ISR cache entry | None |
| 3 | `src/app/near-me/[category]/page.tsx:36` | `export const revalidate = 3600` | ISR cache for `/near-me/[category]` | **NO** ❌ (partially) | **MEDIUM** — `generateStaticParams()` (line 47-50) calls `getAllCategories()` which returns categories from BOTH ecosystems, deduplicated by slug. If a FMB slug and a PMP slug collide, only one `/near-me/<slug>` page is pre-generated. The page then manually maps slug → ecosystem using a hardcoded `foodSlugs` Set (line 64-65). This works today but is fragile — if the category DB changes, this hardcoded list will be wrong. |
| 4 | `src/app/vendor/dashboard/page.tsx:5` | `export const dynamic = "force-dynamic"` | Vendor dashboard | N/A — auth-scoped | None |
| 5 | `src/app/admin/page.tsx:6` | `export const dynamic = "force-dynamic"` | Admin panel | N/A — auth-scoped | None |
| 6 | `src/app/account/page.tsx:5` | `export const dynamic = "force-dynamic"` | Customer account | N/A — auth-scoped | None |

### A.4 `revalidatePath` / `revalidateTag` / `unstable_cache`

| # | File:line | Call | Risk |
|---|-----------|------|------|
| 1 | `src/lib/admin/vendor-delete-service.ts:262-264` | `revalidatePath("/vendor/${slug}")`, `revalidatePath("/")`, `revalidatePath("/sitemap.xml")` | None — vendor-scoped paths |
| 2 | `src/app/api/vendors/[slug]/route.ts:545-552` | `revalidatePath("/${migratedCat}-${citySlug}")`, `revalidatePath("/${citySlug}")`, `revalidatePath("/${citySlug}/${migratedCat}")`, `revalidatePath("/sitemap.xml")`, `revalidatePath("/")` | **LOW** — keyword/city pages are not ecosystem-prefixed, so a single vendor update invalidates the keyword page for BOTH ecosystems. Functionally correct (the page renders vendors from both ecosystems) but slightly broader than necessary. |
| 3 | `src/app/api/admin/seo-pages/route.ts:90-114` | Various keyword/city/near-me path revalidations | None — admin-scoped |

**`unstable_cache`** — not used anywhere in the codebase. ✅
**`revalidateTag`** — not used anywhere in the codebase. ✅
**`fetchCache`** — not used anywhere in the codebase. ✅

### A.5 HTTP `Cache-Control` headers

| # | File:line | Header | Keyed by URL? | Includes ecosystem in URL? | Risk |
|---|-----------|--------|---------------|---------------------------|------|
| 1 | `src/app/api/categories/route.ts:69, 138` | `public, s-maxage=300, stale-while-revalidate=600` | Yes (CDN key = full URL) | **YES** ✅ — URL is `/api/categories?ecosystem=FINDMYBITES` vs `?ecosystem=PIMPMYPARTY` | None |
| 2 | `src/app/api/categories/subcategories/route.ts:62` | `no-store` | N/A — explicit no-store | N/A | None ✅ |
| 3 | `src/app/api/stats/route.ts:73` | `public, s-maxage=60, stale-while-revalidate=300` | Yes | N/A — global stats include both ecosystems in the response | None |
| 4 | `src/app/api/vendor/marketing/qr/route.ts:53` | `public, max-age=3600` | Yes | N/A — per-vendor QR code | None |

### A.6 localStorage caches

| # | File:line | Key | Stored data | Includes ecosystem? | Risk |
|---|-----------|-----|-------------|---------------------|------|
| 1 | `src/lib/store.ts:137` | `fmb-pmp:auth-intent` | Auth intent string (`"list-vendor"`, `"edit-vendor:<slug>"`, `"admin"`, `"activate:<token>"`) | N/A — auth state, not marketplace-specific | None |
| 2 | `src/hooks/use-near-me.ts:25, 55, 89` | `fmb-pmp:user-location` | User GPS coordinates | N/A — physical location is ecosystem-agnostic | None |
| 3 | `src/lib/geo.ts:23, 43, 157` | `fmb-pmp:last-location` | Same as #2 (different cache key, same data) | N/A | None |
| 4 | `src/lib/vendor-emails.ts:16` | `fmb-pmp:vendor-emails` | Array of vendor owner emails | N/A — vendor IDs/emails are globally unique | None |
| 5 | `src/components/ai-chat/ai-chat-widget.tsx:162, 165` | `josh:userId` | Guest user ID for Josh AI chat | N/A — chat is cross-marketplace | None |
| 6 | `src/components/marketplace/recently-viewed-compare.tsx:10` | `fmb_recently_viewed` | Array of recently viewed vendors (id, name, slug, avatar, viewedAt) | **NO** ❌ | **MEDIUM** — UX issue: a user browsing FMB vendors will see those vendors in "Recently Viewed" after switching to PMP. Not a data-leak security issue (vendors are globally unique) but causes user confusion. |
| 7 | `src/components/marketplace/recently-viewed-compare.tsx:11` | `fmb_compare_list` | Array of up to 3 vendor IDs for comparison | **NO** ❌ | **MEDIUM** — Same UX concern: a user comparing FMB vendors will see them in the compare tray after switching to PMP. |
| 8 | `src/components/dashboard/product-wizard.tsx:133, 153, 287, 304` | `product-draft-${vendor.id}` | Product draft form state | N/A — keyed by vendor ID (vendor IDs are ecosystem-bound) | None |
| 9 | `src/components/dashboard/MyListing.tsx:317, 328` | `mylisting-draft-${vendor.id}` | Listing draft form state | N/A — keyed by vendor ID | None |
| 10 | `src/app/activate/[token]/page.tsx:43, 125` | `fmb-pmp:auth-intent` (writes `activate:<token>`) | Activation intent | N/A — token-scoped | None |

---

## Part B — Frontend State Audit

### B.1 Zustand store (`src/lib/store.ts`)

The store's `setEcosystem()` (lines 75-84) and `toggleEcosystem()` (lines 85-94) actions reset the following on marketplace switch:

| Variable | Reset on switch? | Risk if not reset |
|----------|------------------|-------------------|
| `ecosystem` | N/A (sets new value) | — |
| `search` | **YES** ✅ (line 82, 92) | Old search query would carry over |
| `selectedCategory` | **YES** ✅ (line 78, 88) | **Critical** — FMB category would stay selected in PMP view → wrong vendors shown |
| `selectedContinent` | **YES** ✅ (line 79, 89) | Minor — same continents apply to both |
| `priceRange` | **YES** ✅ (line 80, 90) | Minor |
| `minRating` | **YES** ✅ (line 81, 91) | Minor |
| `sortBy` | **YES** ✅ (line 83, 93) | Minor |
| `selectedVendorSlug` | **NO** — not reset | None — vendor slugs are globally unique; if a vendor modal is open during switch, it stays open (intentional) |
| `filtersOpen` | **NO** — not reset | None — UI state, not marketplace-specific |
| `listVendorOpen` / `editingSlug` | **NO** — not reset | None — UI state |
| `nearMeOpen` / `nearRadius` / `userLocation` | **NO** — not reset | None — physical location is ecosystem-agnostic |
| `authDialogOpen` / `authIntent` | **NO** — not reset | None — auth state is cross-marketplace |

The `resetFilters()` action (lines 147-155) resets the same set as `setEcosystem()`. ✅

### B.2 Component-level state

| # | File:line | Variable | Type | Reset on marketplace switch? | Risk if not reset |
|---|-----------|----------|------|------------------------------|-------------------|
| 1 | `src/components/marketplace/create-vendor-form.tsx:177-179` | `form` (FormState incl. `category`, `subcategory`) | React state | **YES** ✅ — explicit `useEffect` at lines 192-203 resets `category=""`, `subcategory=""` when `selectedPlatform` changes | None — properly handled |
| 2 | `src/components/marketplace/create-vendor-form.tsx:183-185` | `selectedPlatform` | React state | N/A — IS the marketplace selector | — |
| 3 | `src/components/marketplace/create-vendor-form.tsx:217-218` | `dbCategories`, `categoriesLoading` | React state | **YES** ✅ — `useEffect` at line 220-239 re-fetches with `?ecosystem=${activeEcosystem}` when `activeEcosystem` changes | None |
| 4 | `src/components/marketplace/create-vendor-form.tsx:242-244` | `showCustomSubcat`, `customSubcat`, `apiSubcategories` | React state | **YES** ✅ — explicitly cleared in the same `useEffect` (lines 198-200) AND re-fetched with `?ecosystem=${activeEcosystem}` at line 254 | None |
| 5 | `src/components/marketplace/create-vendor-form.tsx:286-293` | `prevCategoryRef` (ref) | React ref | **YES** ✅ — separate `useEffect` resets `showCustomSubcat` and `customSubcat` when `form.category` changes | None |
| 6 | `src/components/marketplace/browse-section.tsx:105-107` | `filteredVendors`, `filtersActive`, `filterSidebarLoading` | React state | **NO** ❌ | **MEDIUM** — When the user filters FMB vendors via the dynamic FilterSidebar, then switches to PMP, `selectedCategory` is cleared (store reset) which unmounts the FilterSidebar. But `filteredVendors` and `filtersActive` remain in BrowseSection local state. Line 110: `const finalVendors = filtersActive ? filteredVendors : displayVendors;` → user sees stale FMB filtered vendors in PMP view until they manually click "Clear all". |
| 7 | `src/components/marketplace/browse-section.tsx:59-60` | `useVendors()`, `useCategories(ecosystem)` results | React Query | **YES** ✅ — query keys include `ecosystem`, so they re-fetch automatically when store `ecosystem` changes | None |
| 8 | `src/components/marketplace/categories-section.tsx:14-16` | `ecosystem`, `setSelectedCategory`, `useCategories(ecosystem)` | Zustand + React Query | **YES** ✅ — reads `ecosystem` reactively; `useCategories` query key includes ecosystem | None |
| 9 | `src/components/marketplace/filter-sidebar.tsx:35-40` | `filters`, `selected`, `loading`, `searching`, `hasSearched` | React state | **PARTIAL** — `selected` and `hasSearched` are cleared in the `useEffect` at line 43-62 when `category` prop changes. Since `selectedCategory` is reset to null on marketplace switch (store), the FilterSidebar unmounts entirely (line 278 of browse-section: `{selectedCategory && <FilterSidebar ... />}`), so its local state is destroyed. ✅ Indirect reset via unmount. | None — unmounted |
| 10 | `src/components/marketplace/filter-sidebar.tsx:52` | Fetch URL `/api/filters/category?category=...` | Network | **NO** ❌ — URL does NOT include `ecosystem` param | **HIGH** (potential) — `/api/filters/category/route.ts` filters by `categoryId` only (line 19-20). If two categories in different ecosystems share a slug AND the DB stores slugs in `CategoryFilter.categoryId`, both ecosystems' filter groups would be returned. If the DB stores UUIDs, this is functionally broken (no filters ever returned). Either way, the API is missing ecosystem enforcement. |
| 11 | `src/components/dashboard/DynamicFilters.tsx:36-41` | `filters`, `selectedIds`, `rangeValues`, `loading`, `saving`, `saved` | React state | N/A — vendor dashboard has no marketplace toggle (vendor is bound to one ecosystem) | None at runtime, but the API call (line 51) still lacks `ecosystem` param — same risk as #10 if ever used outside vendor dashboard. |
| 12 | `src/components/dashboard/vendor-onboarding.tsx:52-53` | `state`, `loading` | React state | N/A — vendor dashboard, no marketplace toggle | None |
| 13 | `src/app/[ecosystem]/[[...path]]/seo-page-client.tsx:87` | `dbCategories` | React state | **YES** ✅ — `useEffect` at line 88-101 re-fetches with `?ecosystem=${ctx.ecosystem}` when `ctx.ecosystem` changes | None |

---

## Part C — Summary of Issues Found

### C.1 Caches MISSING ecosystem keying

| Severity | File:line | Issue | Recommended fix |
|----------|-----------|-------|-----------------|
| **HIGH** | `src/lib/category-server.ts:10-58` | Server-side category label cache mixes FMB and PMP categories into one Map keyed by slug. DB query has no ecosystem filter. | Either (a) pass `ecosystem` into `loadCategories()` and key the Map as `${ecosystem}:${slug}` with separate caches per ecosystem, or (b) change the DB query to fetch ecosystem alongside the slug and key the Map as `${ecosystem}:${slug}`. Update `getCategoryLabel(slug, ecosystem?)` and `getCategoryInfo(slug, ecosystem?)` signatures accordingly. All callers (e.g. `[ecosystem]/[[...path]]/page.tsx:126, 252`, `near-me/[category]/page.tsx:54, 61`) already know the ecosystem — pass it through. |
| **HIGH** | `src/hooks/use-category-labels.ts:26-76` | Client-side category label cache fetches `/api/categories?t=...` with NO `ecosystem` param. Server returns categories from BOTH ecosystems under the `"_all"` cache key. | Change `fetchCategories()` to accept an `ecosystem` param and call `/api/categories?ecosystem=${ecosystem}&t=...`. Key the module-level `categoryCache` as a `Map<ecosystem, Map<slug, CategoryInfo>>` so both marketplaces can be cached independently. Update `useCategoryLabels(ecosystem?)` to take an optional ecosystem (fall back to the Zustand store value if not passed). |
| **MEDIUM** | `src/app/near-me/[category]/page.tsx:36-50, 64-65` | `generateStaticParams` returns categories from both ecosystems (deduplicated by slug). The page then manually infers ecosystem from a hardcoded `foodSlugs` Set. | Either (a) generate separate `/near-me/findmybites/[category]` and `/near-me/pimpmyparty/[category]` routes, or (b) at minimum, fetch `ecosystem` from the DB alongside the category in `getCategoryInfo()` and use that instead of the hardcoded `foodSlugs` Set. |
| **MEDIUM** | `src/components/marketplace/recently-viewed-compare.tsx:10-11` | `fmb_recently_viewed` and `fmb_compare_list` localStorage keys are shared across both ecosystems. | Either (a) suffix the keys with ecosystem (`fmb_recently_viewed:${ecosystem}`) and read/write through a helper that knows the current ecosystem, or (b) store `ecosystem` field on each entry and filter at display time. Option (b) is more flexible — recently viewed could still show "Recent from FindMyBites" cross-marketplace. |

### C.2 Frontend state MISSING reset on marketplace switch

| Severity | File:line | Variable | Issue | Recommended fix |
|----------|-----------|----------|-------|-----------------|
| **MEDIUM** | `src/components/marketplace/browse-section.tsx:105-107` | `filteredVendors`, `filtersActive`, `filterSidebarLoading` | Local state is not reset when `ecosystem` changes. After applying dynamic filters in FMB and switching to PMP, the stale FMB filtered vendor list remains visible until "Clear all" is clicked. | Subscribe to `ecosystem` from the Zustand store in BrowseSection and add a `useEffect` that clears `filteredVendors`, `filtersActive`, and `filterSidebarLoading` when `ecosystem` changes. (Alternatively, derive these from a `useReducer` keyed on ecosystem.) |

### C.3 APIs MISSING ecosystem enforcement

| Severity | File:line | API | Issue | Recommended fix |
|----------|-----------|-----|-------|-----------------|
| **HIGH** | `src/app/api/filters/category/route.ts:9-50` | `GET /api/filters/category?category=<slug>` | No `ecosystem` query param accepted or filtered on. The `where: { categoryId: category }` clause is the only filter. If `categoryId` stores slugs (unclear from code), this could return filter groups from BOTH ecosystems for a colliding slug. | Accept `?ecosystem=FINDMYBITES\|PIMPMYPARTY` and join through the `Category` table to filter by ecosystem. Update callers in `filter-sidebar.tsx:52` and `DynamicFilters.tsx:51` to pass the ecosystem param. |
| **MEDIUM** | `src/app/api/filters/search/route.ts` (called by filter-sidebar) | `POST /api/filters/search` with `{ category, filterValueIds }` | Cannot audit fully without reading the file, but based on filter-sidebar.tsx usage, the POST body does not include `ecosystem`. Same risk as above. | Accept `ecosystem` in the POST body and filter vendor results by ecosystem. |

---

## Part D — Recommendations (Prioritized)

### P0 — Fix before next production release

1. **`src/lib/category-server.ts`** — Add ecosystem parameter to `loadCategories()`, `getCategoryLabel()`, and `getCategoryInfo()`. Key the cache as `${ecosystem}:${slug}`. Update all callers in `[ecosystem]/[[...path]]/page.tsx` (lines 126, 252) and `near-me/[category]/page.tsx` (lines 54, 61) to pass the ecosystem through.
2. **`src/hooks/use-category-labels.ts`** — Add ecosystem param to `fetchCategories()` and `useCategoryLabels()`. Pass it in the `/api/categories?ecosystem=...` URL. Use a per-ecosystem cache Map. Update callers (VendorCard, VendorModal, etc.).

### P1 — Fix in next sprint

3. **`src/app/api/filters/category/route.ts`** — Accept and enforce `ecosystem` query param. Join `CategoryFilter → Category` and filter by `ecosystem`.
4. **`src/components/marketplace/filter-sidebar.tsx:52`** and **`src/components/dashboard/DynamicFilters.tsx:51`** — Pass `ecosystem` to `/api/filters/category` calls. For filter-sidebar, read ecosystem from Zustand store; for DynamicFilters, the parent vendor's ecosystem is already known.
5. **`src/components/marketplace/browse-section.tsx:105-107`** — Reset `filteredVendors`, `filtersActive`, `filterSidebarLoading` when `ecosystem` changes.
6. **`src/app/api/filters/search/route.ts`** — Read and audit; add `ecosystem` to the request body and filter vendor results by ecosystem.

### P2 — UX polish

7. **`src/components/marketplace/recently-viewed-compare.tsx`** — Either namespace `fmb_recently_viewed` and `fmb_compare_list` by ecosystem, or store `ecosystem` on each entry and filter at display time.
8. **`src/app/near-me/[category]/page.tsx:64-65`** — Replace the hardcoded `foodSlugs` Set with a DB-driven ecosystem lookup (resolved automatically once P0 #1 is fixed).

### What is already correct ✅

- `/api/categories/route.ts` in-memory cache is properly keyed by ecosystem.
- `/api/categories/subcategories/route.ts` returns `Cache-Control: no-store` and filters by ecosystem at the DB level.
- All React Query hooks that fetch ecosystem-scoped data include `ecosystem` in the query key.
- The Zustand `setEcosystem` / `toggleEcosystem` actions correctly reset `selectedCategory`, `selectedContinent`, `priceRange`, `minRating`, `search`, and `sortBy`.
- `create-vendor-form.tsx` has explicit handling (lines 192-203) to clear `category`, `subcategory`, `customSubcat`, `showCustomSubcat`, and `apiSubcategories` on platform switch.
- ISR on `[ecosystem]/[[...path]]/page.tsx` is properly keyed by URL (which includes the ecosystem segment).
- HTTP `Cache-Control` headers on `/api/categories` are correctly keyed by URL (which includes the ecosystem query param).
- localStorage caches for auth, location, vendor emails, product drafts, and listing drafts are either ecosystem-agnostic or vendor-keyed (vendor IDs are ecosystem-bound).

---

## Files Audited

### Cache files (read in full)
- `src/app/api/categories/route.ts` ✅
- `src/app/api/categories/subcategories/route.ts` ✅
- `src/app/api/filters/category/route.ts` ✅
- `src/app/api/stats/route.ts` ✅
- `src/lib/queries.ts` ✅
- `src/lib/store.ts` ✅
- `src/lib/category-server.ts` ✅
- `src/lib/providers.tsx` ✅
- `src/lib/rate-limit.ts` ✅
- `src/lib/ai/rate-limiter.ts` ✅
- `src/lib/geo.ts` ✅
- `src/lib/vendor-emails.ts` ✅
- `src/hooks/use-category-labels.ts` ✅
- `src/hooks/use-near-me.ts` ✅
- `src/app/sitemap.ts` ✅
- `src/app/[ecosystem]/[[...path]]/page.tsx` ✅
- `src/app/[ecosystem]/[[...path]]/seo-page-client.tsx` ✅
- `src/app/near-me/[category]/page.tsx` ✅
- `src/lib/seo-data.ts` ✅
- `src/components/marketplace/recently-viewed-compare.tsx` ✅

### Frontend state files (read in full)
- `src/components/marketplace/create-vendor-form.tsx` ✅ (lines 1-346 in detail)
- `src/components/marketplace/filter-sidebar.tsx` ✅
- `src/components/dashboard/DynamicFilters.tsx` ✅
- `src/components/dashboard/vendor-onboarding.tsx` ✅
- `src/components/marketplace/browse-section.tsx` ✅
- `src/components/marketplace/categories-section.tsx` ✅
- `src/components/marketplace/ecosystem-toggle.tsx` ✅
- `src/components/marketplace/ecosystem-sync.tsx` ✅
- `src/components/ai-chat/ai-chat-widget.tsx` ✅ (lines 150-189)
- `src/components/dashboard/product-wizard.tsx` ✅ (lines 120-154)
- `src/components/dashboard/MyListing.tsx` ✅ (lines 280-337)

### Search sweeps performed (ripgrep)
- `_cache | Map<string | cache.set | cache.get | _cache =`
- `unstable_cache | revalidatePath | revalidateTag | fetchCache`
- `export const revalidate | generateStaticParams`
- `Cache-Control | s-maxage | stale-while-revalidate`
- `localStorage.(getItem|setItem|removeItem)`
- `useQuery | queryKey | queryClient | useMutation`
- `selectedCategory | selectedSubcategory | customSubcategory | apiSubcategories | loadedSubcategories | dbCategories`
- `setEcosystem | toggleEcosystem`
- `export const (dynamic|runtime|revalidate|fetchCache)`
- `api/filters/category`

---

**Report generated:** Read-only audit. No files were modified.
