# Audit Report: Category & Subcategory Queries — Ecosystem Filtering

**Task ID:** CATEGORY-AUDIT-QUERIES
**Agent:** Principal QA Engineer (Explore sub-agent)
**Scope:** `/home/z/my-project/src/**/*.{ts,tsx}`
**Mode:** Read-only audit — no files were modified.

---

## 1. Schema Context (from `prisma/schema.prisma`)

| Model            | Has `ecosystem` field? | Inherits ecosystem from?       |
| ---------------- | ---------------------- | ------------------------------ |
| `Category`       | **YES** (line 33)      | — (source of truth)            |
| `Subcategory`    | NO                     | parent `Category` via `categoryId` |
| `BusinessType`   | NO                     | parent `Category` (via `categoryId` slug) |
| `FilterGroup`    | NO                     | — (cross-ecosystem by design)  |
| `FilterValue`    | NO                     | parent `FilterGroup`           |
| `VendorFilterValue` | NO                  | parent vendor's ecosystem      |
| `CategoryFilter` | NO                     | join table (Category ↔ FilterGroup) |

Key constraint: `Category.slug` is **globally `@unique`** (line 31). This means slug-based single-record lookups cannot collide across ecosystems even without an explicit `ecosystem` filter — but defense-in-depth still recommends filtering on public APIs.

---

## 2. Complete Table of All Queries Found

A total of **28 Prisma find queries** + **1 raw SQL query** touch the Category / Subcategory / BusinessType / VendorFilterValue / FilterGroup / FilterValue tables.

| # | File | Line | Query | `where` clause | Filters by ecosystem? | Endpoint type | Risk |
|---|------|------|-------|----------------|----------------------|---------------|------|
| 1 | `src/lib/category-server.ts` | 20 | `db.category.findMany` | `{ active: true }` | NO | Server lib (used by SSG pages) | LOW |
| 2 | `src/app/sitemap.ts` | 160 | `db.category.findMany` | `{ active: true }` | NO | Public (sitemap.xml) | LOW |
| 3 | `src/app/near-me/[category]/page.tsx` | 91 | `db.category.findMany` | `{ ecosystem: eco, active: true, slug: { not: categorySlug } }` | **YES** | Public page | LOW |
| 4 | `src/app/api/ai/search/route.ts` | 39 | `db.category.findMany` | `{ active: true }` | NO | Public AI endpoint | MEDIUM |
| 5 | `src/app/api/ai/search/route.ts` | 43 | `db.filterGroup.findMany` | `{ active: true }` | NO (no ecosystem field exists) | Public AI endpoint | LOW |
| 6 | `src/app/api/ai/search/route.ts` | 136 | `db.vendorFilterValue.findMany` | `{ filterValue: { value: { in: allFilterValues } } }` | NO (subsequently filtered) | Public AI endpoint | LOW |
| 7 | `src/app/api/ai/vendor-assistant/route.ts` | 81 | `db.vendorFilterValue.findMany` | `{ vendorId: vendor.id }` | NO (scoped to vendor) | Vendor auth required | LOW |
| 8 | `src/app/api/ai/insights/route.ts` | 114 | `db.vendorFilterValue.findMany` | `{}` (no where) | NO | **Admin** (`requireAdmin`) | LOW |
| 9 | `src/app/api/ai/listing-audit/route.ts` | 102 | `db.vendorFilterValue.count` | `{ vendorId: vendor.id }` | NO (scoped to vendor) | Vendor auth required | LOW |
| 10 | `src/app/api/vendors/route.ts` | 524 | `db.subcategory.findFirst` | `{ label: { equals: subcategory.trim(), mode: "insensitive" } }` | NO | Public vendor signup | **MEDIUM** |
| 11 | `src/app/api/vendors/route.ts` | 532 | `db.category.findFirst` | `{ slug: migrateCategory(category), active: true }` | NO (slug is globally unique) | Public vendor signup | LOW |
| 12 | `src/app/api/admin/subcategories/route.ts` | 18 | `db.subcategory.findMany` | `{ isPending: true }` OR `{}` | NO (no ecosystem field) | **Admin** (`requireAdmin`) | LOW |
| 13 | `src/app/api/admin/categories/[id]/subcategories/route.ts` | 61 | `db.subcategory.findMany` | `{ categoryId }` (URL param) | NO (scoped to one category) | **Admin** (`requireAdmin`) | LOW |
| 14 | `src/app/api/admin/categories/route.ts` | 19 | `db.category.findMany` | `{ ecosystem }` if `?ecosystem=` provided, else `{}` | **CONDITIONAL** | **Admin** (`requireAdmin`) | LOW |
| 15 | `src/app/api/admin/filters/[id]/values/route.ts` | 29 | `db.filterValue.findMany` | `{ groupId: id }` | NO (no ecosystem field) | **Admin** (`requireAdmin`) | LOW |
| 16 | `src/app/api/admin/filters/route.ts` | 15 | `db.filterGroup.findMany` | `{}` (no where) | NO (no ecosystem field) | **Admin** (`requireAdmin`) | LOW |
| 17 | `src/app/api/admin/templates/[id]/preview/route.ts` | 111 | `db.filterGroup.findMany` | `{}` (no where) | NO (no ecosystem field) | **Admin** (`requireAdmin`) | LOW |
| 18 | `src/app/api/vendor/ai/classify/route.ts` | 50 | `db.category.findMany` | `{ active: true }` (selects `ecosystem` for AI) | NO (intentional — AI picks ecosystem) | Vendor auth required | MEDIUM |
| 19 | `src/app/api/vendor/ai/classify/route.ts` | 51 | `db.businessType.findMany` | `{ active: true }` | NO (no ecosystem field) | Vendor auth required | LOW |
| 20 | `src/app/api/categories/route.ts` | 78 | `db.category.findMany` | `{ ...(ecosystemParam ? { ecosystem: ecosystemParam } : {}), active: true }` | **CONDITIONAL** | Public API | **MEDIUM** |
| 21 | `src/app/api/categories/route.ts` | 98 | `db.$queryRaw` | `SELECT ecosystem, category, COUNT(*) FROM vendor_listings WHERE approved = true GROUP BY ecosystem, category` | YES (groups by ecosystem) | Public API | LOW |
| 22 | `src/app/api/categories/subcategories/route.ts` | 43 | `db.category.findFirst` | `{ slug, active: true, ...(ecosystemParam ? { ecosystem: ecosystemParam } : {}) }` | **CONDITIONAL** | Public API | **MEDIUM** |
| 23 | `src/app/api/categories/subcategories/route.ts` | 54 | `db.subcategory.findMany` | `{ categoryId: cat.id, active: true }` | NO (inherits from parent lookup #22) | Public API | LOW (if #22 has filter) |
| 24 | `src/app/api/business-types/route.ts` | 19 | `db.businessType.findMany` | `{ categoryId: category, active: true }` | NO (no ecosystem field; no ecosystem param accepted) | **Public API** | **HIGH** |
| 25 | `src/app/api/admin/business-types/route.ts` | 13 | `db.businessType.findMany` | `{}` (no where; only `orderBy` + `take: 500`) | NO (intentional admin listing) | **Admin** (`requireAdmin`) | LOW |
| 26 | `src/app/api/filters/vendor/route.ts` | 31 | `db.vendorFilterValue.findMany` | `{ vendorId }` | NO (scoped to vendor) | Public GET (vendor profile) | LOW |
| 27 | `src/app/api/filters/vendor/route.ts` | 113 | `db.filterValue.findMany` | `{ id: { in: filterValueIds } }` | NO (validated via CategoryFilter membership) | Vendor auth required (POST) | LOW |
| 28 | `src/app/api/filters/search/route.ts` | 51 | `db.vendorFilterValue.findMany` | `{ filterValueId: { in: filterValueIds } }` | NO (subsequently filtered by ecosystem on vendor query) | Public API | LOW |
| 29 | `src/app/[ecosystem]/[[...path]]/page.tsx` | 263 | `db.category.findMany` | `{ ecosystem, active: true, slug: { not: ctx.category } }` | **YES** | Public SEO page | LOW |

---

## 3. Queries MISSING Ecosystem Filter — Grouped by Risk

### 🔴 HIGH RISK (Public API without filter — must fix)

#### H-1. `src/app/api/business-types/route.ts:19` — `db.businessType.findMany`
```ts
const types = await db.businessType.findMany({
  where: { categoryId: category, active: true },
  orderBy: { sortOrder: "asc" },
});
```
- **Endpoint:** `GET /api/business-types?category=<slug>` — **public, no auth**
- **Issue:** Accepts a `category` slug from the URL but never validates that the category belongs to the caller's ecosystem. `BusinessType` has no `ecosystem` field, so an attacker could submit any category slug from either marketplace and retrieve business types.
- **Exploit scenario:** A PimpMyParty-only client could pass `category=bakers-bakery` (a FindMyBites category) and receive business types intended for the food marketplace, polluting the events UI.
- **Fix:** Accept an `ecosystem` query param and join on `Category` to verify:
  ```ts
  const cat = await db.category.findFirst({
    where: { slug: category, ecosystem, active: true },
    select: { id: true },
  });
  if (!cat) return NextResponse.json({ businessTypes: [] });
  // then query business types scoped to that slug
  ```

---

### 🟡 MEDIUM RISK (Public APIs with conditional / missing filter)

#### M-1. `src/app/api/categories/route.ts:78` — `db.category.findMany`
- **Endpoint:** `GET /api/categories` — **public**
- **Issue:** Ecosystem filter is **conditional** on the `?ecosystem=` (or `?marketplace=`) query param. If a caller omits the param, the endpoint returns ALL active categories from BOTH ecosystems.
- **Mitigation in place:** Cache is keyed by ecosystem so a request without the param uses the `_all` cache key — but the underlying DB query still returns cross-marketplace data.
- **Fix:** Default to `FINDMYBITES` when no ecosystem is provided (or return 400). Public APIs must never return cross-marketplace categories.

#### M-2. `src/app/api/categories/subcategories/route.ts:43` — `db.category.findFirst`
- **Endpoint:** `GET /api/categories/subcategories?category=<slug>` — **public**
- **Issue:** Same conditional ecosystem filtering as M-1. Without `?ecosystem=`, falls back to a slug-only lookup. Slug uniqueness prevents hard collisions, but defense-in-depth is broken.
- **Fix:** Require `ecosystem` param (return 400 if missing).

#### M-3. `src/app/api/ai/search/route.ts:39` — `db.category.findMany`
- **Endpoint:** `POST /api/ai/search` — **public**
- **Issue:** Fetches ALL active categories from both ecosystems to feed the AI prompt. The AI could return a category slug from the wrong marketplace. Downstream vendor filtering (`where.ecosystem = ecosystem` on line 102) does protect against actual vendor leakage, but the AI's `parsedIntent.categories` may include cross-marketplace slugs.
- **Mitigation:** Ecosystem is applied later on the vendor query.
- **Fix:** Filter the category list fed to the AI by `ecosystem` when `body.ecosystem` is provided.

#### M-4. `src/app/api/vendor/ai/classify/route.ts:50` — `db.category.findMany`
- **Endpoint:** `POST /api/vendor/ai/classify` — vendor auth required
- **Issue:** Intentionally returns categories from BOTH ecosystems because the AI must decide which marketplace a vendor belongs to. This is by-design behavior, but worth flagging because the AI could suggest a category from the wrong marketplace.
- **Mitigation:** AI prompt explicitly instructs it to choose marketplace + category together. Result is a *suggestion* — vendor still has to confirm.
- **Fix:** None strictly required. Could add a server-side sanity check that the returned `category` slug actually belongs to the returned `marketplace`.

#### M-5. `src/app/api/vendors/route.ts:524` — `db.subcategory.findFirst`
```ts
const existingSub = await db.subcategory.findFirst({
  where: { label: { equals: subcategory.trim(), mode: "insensitive" } },
});
```
- **Endpoint:** `POST /api/vendors` (vendor signup) — **public**
- **Issue:** Looks up subcategory by label across **ALL categories in both ecosystems**. If a PimpMyParty vendor requests a custom subcategory whose label happens to match a FindMyBites subcategory, the check returns "exists" and the vendor's custom subcategory is NOT created — even though the existing one belongs to a different category.
- **Exploit scenario:** Functional bug, not security. Vendor expects their custom subcategory to be flagged for admin review; instead it silently matches an unrelated subcategory and is skipped.
- **Fix:** Scope the lookup by `categoryId`:
  ```ts
  where: {
    label: { equals: subcategory.trim(), mode: "insensitive" },
    categoryId: matchingCat.id, // or fetch cat first
  }
  ```

---

### 🟢 LOW RISK (Admin / scoped / by-design)

These queries lack an explicit `ecosystem` filter but are either:
- Admin-only endpoints (intentionally cross-marketplace for management), OR
- Scoped to a single record (single slug / single vendor), OR
- Touching tables that have no `ecosystem` field (`FilterGroup`, `FilterValue`, `VendorFilterValue`, `BusinessType`, `Subcategory`), OR
- Already filtered downstream

| # | File:Line | Reason for LOW risk |
|---|-----------|---------------------|
| L-1 | `src/lib/category-server.ts:20` | In-memory slug→label cache. Slug is globally unique, so ecosystem scoping is not required for label lookup. |
| L-2 | `src/app/sitemap.ts:160` | Sitemap pairs categories with cities from `cityCategories` (which carries its own ecosystem per entry). Used only to validate slugs. |
| L-3 | `src/app/api/vendors/route.ts:532` | `db.category.findFirst({ slug, active: true })` — slug is globally unique. |
| L-4 | `src/app/api/admin/subcategories/route.ts:18` | Admin endpoint (`requireAdmin`). Subcategory has no ecosystem field. |
| L-5 | `src/app/api/admin/categories/[id]/subcategories/route.ts:61` | Admin endpoint. Scoped by `categoryId` from URL. |
| L-6 | `src/app/api/admin/categories/route.ts:19` | Admin endpoint. Conditional ecosystem filter via `?ecosystem=` param. |
| L-7 | `src/app/api/admin/filters/[id]/values/route.ts:29` | Admin endpoint. Scoped by `groupId`. |
| L-8 | `src/app/api/admin/filters/route.ts:15` | Admin endpoint. `FilterGroup` has no ecosystem field. |
| L-9 | `src/app/api/admin/templates/[id]/preview/route.ts:111` | Admin endpoint. `FilterGroup` has no ecosystem field. |
| L-10 | `src/app/api/vendor/ai/classify/route.ts:51` | Vendor auth required. `BusinessType` has no ecosystem field. AI needs full list. |
| L-11 | `src/app/api/admin/business-types/route.ts:13` | Admin endpoint. Intentional cross-marketplace listing. |
| L-12 | `src/app/api/filters/vendor/route.ts:31` | Scoped to a single `vendorId`. Vendor's own ecosystem governs results. |
| L-13 | `src/app/api/filters/vendor/route.ts:113` | Vendor auth required. Validated via `CategoryFilter` membership. |
| L-14 | `src/app/api/filters/search/route.ts:51` | Returns vendor IDs only; the subsequent `db.vendor.findMany` applies `ecosystem` filter. |
| L-15 | `src/app/api/ai/search/route.ts:43` | `FilterGroup` has no ecosystem field. |
| L-16 | `src/app/api/ai/search/route.ts:136` | Returns vendor IDs only; downstream vendor query filters by ecosystem. |
| L-17 | `src/app/api/ai/vendor-assistant/route.ts:81` | Vendor auth required. Scoped to a single `vendorId`. |
| L-18 | `src/app/api/ai/insights/route.ts:114` | **Admin endpoint** (`requireAdmin`). Aggregation across both ecosystems is intentional for marketplace insights. |
| L-19 | `src/app/api/ai/listing-audit/route.ts:102` | Vendor auth required. Scoped to a single `vendorId`. |
| L-20 | `src/app/api/categories/route.ts:98` | Raw SQL aggregating vendors by `ecosystem, category` — groups by ecosystem correctly. |
| L-21 | `src/app/[ecosystem]/[[...path]]/page.tsx:263` | **Already filtered** by `ecosystem`. |
| L-22 | `src/app/near-me/[category]/page.tsx:91` | **Already filtered** by `ecosystem`. |
| L-23 | `src/app/api/categories/subcategories/route.ts:54` | `subcategory.findMany` — inherits filter from parent `cat.id` (which was filtered at line 43 when ecosystem provided). |

---

## 4. Queries That ARE Correctly Filtered ✅

| File:Line | Filter applied |
|-----------|----------------|
| `src/app/near-me/[category]/page.tsx:91` | `where: { ecosystem: eco, active: true, slug: { not: categorySlug } }` |
| `src/app/[ecosystem]/[[...path]]/page.tsx:263` | `where: { ecosystem, active: true, slug: { not: ctx.category } }` |
| `src/app/api/categories/route.ts:98` (raw SQL) | `GROUP BY ecosystem, category` on `vendor_listings` |

---

## 5. Recommendations for Fixes

### Priority 1 — HIGH (fix immediately)

**H-1. `src/app/api/business-types/route.ts` — add ecosystem enforcement**
```ts
// BEFORE
const types = await db.businessType.findMany({
  where: { categoryId: category, active: true },
  orderBy: { sortOrder: "asc" },
});

// AFTER
const ecosystem = resolveEcosystem(req.nextUrl.searchParams); // FINDMYBITES | PIMPMYPARTY
if (!ecosystem) {
  return NextResponse.json({ error: "ecosystem required" }, { status: 400 });
}
// Verify the category belongs to the requested ecosystem
const cat = await db.category.findFirst({
  where: { slug: category, ecosystem, active: true },
  select: { id: true },
});
if (!cat) {
  return NextResponse.json({ businessTypes: [] });
}
const types = await db.businessType.findMany({
  where: { categoryId: category, active: true },
  orderBy: { sortOrder: "asc" },
});
```
Also update the frontend caller (`src/components/dashboard/DynamicFilters.tsx` and any other caller of `/api/business-types`) to always pass `ecosystem`.

### Priority 2 — MEDIUM (defense-in-depth)

**M-1 / M-2. Make `ecosystem` a required param on public category APIs**
- `src/app/api/categories/route.ts` → return 400 if no `ecosystem` param.
- `src/app/api/categories/subcategories/route.ts` → return 400 if no `ecosystem` param.
- Audit all frontend callers to ensure they always pass `ecosystem` (most already do via the marketplace toggle).

**M-3. `src/app/api/ai/search/route.ts` — pre-filter the AI's category list**
```ts
// AFTER
categories = await db.category.findMany({
  where: { active: true, ...(ecosystem ? { ecosystem } : {}) },
  select: { slug: true, label: true, ecosystem: true },
});
```

**M-4. `src/app/api/vendor/ai/classify/route.ts` — server-side sanity check**
After the AI returns `{ marketplace, category }`, verify the category slug actually belongs to the returned marketplace:
```ts
const valid = await db.category.findFirst({
  where: { slug: result.category, ecosystem: result.marketplace, active: true },
});
if (!valid) {
  // AI hallucinated a cross-marketplace category — fallback or reject
}
```

**M-5. `src/app/api/vendors/route.ts:524` — scope subcategory existence check by category**
```ts
// Fetch matching category FIRST (already done at line 532 — reorder so it happens before the subcategory check)
const matchingCat = await db.category.findFirst({
  where: { slug: migrateCategory(category), active: true },
});
if (matchingCat) {
  const existingSub = await db.subcategory.findFirst({
    where: {
      label: { equals: subcategory.trim(), mode: "insensitive" },
      categoryId: matchingCat.id, // scope to THIS category only
    },
  });
  // ...
}
```

### Priority 3 — LOW (nice-to-have hardening)

**L-1. `src/lib/category-server.ts` — split cache by ecosystem**
Currently the in-memory cache holds categories from both ecosystems in one `Map`. Since slugs are globally unique this is functionally fine, but splitting the cache by ecosystem would:
- Reduce memory per request
- Make the isolation explicit
- Future-proof against any schema change that relaxes the `@unique` constraint on slug

**L-2. Document admin endpoints**
The admin endpoints in `/api/admin/*` intentionally list cross-marketplace records. Add a header comment to each confirming that this is by-design (some already have it, e.g. `admin/categories/route.ts` line 8).

---

## 6. Summary Stats

| Risk Level | Count | Notes |
|------------|-------|-------|
| 🔴 HIGH    | 1     | Public `/api/business-types` endpoint with no ecosystem enforcement |
| 🟡 MEDIUM  | 5     | Conditional filtering on public APIs + AI prompt context + subcategory existence check |
| 🟢 LOW     | 23    | Admin endpoints, scoped queries, by-design cross-ecosystem contexts, downstream-filtered queries |
| ✅ Already filtered | 3 | Public pages with explicit `where: { ecosystem, ... }` |
| **TOTAL**  | **29** queries audited (28 Prisma + 1 raw SQL) |

**Top recommendation:** Fix **H-1** (`/api/business-types`) before any release. It is the only truly exploitable cross-marketplace leakage path in the audited code.

---

## 7. Files Inspected (read-only, no modifications)

```
src/lib/category-server.ts
src/lib/search.ts (raw SQL — only touches vendor_listings, out of scope)
src/app/sitemap.ts
src/app/near-me/[category]/page.tsx
src/app/[ecosystem]/[[...path]]/page.tsx
src/app/api/categories/route.ts
src/app/api/categories/subcategories/route.ts
src/app/api/business-types/route.ts
src/app/api/filters/category/route.ts
src/app/api/filters/search/route.ts
src/app/api/filters/vendor/route.ts
src/app/api/vendors/route.ts
src/app/api/ai/search/route.ts
src/app/api/ai/vendor-assistant/route.ts
src/app/api/ai/insights/route.ts
src/app/api/ai/listing-audit/route.ts
src/app/api/vendor/ai/classify/route.ts
src/app/api/admin/categories/route.ts
src/app/api/admin/categories/[id]/route.ts
src/app/api/admin/categories/[id]/subcategories/route.ts
src/app/api/admin/categories/[id]/subcategories/[subId]/route.ts
src/app/api/admin/subcategories/route.ts
src/app/api/admin/subcategories/[id]/route.ts
src/app/api/admin/business-types/route.ts
src/app/api/admin/business-types/[id]/route.ts
src/app/api/admin/filters/route.ts
src/app/api/admin/filters/[id]/route.ts
src/app/api/admin/filters/[id]/values/route.ts
src/app/api/admin/templates/[id]/preview/route.ts
src/app/api/templates/resolve/route.ts (CategoryFilter — adjacent)
prisma/schema.prisma (model definitions only)
```

**Audit complete. No files were modified.**
