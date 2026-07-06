# Audit: Unsafe `.length` Accesses — P4-UNSAFE-LENGTH

**Scope:** All `.tsx` and `.ts` files under `/home/z/my-project/src/`
**Goal:** Find `.length` accesses that can raise `Cannot read properties of undefined (reading 'length')` at runtime.
**Mode:** Read-only audit. No files were modified.
**Worklog:** `/home/z/my-project/worklog.md` does not exist.

---

## Summary

| Severity | Count | Description |
|---|---|---|
| 🔴 High   | 2 files (3 sites)  | Confirmed crash when API returns a partial / unexpected payload — no defensive guard at all. |
| 🟠 Medium | 8 files (18 sites) | Accesses a sub-field of a guaranteed-defined API object without guarding the sub-field. Safe only as long as the server *always* returns the field; will crash the moment the server returns a partial/error payload. |
| ✅ Safe   | many | Already guarded with `?.`, `Array.isArray(...)`, `?? []`, `(x \|\| []).length`, or backed by `useState<T[]>([])`. |

The highest-risk components (VendorCard, VendorModal, BrowseSection, FilterSidebar, AiListingGenerator, MyListing, Enquiries, customer/vendor bookings, vendor-dashboard) were checked first and were **all safe** — they consistently default API arrays via `?? []`, optional chaining, or `useState<T[]>([])`. The remaining risks cluster in (a) two AI-result components that trust `setResult(json)` directly, and (b) several marketing/inventory/admin analytics widgets that index into `data.X.length` without per-field guards.

---

## 🔴 High-severity findings (fix immediately)

### 1. `src/components/marketing/marketing-seo-center.tsx`

```tsx
// Line 118
<Label className="text-xs">Meta Title ({draft?.metaTitle.length || 0}/60)</Label>

// Line 122
<Label className="text-xs">Meta Description ({draft?.metaDescription.length || 0}/160)</Label>
```

**Why unsafe:** The optional chain `draft?.metaTitle.length` only short-circuits when `draft` is nullish. If `draft` exists but `metaTitle` (or `metaDescription`) is `undefined`, JavaScript evaluates `draft.metaTitle.length`, which throws `Cannot read properties of undefined (reading 'length')`. This exact situation is reachable: `generate()` at line 55 does `setDraft({ metaTitle: json.seo.metaTitle, metaDescription: json.seo.metaDescription, keywords: json.seo.keywords })` — if the AI endpoint omits `metaTitle`/`metaDescription`, the draft state holds `undefined` for that field and the next render crashes.

**Suggested fix:**
```tsx
<Label className="text-xs">Meta Title ({draft?.metaTitle?.length || 0}/60)</Label>
<Label className="text-xs">Meta Description ({draft?.metaDescription?.length || 0}/160)</Label>
```
Or normalise the draft when setting it: `metaTitle: json.seo.metaTitle ?? ""`.

---

### 2. `src/components/marketing/marketing-social-generator.tsx`

```tsx
// Line 131
{result.hashtags.length > 0 && (
```

**Why unsafe:** `result` is set directly from the API response with no normalisation:

```tsx
// Line 52
if (json.caption) { setResult(json); toast.success("Post generated"); }
```

If the AI endpoint returns `{ caption: "..." }` without a `hashtags` array, `result.hashtags` is `undefined` and `result.hashtags.length` throws. The component declares `hashtags: string[]` in its type, but the runtime payload is unvalidated.

**Suggested fix:** Normalise the response when setting state, and/or use optional chaining:
```tsx
// Option A — normalise:
if (json.caption) {
  setResult({ caption: json.caption, hashtags: Array.isArray(json.hashtags) ? json.hashtags : [] });
  toast.success("Post generated");
}

// Option B — defensive access:
{result.hashtags?.length > 0 && (
```

---

## 🟠 Medium-severity findings (defensive guards recommended)

These accesses are on `data.X.length` where `data` itself is guarded by an `if (!data) return` early-return, but **the inner field `X` is not guarded**. Each is safe today because the corresponding server route happens to always return that field, but there is no client-side protection — a future API change, a 200-with-partial-body, or a server catch-block that returns a smaller object will crash the page.

### 3. `src/components/admin/admin-categories.tsx`

```tsx
// Line 268
`Delete "${cat.label}"?\nThis will also remove its ${cat.subcategories.length} subcategor${cat.subcategories.length === 1 ? "y" : "ies"}. …`

// Line 643
{cat.subcategories.length > 0 && (

// Line 648 (×2 inside template literal)
{cat.subcategories.length} subcategor{cat.subcategories.length === 1 ? "y" : "ies"}

// Line 861
{cat.subcategories.length === 0 ? (
```

**Why unsafe:** The same file already treats `subcategories` as possibly-undefined at line 378:
```tsx
(sum, c) => sum + (c.subcategories?.length ?? 0)
```
So the codebase itself acknowledges the field can be missing. The `Category` interface declares it as required, but the API surface isn't enforced.

**Suggested fix:** Use the same defensive pattern everywhere:
```tsx
cat.subcategories?.length ?? 0
```

---

### 4. `src/components/marketplace/vendor-ai-sections.tsx`

```tsx
// Line 136
if (!data || (data.loved.length === 0 && data.mostMentioned.length === 0)) {

// Line 143
{data.loved.length > 0 && (

// Line 157
{data.mostMentioned.length > 0 && (

// Line 171
{data.improvements.length > 0 && (
```

**Why unsafe:** `data` is set with `setData(d)` directly from `await r.json()` (line 122). The API (`/api/ai/review-summary`) does return all three arrays in every code path today, but if the endpoint ever returns a partial body (or the fetch is intercepted by middleware that returns a different shape), `data.loved.length` throws. Note `data.improvements` is read on line 171 even when lines 136/143/157 have already passed — so the `!data ||` guard on line 136 does not protect line 171.

**Suggested fix:** Normalise on load:
```tsx
.then((d) => {
  setData({
    loved: Array.isArray(d?.loved) ? d.loved : [],
    mostMentioned: Array.isArray(d?.mostMentioned) ? d.mostMentioned : [],
    improvements: Array.isArray(d?.improvements) ? d.improvements : [],
  });
  setLoading(false);
})
```
Or use `data.loved?.length` everywhere.

---

### 5. `src/components/admin/admin-marketing.tsx`

```tsx
// Line 58
{data.mostActiveVendors.length === 0 ? <Empty /> : (
// Line 73
{data.leastActiveVendors.length === 0 ? <Empty /> : (
// Line 89
{data.campaignUsage.length === 0 ? <Empty /> : (
// Line 106
{data.aiUsage.length === 0 ? <Empty /> : (
// Line 125
{data.topCities.length === 0 ? <Empty /> : (
// Line 141
{data.topCategories.length === 0 ? <Empty /> : (
// Line 158
{data.revenueByPlan.length === 0 ? <Empty /> : (
```

**Why unsafe:** `data` is guarded by `if (!data) return …` on line 38, but every array field is read directly. The API route sets all fields, but the catch-block in `GET /api/admin/marketing` could evolve; any partial payload crashes the admin marketing tab.

**Suggested fix:** Either normalise when setting state (`setData({ ...emptyStats, ...d })`) or access defensively: `data.mostActiveVendors?.length === 0`.

---

### 6. `src/components/marketing/marketing-competitors.tsx`

```tsx
// Line 85
{data.suggestions.length > 0 && (
```

**Why unsafe:** `data` is guarded by `if (!data) return` on line 26, but `data.suggestions` is read directly. The component does `setData(d.competitors)` where `d.competitors` comes from the analytics API with no shape validation.

**Suggested fix:**
```tsx
{Array.isArray(data.suggestions) && data.suggestions.length > 0 && (
```
Or normalise: `setData({ ...emptyCompetitorData, ...d.competitors })`.

---

### 7. `src/components/marketing/marketing-seo-center.tsx` (second site)

```tsx
// Line 194
{data.suggestions.length > 0 && (
```

**Why unsafe:** Same pattern as #6 — `data` is guarded (line 80) but `data.suggestions` is not. `setData(d)` is called directly from the API response.

**Suggested fix:** `data.suggestions?.length > 0` or normalise the response.

---

### 8. `src/components/inventory/inventory-dashboard.tsx`

```tsx
// Line 82
value={String(data.upcomingBookings.length)}
// Line 106
{data.alerts.length === 0 ? (
// Line 143
<Badge …>{data.upcomingBookings.length}</Badge>
// Line 145
{data.upcomingBookings.length === 0 ? (
```

**Why unsafe:** `data` is guarded (line 58), but `upcomingBookings` and `alerts` are read directly. The `DashboardData` interface marks them required, but `setData(await res.json())` on line 40 trusts the server unconditionally.

**Suggested fix:** Normalise when setting:
```tsx
setData({
  upcomingBookings: Array.isArray(d.upcomingBookings) ? d.upcomingBookings : [],
  alerts: Array.isArray(d.alerts) ? d.alerts : [],
  // …other fields with sensible defaults
});
```

---

### 9. `src/components/inventory/inventory-analytics.tsx`

```tsx
// Line 113
{data.topProducts.length === 0 ? (
// Line 131
{data.lowInventory.length === 0 ? (
```

**Why unsafe:** Same as #8 — `data` is guarded (line 50) but `topProducts` and `lowInventory` are not. `setData(d)` on line 38 trusts the server.

**Suggested fix:** Normalise on load, or use `data.topProducts?.length` / `data.lowInventory?.length`.

---

### 10. `src/components/marketing/marketing-performance.tsx`

```tsx
// Line 107
<BarChart data={topProducts.map((p) => ({ name: p.name.length > 10 ? p.name.slice(0, 9) + "…" : p.name, …}))} />
```

**Why unsafe:** `topProducts` is set via `setTopProducts(d.topProducts || [])` (line 26) — that part is safe. But each `p.name` is read directly. If the API returns a top-product row with `name: null` (e.g. a soft-deleted product), `p.name.length` throws.

**Suggested fix:**
```tsx
name: (p.name?.length ?? 0) > 10 ? p.name.slice(0, 9) + "…" : (p.name ?? "")
```

---

### 11. `src/components/success-center/success-center.tsx`

```tsx
// Line 128
{data.series.length > 0 && (
// Line 148
{data.competitors.length > 0 && (
```

**Why unsafe:** `data` is guarded (line 65), but `series` and `competitors` are read directly. `setData(d)` on line 57 trusts the server.

**Suggested fix:** `data.series?.length > 0` / `data.competitors?.length > 0`, or normalise the response on load.

---

## ✅ Components audited and confirmed safe

These priority components were checked line-by-line for `.length` accesses and were **already safe**. Listed here so the next reviewer doesn't re-check them:

| File | Why safe |
|---|---|
| `src/components/marketplace/vendor-card.tsx` | No `.length` accesses at all. |
| `src/components/marketplace/vendor-modal.tsx` | `products = productsData?.products ?? []`; `pImages = p.images ?? (p.image ? [p.image] : [])`; `images = product.images ?? (product.image ? [product.image] : [])`; `vendor.gallery && vendor.gallery.length > 0`; `vendor.reviews?.length`. All accesses guarded. |
| `src/components/marketplace/browse-section.tsx` | `vendors = data?.vendors ?? []`; `cats = useMemo(... [])`; `filteredVendors = useState<any[]>([])`; `results.length` in `onResults` callback — FilterSidebar always passes `[]` or `data.vendors \|\| []`. |
| `src/components/marketplace/filter-sidebar.tsx` | `filters = useState<FilterGroup[]>([])`; `groupSelected.length` is a filter result. |
| `src/components/marketplace/ai-listing-generator.tsx` | `result.description.length` (line 217) is safe — `result` is normalised to `{ description: String(...), keywords: Array.isArray(...) ? ... : [], … }` on line 79–85. `result.keywords && result.keywords.length > 0` etc. all guarded. |
| `src/components/marketplace/image-upload.tsx` | No `.length` accesses. |
| `src/components/dashboard/MyListing.tsx` | `gallery = useState<string[]>([])`; `computeBusinessScore(form, gallery, productCount)` — gallery always an array; `(form.metaTitle \|\| "").length`; `data.tags?.length`; `data.seo.keywords?.length`; `profile.tags?.length`. All safe. |
| `src/components/dashboard/Enquiries.tsx` | `leads = useState<...>(bookings)` where bookings prop is `(Booking & ...)[]`; `validItems = lineItems.filter(...)`; `Object.keys(out).length`. `lineItems` is `useState<QuoteLineItem[]>([])`. |
| `src/components/dashboard/listing-ai-tools.tsx` | `tags = typeof form.tags === "string" ? ... : (Array.isArray(form.tags) ? form.tags : [])`; `form.description && form.description.length >= 50`; `profile.keywords?.length > 0`; `missingItems = data.sections.filter(...)`. All guarded. |
| `src/components/dashboard/Products.tsx` | `allProducts = useState<...>([])`; `filteredProducts.length` is a derived filter; `p.images && p.images.length > 0`. |
| `src/components/dashboard/Overview.tsx` | `bookings.length` (prop, required array); `vendor.gallery.length` — `Vendor.gallery: string[]` is required by type and the dashboard always populates it. |
| `src/components/dashboard/product-wizard.tsx` | `form.metaTitle?.trim()` guards `form.metaTitle.length`; `form.images?.length > 0`; `(form.shortDescription \|\| "").length`; `(form.metaTitle \|\| "").length`. All guarded. |
| `src/components/dashboard/address-autocomplete.tsx` | `query.trim().length` (string state); `results = useState<AddressResult[]>([])`. |
| `src/components/dashboard/billing-history.tsx` | `history = useState<PaymentHistoryEntry[]>([])`. |
| `src/components/dashboard/Messages.tsx` | `id.length` (string); `filtered = useState<...>([])`; `attachments.length` (local state array). |
| `src/components/dashboard/TemplateForm.tsx` | `images.length` and `entries.length` are local component state arrays. |
| `src/components/dashboard/Availability.tsx` | `cells.length` (locally built array); `entries.length` (state array); `slots = useState<...>([])`. |
| `src/components/dashboard/Analytics.tsx` | `dailyEntries.length` (derived); `Object.keys(data?.productViews ?? {}).length`. |
| `src/components/dashboard/DynamicFilters.tsx` | `Array.isArray(values) && values.length > 0`; `filters = useState<...>([])`. |
| `src/components/dashboard/subscription-dashboard.tsx` | No `.length` accesses. |
| `src/components/dashboard/image-upload.tsx` | `images.length` (local state array). |
| `src/components/dashboard/Notifications.tsx` | `notifications.filter(...).length` and `notifications.length` — `notifications = useState<...>([])`. |
| `src/components/vendor-dashboard/vendor-dashboard.tsx` | `data?.vendors[0]`; `bookings = data?.bookings ?? []`; `reviews = data?.reviews ?? []`; `products = data?.products ?? []`; `vendor?.gallery?.length`; `(v.gallery?.length ?? 0)`; `catConfig.extraFields.length` (always defaulted via `getCategoryFields`); `Object.entries(p.extraFields).filter(...).length` (preceded by `p.extraFields &&`). |
| `src/components/inventory/inventory-manager.tsx` | `state.serviceCities.length`, `state.availableDays.length` — state arrays; `blocks.length` (state array). |
| `src/components/bookings/vendor-bookings-dashboard.tsx` | `filteredBookings = useMemo(...)` (filter result); `bookings = useState<...>([])`. |
| `src/components/bookings/customer-bookings.tsx` | `upcoming`/`completed`/`cancelledBookings` are all derived via `for (const b of bookings) { … push … }`; `bookings = useState<...>([])`. |
| `src/components/bookings/admin-bookings.tsx` | `bookings = data?.bookings ?? []`; `trimmed.length` (string). |
| `src/components/bookings/booking-form.tsx` | (no `.length` accesses that read untrusted data) |
| `src/components/admin/admin-panel.tsx` | `vendor.gallery && vendor.gallery.length > 0`; `filtered.length`/`pendingVendors.length`/`filteredVendors.length` are derived; `signupsData = useState<...>([])`; `activity = useState<...>([])`. |
| `src/components/admin/admin-vendors.tsx` | `vendors.length` (state array). |
| `src/components/admin/admin-filters.tsx` | `g.values.length` — Prisma `include: { values: ... }` always returns an array; `g.categories?.length \|\| 0` (optional chaining). |
| `src/components/admin/admin-templates.tsx` | `template.fields?.length ?? 0`; `template._count?.mappings ?? template.mappings?.length ?? 0`; `versionInfo && versionInfo.snapshots.length` (snapshots always set to `[]` via `Array.isArray(d.snapshots) ? d.snapshots : []`); `usage.mappings && Array.isArray(usage.mappings) && usage.mappings.length > 0`; `safeDelete?.check.blockReasons && safeDelete.check.blockReasons.length > 0`; `!auditLogs ? … : auditLogs.length === 0`; `staticOptions`/`subFields`/`toggleOptions`/`conditionValuesList` are all `splitLines(...)` which always returns `[]`. |
| `src/components/admin/admin-vendor-invitations.tsx` | `pendingVendors.length` (state array); `filteredPending.length` (filter result). |
| `src/components/admin/admin-lead-center.tsx` | `Object.keys(out).length`; `leads.length`; `scored.length`; `agesHour.length` (locally built). |
| `src/components/admin/admin-claims.tsx` | `vendorIds.length`, `userIds.length` (locally built); `claims.filter(...).length`; `query.length` (string). |
| `src/components/admin/admin-subscriptions.tsx` | `expiring.length`, `expired.length` (state arrays / filter results). |
| `src/components/admin/admin-featured.tsx` | `slots = useState<...>([])`. |
| `src/components/admin/admin-broadcasts.tsx` | `history.length` (state array). |
| `src/components/admin/admin-support.tsx` | `tickets.length`, `internalNotes.length` (state arrays); `m.attachments?.length > 0` (optional chaining). |
| `src/components/admin/admin-business-types.tsx` | `types.length`, `filtered.length` (state / derived). |
| `src/components/admin/admin-josh-logs.tsx` | `filtered.length` (derived). |
| `src/components/admin/admin-pricing.tsx` | `pricing = useState<...>([])`. |
| `src/components/admin/admin-reviews.tsx` | `reviews.length`; `AVATAR_COLORS.length` (constant). |
| `src/components/admin/admin-categories.tsx` | `categories.length`, `filteredClaims.length` etc. (state arrays) — **only `cat.subcategories.length` is unsafe** (see #3). |
| `src/components/admin/admin-inventory.tsx` | `filtered.length` (derived). |
| `src/components/admin/admin-promo-codes.tsx` | `chars.length` (constant). |
| `src/components/admin/admin-seo-pages.tsx` | `filteredPages.length`, `stats.pages.length` (state arrays). |
| `src/components/admin/admin-vendor-onboarding.tsx` | `filtered.length` (derived). |
| `src/components/admin/vendor-delete-modal.tsx` | `vendorNames.length` (guarded by `vendorNames && vendorNames.length > 1`); `reason.trim().length` (string). |
| `src/components/admin/cleanup-test-vendors.tsx` | `vendors.length` (state array); `reason.trim().length` (string). |
| `src/components/admin/admin-analytics-extras.tsx` | `MRR_DATA.length` (constant). |
| `src/components/marketing/marketing-campaigns.tsx` | `campaigns = useState<...>([])`. |
| `src/components/marketing/marketing-referral.tsx` | `referrals = useState<...>([])`. |
| `src/components/marketing/marketing-review-booster.tsx` | `requests = useState<...>([])`. |
| `src/components/marketing/marketing-overview.tsx` | `data && data.recommendations.length === 0` — `recommendations` is initialised to `[]` in the `setData` call and only overwritten when `json.recommendations` is truthy. |
| `src/components/marketing/marketing-email.tsx`, `marketing-whatsapp.tsx`, `marketing-upsell.tsx`, `marketing-qr.tsx`, `marketing-social-generator.tsx` (other than line 131) | All use `useState<T[]>([])` and optional chaining. |
| `src/components/growth-manager/growth-manager.tsx` | `actions = useState<any[]>([])`; `data.checks?.filter(...).length \|\| 0`; `data.suggestions?.length > 0`; `data?.competitors?.length`; `items = useState<any[]>([])`; `result.hashtags?.length > 0` (line 354 — already uses `?.`, unlike line 131 of marketing-social-generator). |
| `src/components/marketplace/inspiration-gallery.tsx` | `items = useState<GalleryItem[]>([])`; `gallery = typeof v.gallery === "string" ? JSON.parse(...) : (v.gallery ?? [])`. |
| `src/components/marketplace/recently-viewed-compare.tsx` | `vendors = useState<any[]>([])`; `compareIds = useState<string[]>([])` populated from `getCompareList()` which always returns `[]` on error. |
| `src/components/marketplace/trending-products-section.tsx` | `products = useState<...>([])`. |
| `src/components/marketplace/verified-vendors-section.tsx` | `vendors = useState<any[]>([])`; `r.ok ? r.json() : { vendors: [] }`. |
| `src/components/marketplace/popular-cities-section.tsx` | `cities = useState<...>([])`. |
| `src/components/marketplace/recent-vendors-section.tsx` | (uses `RecentlyViewedSection` — safe.) |
| `src/components/marketplace/categories-section.tsx` | No `.length` accesses. |
| `src/components/marketplace/world-presence.tsx` | `data ? String(data.continents.length) : "—"` — the `/api/stats` route always returns `continents: []` even on error. |
| `src/components/marketplace/vendor-highlights.tsx` | (no `.length` issues) |
| `src/components/marketplace/vendor-comparison.tsx` | (state arrays only) |
| `src/components/marketplace/quote-dialog.tsx`, `vendor-cta.tsx`, `vendor-ai-chat.tsx`, `vendor-image.tsx`, `smart-enquiry-form.tsx`, `booking-form.tsx`, `pending-vendor-banner.tsx`, `upgrade-prompt.tsx`, `mobile-bottom-nav.tsx`, `countdown-timer.tsx`, `animated-counters.tsx`, `home-hash-link.tsx`, `trust-badges.tsx`, `trust-strip.tsx`, `location-banner.tsx`, `list-vendor-dialog.tsx`, `stats-bar.tsx`, `theme-toggle.tsx`, `site-header.tsx`, `site-footer.tsx`, `event-type-section.tsx`, `featured-section.tsx`, `near-me-section.tsx`, `how-it-works.tsx`, `become-vendor.tsx`, `reviews-carousel.tsx`, `review-form.tsx`, `review-list.tsx`, `star-rating.tsx`, `premium-hero.tsx`, `hero.tsx`, `icon.tsx`, `ecosystem-sync.tsx`, `ecosystem-toggle.tsx` | No unsafe `.length` accesses. |
| `src/components/ai-chat/ai-chat-widget.tsx` | `data.messages && data.messages.length > 0`; `Array.isArray(data.cards) && data.cards.length > 0`; `Array.isArray(data.suggestions) && data.suggestions.length > 0`. All guarded. |
| `src/components/auth/sign-in-dialog.tsx`, `user-menu.tsx` | (no `.length` issues) |
| `src/components/seo/*` | (no `.length` issues) |
| `src/components/support/*` | (state arrays only) |
| `src/components/SubscriptionModal.tsx` | (no `.length` issues) |
| `src/components/setup-assistant/setup-assistant.tsx` | (state arrays only) |
| `src/components/ui/*` | (shadcn primitives — no `.length` issues) |
| `src/components/analytics/*` | (no `.length` issues) |
| `src/components/dashboard/Sidebar.tsx` | (no `.length` issues) |
| `src/app/product/[slug]/product-page-client.tsx` | `product.images.length`, `product.includes.length`, `product.dietaryTags.length`, `product.allergens.length` — all guaranteed arrays by `/api/products/detail` (uses `parseJsonArray` with `?? []`); `related` likewise; `gallery` is derived from those. `data.product` is null-checked first. |
| `src/app/vendor/[slug]/vendor-profile-client.tsx` | `vendor.gallery.length`, `vendor.tags.length`, `vendor.reviews.length` — all guaranteed arrays by `getVendor` (uses `parseJsonArray` and Prisma `include: { reviews: ... }`); `products = productsData?.products ?? []`; `similarVendors = useState<any[]>([])`; `ProductCard` defaults `includes`, `dietaryTags`, `images` to `[]` locally; `tags` is locally built. |
| `src/app/account/customer-dashboard.tsx` | `bookings = useState<...>([])`; `wishlist = useState<...>([])`; all derived via `.filter(...)`. |
| `src/app/vendor/dashboard/VendorDashboardPage.tsx` | `vendor.gallery && vendor.gallery.length > 0` (guarded). |
| `src/app/admin/AdminPanelPage.tsx` | `vendor.gallery && vendor.gallery.length > 0` (guarded). |
| `src/app/near-me/near-me-client.tsx`, `src/app/[ecosystem]/[[...path]]/seo-page-client.tsx`, `src/app/about/about-client.tsx`, `src/app/claim/[vendorId]/page.tsx`, `src/app/claim-token/[token]/page.tsx`, `src/app/claim-status/page.tsx`, `src/app/activate/[token]/page.tsx` | (no `.length` issues) |
| All `src/app/api/**/route.ts` files | Server-side; not part of the React-runtime-crash scope, but where relevant the API has been inspected to confirm whether the corresponding client access is actually safe (e.g. `/api/stats`, `/api/admin/categories`, `/api/products/detail`, `/api/vendor/[slug]`, `/api/ai/review-summary`). |

---

## Recommended next actions

1. **Fix the two high-severity files first** (`marketing-seo-center.tsx`, `marketing-social-generator.tsx`). These are reachable from production user flows (vendor marketing dashboard) and crash on a single missing field in an AI response.
2. **For the medium-severity files**, the cheapest and most uniform fix is to normalise the API response at the `setData(...)` call site — construct a fully-populated default object and spread the server payload over it:
   ```tsx
   setData({ ...defaultData, ...(d ?? {}) });
   ```
   This is preferable to scattering `?.` calls because it keeps the rendering code clean and also protects against any *future* field added to the type but not yet returned by the server.
3. **For `admin-categories.tsx` specifically**, the inconsistency between line 378 (`c.subcategories?.length ?? 0`) and lines 268/643/648/861 (`cat.subcategories.length`) suggests the developer already knows the field can be missing — apply the same defensive pattern to those four sites.
4. **Add an ESLint rule** (e.g. `@typescript-eslint/no-unsafe-member-access` plus a custom rule banning `X.length` where `X` is not provably an array) to catch this class of bug at build time. The project already has `eslint.config.mjs` — adding the rule there will prevent regressions.
5. **Consider a small `normalise<T>(defaults: T, partial: unknown): T` helper** in `src/lib/utils.ts` so all analytics widgets can share the same defensive pattern with one line of code each.

---

## Methodology

1. Worklog check: `/home/z/my-project/worklog.md` does not exist — proceeded with fresh audit.
2. Enumerated all `.tsx` and `.ts` files under `src/` via `LS`.
3. Grepped each priority component (VendorCard, VendorModal, BrowseSection, FilterSidebar, AiListingGenerator, GalleryUpload/ImageUpload, dashboard widgets, vendor-dashboard, AI listing, product page, vendor profile) for `\.length\b`.
4. For every match, opened the surrounding code to verify whether the object was (a) nullable, (b) defaulted via `?? []`, (c) guarded by `?.`, or (d) backed by `useState<T[]>([])`.
5. For matches that looked unsafe, traced the variable back to its source (API route, parent prop, or local state) to determine whether the server contract guaranteed the field.
6. Cross-checked the corresponding API route (`/api/admin/categories`, `/api/stats`, `/api/products/detail`, `/api/ai/review-summary`, etc.) to confirm whether the server always returns the field.
7. Categorised each finding as High (crash reachable today), Medium (crash reachable if API contract breaks), or Safe.
8. No files were modified — this is a read-only audit.
