# QA Phase 6–7 Report — SEO & Production Readiness Audit

**Task ID:** QA-PHASE6-7-SEO-PROD
**Auditor:** QA Engineer (Explore sub-agent)
**Project:** /home/z/my-project (FindMyBites × PimpMyParty — Next.js)
**Mode:** Read-only audit. No files modified.
**Date:** 2025 audit pass

---

## Executive Summary

| Section | Pass | Partial | Fail |
|---|---|---|---|
| **Part 1 — SEO** | 5 | 2 | 0 |
| **Part 2 — Production** | 3 | 3 | 2 |

**Critical blockers for production launch:**
1. `.env` only contains `DATABASE_URL=file:/home/z/my-project/db/custom.db` — a local SQLite file. All real secrets (Supabase, Razorpay, Google OAuth, ZAI, GA4, Places, cron) are MISSING. A `.env.example` template does NOT exist.
2. `vercel.json` is absent — cron-ready endpoints exist but are NOT scheduled anywhere, so booking/subscription reminders will never fire.
3. Server-side `/api/geocode` uses OSM Nominatim only (no Google Places primary) — does not match the "Google Places primary → OSM fallback" requirement. Client-side `address-autocomplete.tsx` does this correctly.
4. Logging migration is ~10% complete: only 18 of 178 API routes use the structured `@/lib/logger`; 108 routes still use bare `console.*` (314 occurrences).

**SEO is production-grade:** dynamic metadata, JSON-LD on every public-facing route type, sitemap auto-derives from DB, robots.txt is correctly configured with sitemap reference.

---

# PART 1 — SEO VALIDATION

## 1. Metadata — `src/app/layout.tsx`  ✅ PASS

**File:** `src/app/layout.tsx`

- Line 34: `export const metadata: Metadata = { ... }` — ✓ present (static const, not `generateMetadata`)
- Line 35: `metadataBase: new URL("https://www.findmybites.com")` — ✓ canonical-base URL set (Next.js resolves relative `alternates.canonical` paths against this)
- Line 36: `title` — ✓ present
- Line 37: `description` — ✓ present (well-written marketplace description)
- Lines 39–50: `keywords` array — ✓ present
- Lines 51: `authors` — ✓ present
- Lines 52–58: `icons` (svg + png + apple-touch-icon) — ✓ present
- Line 59: `manifest: "/site.webmanifest"` — ✓ present
- Lines 60–64: `appleWebApp` — ✓ present
- Lines 65–80: `openGraph` block — ✓ present (title, description, type=website, url, siteName, images[1344×768])
- Lines 81–87: `twitter` block — ✓ present (card=summary_large_image, title, description, images)
- Lines 28–32: `viewport` export (themeColor, width, initialScale) — ✓ separate export (Next 14+ requirement)

**Canonical URL support:**
- `metadataBase` provides the base for resolving relative canonical URLs — ✓ present
- ⚠️ No top-level `alternates.canonical` for the homepage (`/`) itself. Recommended to add `alternates: { canonical: "https://www.findmybites.com" }`.

**Verdict: PASS** — title, description, openGraph, twitter all present; canonical base via `metadataBase`.

---

## 2. Sitemap — `src/app/sitemap.ts`  ✅ PASS

**File:** `src/app/sitemap.ts` (198 lines)

- Line 1: `import type { MetadataRoute } from "next"` — ✓
- Line 28: `export default async function sitemap(): Promise<MetadataRoute.Sitemap>` — ✓ default export
- Line 22: `export const revalidate = 3600` — ✓ ISR (1hr regeneration)

**URL coverage:**
| URL Type | Generated | Source |
|---|---|---|
| Static pages (home, /findmybites, /pimpmyparty, /near-me, /about, /contact) | ✓ | Lines 33–40 (hard-coded) |
| Hand-crafted Dubai/UAE cake landing pages | ✓ | Lines 43–50 (`CAKE_PAGES` from `@/lib/cake-pages`) |
| AUTO keyword pages (`/[category]-[city]`) | ✓ | Lines 60–66 (`getAllSEOPages()`) |
| AUTO city/category pages (`/[city]/[category]`) | ✓ | Lines 67–73 |
| AUTO city pages (`/[city]`) | ✓ | Lines 77–84 (`getAllCities()`) |
| AUTO near-me pages (`/near-me/[category]`) | ✓ | Lines 87–94 (`getAllCategories()`) |
| Country pages (`/findmybites/[country]` + `/pimpmyparty/[country]`) | ✓ | Lines 122–137 |
| City pages under ecosystem (`/[eco]/[country]/[city]`) | ✓ | Lines 140–155 |
| Category pages per city (`/[eco]/[country]/[city]/[category]`) | ✓ | Lines 167–182 (with DB-validated category slugs) |
| Vendor pages (`/vendor/[slug]`) | ✓ | Lines 185–192 (up to 5000 vendors) |

**Observations:**
- All dynamic URLs are derived from the DB (`db.vendor.findMany`, `db.vendor.groupBy`) — new cities/categories auto-appear.
- All DB calls are wrapped in `.catch(() => [])` so a DB outage returns static pages only — graceful degradation.
- ⚠️ **Gap:** Product pages (`/product/[slug]`) are NOT in the sitemap. There is a dedicated `/api/products/trending` and `/api/products/related` infrastructure; product slugs should be added to the sitemap.
- ⚠️ Each keyword page is emitted with priority 0.8 and city pages 0.7 — priorities look reasonable.
- lastModified for vendors uses `v.updatedAt` (good). For auto pages it uses `new Date()` (acceptable — reflects "current").

**Verdict: PASS** — comprehensive coverage of vendors, categories, cities, ecosystems, and static pages.

---

## 3. robots.txt — `src/app/robots.ts`  ✅ PASS

**File:** `src/app/robots.ts` (15 lines)

- Line 1: `import type { MetadataRoute } from "next"` — ✓
- Line 6: `export default function robots(): MetadataRoute.Robots` — ✓ default export
- Lines 8–12: `rules` block:
  - `userAgent: "*"`
  - `allow: "/"`
  - `disallow: ["/api/", "/admin", "/vendor/dashboard"]` — ✓ correctly disallows internal/admin surfaces (note: `/admin` is a prefix match — would also block `/administrators` if any existed; safe here)
- Line 13: `sitemap: "https://findmybites.com/sitemap.xml"` — ✓ references sitemap URL

**Note:** A static `public/robots.txt` also exists but contains only per-bot Allow rules without a sitemap reference. Next.js gives precedence to `src/app/robots.ts` (metadata route), so the dynamic one wins in production.

**Verdict: PASS** — properly configured with allow/disallow rules and sitemap reference.

---

## 4. JSON-LD Structured Data  ✅ PASS (13 files)

Search for `application/ld+json|JsonLd|schema.org` across `src/` returns 13 files.

### Pages with structured data:

| File | Schema Types |
|---|---|
| `src/app/page.tsx` (Homepage, line 70) | `Marketplace` (name, url, description, areaServed, knowsAbout) |
| `src/app/vendor/[slug]/page.tsx` (lines 148–184 + 187–210) | `Bakery` / `LocalBusiness` (with address, geo, aggregateRating, priceRange, servesCuisine) + `BreadcrumbList` |
| `src/app/product/[slug]/page.tsx` (lines 118–143 + 155–178) | `Product` (with brand, offers, aggregateRating, sku) + `BreadcrumbList` |
| `src/app/[ecosystem]/[[...path]]/page.tsx` (via `generateJsonLd`) | `WebSite` (with SearchAction), `BreadcrumbList`, `ItemList`, `FAQPage` |
| `src/app/near-me/[category]/page.tsx` (lines 83–86) | `BreadcrumbList` + `FAQPage` |
| `src/components/seo/AutoSEOLanding.tsx` (lines 152–158) | Renders array of JSON-LD (Breadcrumb + FAQ + ItemList) |
| `src/components/seo/CakeLanding.tsx` (via `buildCakeJsonLd`) | BreadcrumbList + ItemList + FAQPage |
| `src/components/seo/keyword-landing.tsx` (lines 36–42, via `buildKeywordJsonLd`) | BreadcrumbList + ItemList + FAQPage |
| `src/lib/seo.ts` (lines 104–195) | `generateJsonLd()` helper — produces WebSite + Breadcrumb + ItemList + FAQ |
| `src/lib/seo-content.ts` (lines 266–327) | Helpers: `generateBreadcrumbJsonLd`, `generateFAQJsonLd`, `generateItemListJsonLd` |
| `src/lib/cake-pages.ts` | `buildCakeJsonLd()` helper |
| `src/lib/keyword-pages.ts` | `buildKeywordJsonLd()` helper |
| `src/app/[ecosystem]/[[...path]]/seo-page-client.tsx` | Receives `jsonLd` prop and renders via `<script type="application/ld+json">` |

**Coverage assessment:**
- ✓ Homepage — Marketplace schema
- ✓ Vendor profiles — LocalBusiness/Bakery + Breadcrumbs + AggregateRating
- ✓ Product pages — Product + Offer + AggregateRating + Breadcrumbs
- ✓ Ecosystem landing pages — WebSite + Breadcrumbs + ItemList + FAQ
- ✓ City/category pages — Breadcrumbs + ItemList + FAQ
- ✓ Near-me pages — Breadcrumbs + FAQ
- ✓ Keyword landing pages (cake + dj + catering, etc.) — Breadcrumbs + ItemList + FAQ
- ⚠️ Missing on static content pages (about, contact, privacy, terms, blog, careers, help, trust-safety) — should add `Organization` or `WebPage` schema at minimum.

**Verdict: PASS** — comprehensive structured data across all dynamic public-facing pages.

---

## 5. Open Graph Coverage  ⚠️ PARTIAL PASS

Search for `openGraph|og:|opengraph` in `src/app` returns 5 files:

| File | openGraph present | Notes |
|---|---|---|
| `src/app/layout.tsx` (lines 65–80) | ✓ | title, description, type, url, siteName, images[1344×768] |
| `src/app/vendor/[slug]/page.tsx` (lines 123–129) | ✓ | dynamic — title, description, type, url, images |
| `src/app/product/[slug]/page.tsx` (lines 90–96) | ✓ | dynamic — title, description, type, url, images |
| `src/app/near-me/page.tsx` (lines 8–14) | ✓ | title, description, url, type |
| `src/app/api/admin/templates/import/route.ts` | false positive | API route (irrelevant) |

**Indirect OG coverage via metadata helper functions in `src/lib/seo-content.ts`:**
- `generateKeywordMetadata` (line 336) — includes openGraph ✓
- `generateCityMetadata` (line 364) — includes openGraph ✓
- `generateCityCategoryMetadata` (line 391) — includes openGraph ✓
- `generateNearMeMetadata` (line 418) — includes openGraph ✓

So dynamic SEO pages (keyword, city, cityCategory, nearMe) DO get OG cards even though the helper is not in the page file itself.

**Gaps (no openGraph):**
- ❌ `src/app/layout.tsx` homepage (relies on inherited metadata — OK as fallback)
- ❌ `src/app/about/page.tsx`
- ❌ `src/app/contact/page.tsx`
- ❌ `src/app/privacy/page.tsx`
- ❌ `src/app/terms/page.tsx`
- ❌ `src/app/blog/page.tsx`
- ❌ `src/app/careers/page.tsx`
- ❌ `src/app/help/page.tsx`
- ❌ `src/app/trust-safety/page.tsx`
- ❌ `src/app/claim/[vendorId]/page.tsx`
- ❌ `src/app/claim-status/page.tsx`
- ❌ `src/app/activate/[token]/page.tsx`
- ❌ `src/app/claim-token/[token]/page.tsx`
- ❌ `src/app/auth/callback/route.ts` (API — N/A)
- ❌ `src/app/admin/*`, `src/app/dashboard/*`, `src/app/vendor/dashboard/*` (noindex surfaces — acceptable)

**Verdict: PARTIAL PASS** — all revenue-driving dynamic pages have full OG; static marketing/legal pages only have title+description.

---

## 6. Canonical URLs  ⚠️ PARTIAL PASS

Search for `canonical|alternates` returns 13 files (some false positives from API routes):

### Pages with canonical URL set (`alternates.canonical`):

| File | Line | Canonical URL |
|---|---|---|
| `src/app/vendor/[slug]/page.tsx` | 120–122 | `https://findmybites.com/vendor/${vendor.slug}` ✓ |
| `src/app/product/[slug]/page.tsx` | 87–89 | `https://findmybites.com/product/${product.slug}` ✓ |
| `src/app/near-me/page.tsx` | 7 | `https://findmybites.com/near-me` ✓ |
| `src/lib/seo-content.ts` | 345 (keyword) | `https://www.findmybites.com/${page.keyword}` ✓ |
| `src/lib/seo-content.ts` | 372 (city) | `https://www.findmybites.com/${city.citySlug}` ✓ |
| `src/lib/seo-content.ts` | 399 (cityCategory) | `https://www.findmybites.com/${page.citySlug}/${page.categorySlug}` ✓ |
| `src/lib/seo-content.ts` | 425 (nearMe) | `https://www.findmybites.com/near-me/${categorySlug}` ✓ |
| `src/lib/seo.ts` | 65–66 (ecosystem) | `https://findmybites.com${path}` ✓ (both `canonical` and `alternates.canonical`) |

### Pages WITHOUT canonical URL:

- ❌ `src/app/layout.tsx` (homepage) — relies on `metadataBase` only; should add explicit `alternates.canonical`
- ❌ `src/app/about/page.tsx`
- ❌ `src/app/contact/page.tsx`
- ❌ `src/app/privacy/page.tsx`
- ❌ `src/app/terms/page.tsx`
- ❌ `src/app/blog/page.tsx`
- ❌ `src/app/careers/page.tsx`
- ❌ `src/app/help/page.tsx`
- ❌ `src/app/trust-safety/page.tsx`
- ❌ All `src/app/claim/*` and `src/app/activate/*` pages

### Inconsistency noticed:
- The base URL is sometimes `https://findmybites.com` (no `www.`) and sometimes `https://www.findmybites.com`. Pick one and 301-redirect the other. Currently:
  - `metadataBase` uses `https://www.findmybites.com` (layout.tsx:35)
  - `src/lib/seo.ts` uses `https://findmybites.com` (no www)
  - `src/lib/seo-content.ts` uses `https://www.findmybites.com`
  - `src/app/sitemap.ts` uses `https://findmybites.com` (no www)
  - `src/app/robots.ts` uses `https://findmybites.com` (no www)
  - `src/app/vendor/[slug]/page.tsx` uses `https://findmybites.com` (no www)
  - `src/app/product/[slug]/page.tsx` uses `https://findmybites.com` (no www)
- This WILL cause canonicalization confusion in Google Search Console.

**Verdict: PARTIAL PASS** — all dynamic public pages have canonical; static pages do not. www vs non-www mismatch must be resolved.

---

## 7. Dynamic Pages  ✅ PASS

All required dynamic page files exist and have proper metadata:

### 7.1 `src/app/vendor/[slug]/page.tsx` ✅
- Line 98: `export async function generateMetadata({ params }): Promise<Metadata>` ✓
- Lines 117–136: returns title, description, alternates.canonical, openGraph, twitter ✓
- Lines 148–184: JSON-LD (`Bakery`/`LocalBusiness`) with @type, @id, name, description, image, url, telephone, address, geo, aggregateRating, priceRange, servesCuisine ✓
- Lines 187–210: BreadcrumbList JSON-LD ✓
- Lines 214–221: Both JSON-LD blocks rendered via `<script type="application/ld+json">` ✓
- Note (line 93): uses `console.error` instead of logger — flagged in logging section.

### 7.2 `src/app/product/[slug]/page.tsx` ✅
- Line 59: `export async function generateMetadata({ params }): Promise<Metadata>` ✓
- Lines 84–103: returns title, description, alternates.canonical, openGraph, twitter ✓
- Lines 118–143: JSON-LD `Product` with offers (price, priceCurrency, availability), brand, sku, seller ✓
- Lines 145–152: Conditional `aggregateRating` (only when `reviewCount > 0`) ✓
- Lines 155–178: BreadcrumbList JSON-LD ✓
- Lines 182–189: Both JSON-LD blocks rendered ✓
- Note (line 54): uses `console.error` instead of logger — flagged.

### 7.3 `src/app/[ecosystem]/[[...path]]/page.tsx` ✅
- Line 58: `export const revalidate = 3600` ✓ ISR
- Line 73: `export async function generateStaticParams()` ✓ pre-builds all known pages
- Line 111: `export async function generateMetadata({ params }): Promise<Metadata>` ✓
- Lines 122–148: handles 4 URL patterns (ecosystem landing, city/category, keyword, city) and dispatches to `generateSEOMetadata`, `generateCityCategoryMetadata`, `generateKeywordMetadata`, `generateCityMetadata` — all of which return canonical + OG + twitter.
- Lines 153–194: page renderer dispatches to 4 sub-renderers.
- Lines 198–307: `renderEcosystemPage()` builds ItemList + Breadcrumb + FAQ JSON-LD via `generateJsonLd()`, then passes to `<SeoPageClient>` (which renders the JSON-LD scripts).
- Lines 311–344: `renderKeywordPage()` — builds Breadcrumb + FAQ + ItemList JSON-LD ✓
- Lines 348–385: `renderCityPage()` — builds Breadcrumb + FAQ + ItemList JSON-LD ✓
- Lines 389–420: `renderCityCategoryPage()` — builds Breadcrumb + FAQ + ItemList JSON-LD ✓

### 7.4 Category/keyword landing pages ✅

Examples confirmed:
- `src/app/wedding-cakes-dubai/page.tsx` — uses `getCakePage("wedding-cakes-dubai")` + `generateCakeMetadata(page)` + `<CakeLanding page={page} />` (CakeLanding renders Breadcrumb + ItemList + FAQ JSON-LD)
- `src/app/dj-dubai/page.tsx` — uses `getKeywordPage("dj-dubai")` + `generateKeywordMetadata(page)` + `<KeywordLanding page={page} />`
- Confirmed 20+ keyword/cake landing pages exist:
  - `wedding-cakes-dubai`, `wedding-cakes-abu-dhabi`, `wedding-cakes-uae`, `wedding-cakes-london`, `wedding-cake-maker-dubai`
  - `birthday-cakes-dubai`, `birthday-cakes-abu-dhabi`, `birthday-cake-delivery-dubai`
  - `custom-cakes-dubai`, `smash-cakes-dubai`, `halal-cakes-dubai`, `vegan-cakes-dubai`, `cake-delivery-dubai`
  - `dj-dubai`, `dj-london`, `catering-dubai`, `photographers-dubai`, `event-planners-dubai`, `kids-party-dubai`
  - `private-chef-dubai`, `private-chef-london`, `halal-catering-london`

**Verdict: PASS** — all four required dynamic-page patterns exist and emit proper metadata + JSON-LD.

---

# PART 2 — PRODUCTION CHECKLIST

## 1. Environment Variables  ❌ CRITICAL FAIL

### Files inspected
- `/home/z/my-project/.env` — exists, 50 bytes, **only contains**:
  ```
  DATABASE_URL=file:/home/z/my-project/db/custom.db
  ```
- `/home/z/my-project/.env.example` — **does not exist** ❌
- `/home/z/my-project/.env.local` — **does not exist** ❌
- `/home/z/my-project/.env.production` — **does not exist** ❌
- `/home/z/my-project/vercel.json` — **does not exist** ❌ (no cron schedule)
- `/home/z/my-project/my-env-values.txt` — exists with placeholder template (3 Supabase vars only)

### Critical finding
The `.env` file points `DATABASE_URL` to a local SQLite file at `/home/z/my-project/db/custom.db`. This will NOT work in Vercel/serverless production. Must be switched to `postgresql://...` (Supabase connection string) before deploy.

### Top 23 env vars referenced via `process.env.*` (names only, no values)

| # | Variable | Purpose | Required for |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Auth, Storage, DB |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Browser client, server client |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Admin Storage cleanup |
| 4 | `DATABASE_URL` | Prisma DB connection string | Everything (DB) |
| 5 | `RAZORPAY_KEY_ID` | Razorpay API key ID | Subscription payments (server) |
| 6 | `RAZORPAY_KEY_SECRET` | Razorpay API key secret | Order creation + signature verify |
| 7 | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID (client-exposed) | Razorpay checkout widget |
| 8 | `GOOGLE_CLIENT_ID` | Google OAuth client ID | Vendor sign-in (NextAuth) |
| 9 | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Vendor sign-in (NextAuth) |
| 10 | `ZAI_BASE_URL` | ZAI API base URL | AI chat (Josh), vendor-summary, FAQ, etc. |
| 11 | `ZAI_API_KEY` | ZAI API key | AI endpoints |
| 12 | `ZAI_CHAT_ID` | ZAI chat session ID | AI chat persistence |
| 13 | `ZAI_USER_ID` | ZAI user ID | AI chat identity |
| 14 | `ZAI_TOKEN` | ZAI auth token | AI chat auth |
| 15 | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places API key | Address autocomplete (client) |
| 16 | `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID | GA4 tracking |
| 17 | `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (currently commented out) | Error monitoring (not yet wired) |
| 18 | `CRON_SECRET` | Shared secret for cron endpoints | Booking/subscription reminders |
| 19 | `RESEND_API_KEY` | Resend email API key | Booking/subscription email notifications |
| 20 | `WHATSAPP_TOKEN` | WhatsApp Business API token | Booking/subscription WhatsApp notifications |
| 21 | `FCM_SERVER_KEY` | Firebase Cloud Messaging server key | Push notifications |
| 22 | `RATE_LIMIT_REDIS_URL` | Redis URL for distributed rate limiting | AI rate limiter (optional) |
| 23 | `NEXT_PUBLIC_SITE_URL` | Public site URL | Marketing QR code generation |
| (built-in) | `NODE_ENV` | Next.js environment | Logger min-level, CSRF secure flag |

**Verdict: CRITICAL FAIL** — only 1 of ~23 required env vars is set (and it points to the wrong DB for production). Must create `.env.example` and populate Vercel environment variables.

---

## 2. Supabase Connection  ✅ PASS

### Server client — `src/lib/supabase/server.ts`
- Line 1: `import { createServerClient } from "@supabase/ssr"` ✓
- Line 2: `import { cookies } from "next/headers"` ✓
- Line 18–41: `createSupabaseServerClient()`:
  - Line 19: `const cookieStore = await cookies()` ✓ reads cookies from request
  - Line 24–38: `cookies.getAll()` / `cookies.setAll()` wired to `cookieStore` ✓
- Line 16: `isSupabaseConfigured` exported for graceful gating ✓
- Lines 21–22: Fallback to `"https://placeholder.supabase.co"` if env vars missing — module never throws ✓

### Admin client — `src/lib/supabase/admin.ts`
- Line 8: `import { createClient } from "@supabase/supabase-js"` ✓
- Line 11: `const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""` ✓ uses service role key
- Line 13: `isStorageAdminConfigured = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)` ✓
- Line 17–25: `getSupabaseAdmin()` returns null if not configured (skips Storage cleanup gracefully) ✓
- Line 21: `auth: { persistSession: false, autoRefreshToken: false }` ✓ correct for server-side service-role client
- Lines 31–86: `deleteVendorStorageFiles(vendorId)` — lists + removes files under `vendor-uploads/{vendorId}/` ✓

### Browser client — `src/lib/supabase/client.ts`
- Line 3: `import { createBrowserClient } from "@supabase/ssr"` ✓
- Line 16: `NEXT_PUBLIC_SUPABASE_URL` ✓
- Line 17: `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- Line 21–24: `supabaseBrowser` instantiated with anon key (safe to expose) ✓

### Additional: middleware
- `src/middleware.ts` line 42–55: refreshes Supabase session on every request via `supabase.auth.getUser()` (catches errors silently) ✓

**Verdict: PASS** — all three clients correctly use cookies (server), service role key (admin), anon key (client).

---

## 3. Storage Buckets  ✅ PASS

### Bucket configuration
- `prisma/create-storage-bucket.sql`:
  - Creates `vendor-uploads` bucket with `public = true` ✓
  - RLS policy `Allow authenticated uploads` (INSERT for `authenticated` role, bucket_id check) ✓
  - RLS policy `Allow public reads` (SELECT for `public` role) ✓
  - RLS policy `Allow users to delete own uploads` (DELETE for `authenticated` with `owner = auth.uid()`) ✓

### Upload usage
- `src/components/dashboard/image-upload.tsx` line 141–146:
  ```ts
  const { data, error: uploadError } = await supabaseBrowser.storage
    .from("vendor-uploads")
    .upload(path, compressed, { cacheControl: "3600", upsert: false });
  ```
- Path format: `${vendorId}/${folder}/${fileName}` (line 139) — clean per-vendor scoping ✓
- Lines 32–37: `secureFilename()` uses `crypto.getRandomValues()` — strong random filenames ✓
- Lines 43–96: `compressImage()` strips EXIF via canvas re-encoding, caps at 1200px, 0.82 quality ✓
- Lines 26–27: ACCEPTED types (jpeg/png/webp) + REJECTED types (gif/svg/heic/pdf) — blocks malicious uploads ✓

### Public URL retrieval (image-upload.tsx after upload):
- Constructs public URL via `${SUPABASE_URL}/storage/v1/object/public/vendor-uploads/${path}` ✓

### Cleanup on vendor delete
- `src/lib/supabase/admin.ts` `deleteVendorStorageFiles()` recursively lists and removes all files under `vendor-uploads/{vendorId}/` ✓
- Called from `src/lib/admin/vendor-delete-service.ts` ✓

**Verdict: PASS** — file upload configured, bucket created via SQL migration, RLS policies set, image compression + EXIF strip + filename randomization on client.

---

## 4. Razorpay  ✅ PASS

**File:** `src/lib/razorpay.ts` (135 lines)

### Key management
- Line 19: `const keyId = process.env.RAZORPAY_KEY_ID` ✓
- Line 20: `const keySecret = process.env.RAZORPAY_KEY_SECRET` ✓
- Lines 22–24: Returns `null` if either is missing — graceful
- Lines 36–42: `isRazorpayConfigured()` checks all 3 vars (incl. `NEXT_PUBLIC_RAZORPAY_KEY_ID`) for UI gating ✓
- Lines 26–31: Singleton instance (cached) — efficient ✓

### Order creation
- Lines 58–108: `createSubscriptionOrder(params)`:
  - Line 74: `toSmallestUnit(params.amount)` converts main currency unit → paise/fils/cents ✓
  - Line 77–79: Validates minimum amount (≥100 paise = ₹1) ✓
  - Line 81–92: `rzp.orders.create({...})` with amount, currency, receipt, notes (planKey, billingCycle, vendorSlug, vendorName, platform) ✓
  - Lines 98–102: Returns `{ orderId, amount, currency }` on success
  - Lines 103–107: Catches errors, returns `{ orderId: "", error: "<msg>" }` — never throws
- Lines 50–52: `toSmallestUnit(amount) = Math.round(amount * 100)` ✓ (correct for INR/AED/USD)

### Signature verification
- Lines 114–134: `verifyPaymentSignature(params)`:
  - Line 119: Reads `RAZORPAY_KEY_SECRET` from env
  - Line 120: Returns `false` if secret missing (fail-closed) ✓
  - Line 123: `body = ${orderId}|${paymentId}` — matches Razorpay's documented signature body ✓
  - Lines 124–127: `crypto.createHmac("sha256", keySecret).update(body).digest("hex")` — correct HMAC-SHA256 ✓
  - Line 129: Constant-time equality NOT used — uses `===` (minor: vulnerable to timing attacks; use `crypto.timingSafeEqual` for hardening)
  - Lines 130–133: Catches and returns `false` on any error ✓

### Consumers
- `src/app/api/payments/create-order/route.ts` — uses `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` directly + exposes `NEXT_PUBLIC_RAZORPAY_KEY_ID` to client ✓
- `src/app/api/payments/verify/route.ts` and `src/app/api/payments/verify-payment/route.ts` — verify signatures ✓

**Verdict: PASS** — full Razorpay lifecycle (key management, order creation, signature verification) implemented. Minor: use `crypto.timingSafeEqual` for signature comparison.

---

## 5. Google Places / OSM Fallback  ⚠️ PARTIAL FAIL

### Server-side — `src/app/api/geocode/route.ts` + `src/lib/geocode.ts` ❌ FAIL
- `src/lib/geocode.ts` (server library) — uses **only** OpenStreetMap Nominatim:
  - Line 46: `const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=..."`
  - Lines 9–11: Comment explicitly says: *"For a production marketplace you'd switch to Google Places / Mapbox / Supabase's geocoding"*
  - No Google Places API call, no fallback chain — just OSM.
- `src/app/api/geocode/route.ts`:
  - Line 18: `const result = await geocodeAddress(address)` — calls OSM-only function.
  - **Requirement not met: "Google Places API used first, OSM fallback"**

### Client-side — `src/components/dashboard/address-autocomplete.tsx` ✅ PASS
- Lines 36–42: Doc comment confirms design intent: *"Google Places (primary) → OSM Nominatim (fallback)"*
- Lines 48–67: `loadGooglePlaces()` reads `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`; if missing, returns `null` (falls through to OSM)
- Lines 89–105: On mount, attempts to load Google Places; if successful, sets `useGoogle = true` and instantiates `Autocomplete`
- Falls back to OSM Nominatim debounced search if Google Places unavailable ✓

**Verdict: PARTIAL FAIL** — client-side autocomplete correctly implements Google Places primary + OSM fallback. Server-side `/api/geocode` is OSM-only and does not meet the requirement.

**Recommendation:** Add Google Places Geocoding API call in `src/lib/geocode.ts` as the primary path; fall back to Nominatim if `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is unset or quota exceeded.

---

## 6. Cron Jobs  ⚠️ PARTIAL PASS

### Cron-ready endpoints (protected by `CRON_SECRET` Bearer auth):

| Endpoint | File | Purpose | Auth |
|---|---|---|---|
| `GET /api/bookings/reminders` | `src/app/api/bookings/reminders/route.ts` | 24h pre-event booking reminders | `CRON_SECRET` Bearer (lines 13–18) ✓ |
| `GET /api/subscriptions/reminders` | `src/app/api/subscriptions/reminders/route.ts` | Subscription expiry reminders (7d/3d/1d/expiry) | `CRON_SECRET` Bearer (lines 24–30) ✓ |
| `GET /api/health` | `src/app/api/health/route.ts` | Uptime monitoring (DB ping) | None (intentional) ✓ |

### Implementation details
- Both reminder endpoints check `if (process.env.CRON_SECRET)` first — if set, validate `Authorization: Bearer <secret>` header; if not set (dev), endpoint is open with implicit warning. Safe-by-default behavior ✓
- Both endpoints return structured JSON: `{ total, events, channels: { email: {configured, sent}, whatsapp: {configured, sent} } }`
- Both reference env vars `RESEND_API_KEY`, `WHATSAPP_TOKEN`, `FCM_SERVER_KEY` for channel availability reporting.

### Critical gaps
- ❌ **No `vercel.json`** — Vercel Cron Jobs are NOT scheduled. Endpoints exist but nothing calls them on a recurring schedule. Booking/subscription reminders will NOT fire automatically in production.
- ❌ `src/lib/notifications.ts` (lines around "Can be called from a cron job endpoint (when created)") — there is a TODO for a notifications cron endpoint that does NOT exist yet.
- ❌ No `/api/cron/*` directory convention; no `export const runtime = "edge"` or `runtime = "nodejs"` declarations on cron routes.

**Required action:** Create `vercel.json` at project root:
```json
{
  "crons": [
    { "path": "/api/bookings/reminders", "schedule": "0 8 * * *" },
    { "path": "/api/subscriptions/reminders", "schedule": "0 9 * * *" }
  ]
}
```

**Verdict: PARTIAL PASS** — endpoints are cron-ready (Bearer auth, structured response), but cron scheduling infrastructure is missing.

---

## 7. Analytics  ⚠️ PARTIAL PASS

### Server-side event tracking — `src/app/api/analytics/track/route.ts` ✅ PASS
- Line 23–32: `VALID_EVENTS` set: `page_view`, `product_view`, `service_view`, `contact_click`, `whatsapp_click`, `phone_click`, `website_click`, `share_click` ✓
- Lines 43–81: POST handler:
  - Validates `vendorId` + `eventType` ✓
  - Line 61–63: Computes visitor hash from `x-forwarded-for` IP + `user-agent` (no PII) ✓
  - Line 65–73: Persists to `db.vendorAnalytics.create(...)` ✓
  - Line 78: Never throws (analytics failures don't break customer UX) ✓
- Lines 89–164: GET handler (vendor dashboard analytics) — auth-gated, ownership-checked, returns aggregates (byType, uniqueVisitors, productViews, dailyViews) ✓

### Google Analytics 4 — `src/components/analytics/google-analytics.tsx` ⚠️ PARTIAL
- Line 14: `const gaId = process.env.NEXT_PUBLIC_GA_ID` ✓
- Line 16: Only loads when `gaId` present AND `NODE_ENV === "production"` ✓
- Lines 21–35: Renders gtag.js script + config script via `next/script` with `strategy="afterInteractive"` ✓
- Lines 44–48: `trackEvent(name, params)` helper exposed ✓
- Lines 53–58: `trackPageView(path)` helper exposed ✓
- Mounted in `src/app/layout.tsx` line 131: `<GoogleAnalytics />` ✓
- ⚠️ **FAIL:** `NEXT_PUBLIC_GA_ID` is NOT in `.env` (would need to be set in Vercel env vars). Until set, GA4 silently no-ops.

### Error monitoring — `src/components/analytics/error-monitoring.tsx` ❌ FAIL
- Captures `window.onerror` and `unhandledrejection` events ✓
- Line 32: Logs structured error data to `console.error("[ErrorMonitoring]", errorData)` — but this is just `console.error`, not Sentry/external service
- Lines 34–37 + 51–52: Sentry integration is **commented out** — `NEXT_PUBLIC_SENTRY_DSN` is referenced only in comments
- `@sentry/nextjs` is NOT in dependencies
- Mounted in `src/app/layout.tsx` line 132: `<ErrorMonitoring />` ✓
- **FAIL:** No actual error monitoring service is wired in production. Errors go to Vercel runtime logs only (no alerting, no replay, no source maps).

**Verdict: PARTIAL PASS** — first-party analytics (DB-backed) is fully implemented; GA4 is wired but env var not set; Sentry is stub-only.

---

## 8. Logging  ⚠️ NEEDS IMPROVEMENT

### Logger implementation — `src/lib/logger.ts` ✅ EXCELLENT
- Lines 25–32: Four log levels (debug, info, warn, error) with priority filtering ✓
- Line 34–35: `MIN_LEVEL` switches to `"info"` in production, `"debug"` in dev ✓
- Lines 47–83: `SENSITIVE_KEY_PATTERNS` regex array (22 patterns) — `password`, `apiKey`, `token`, `authorization`, `cookie`, `supabase.*Key`, `keySecret`, etc. ✓
- Lines 91–107: `redactSensitive()` deep-clones meta and replaces sensitive keys with `[REDACTED]` ✓
- Lines 110–114: `LogContext` interface (`requestId`, `userId`, `route`) ✓
- Lines 119–121: `generateRequestId()` — `req-${timestamp}-${random}` ✓
- Lines 123–144: `formatLog()` — JSON in production, colored text in dev ✓
- Lines 146–159: `log()` — uses `console.error/warn/log` underneath (correct — logger wraps console, doesn't replace it)
- Lines 178–189: Public `logger` interface with `info/warn/error/debug/withContext` ✓

### Adoption — ❌ INCOMPLETE

| Metric | Count | Source |
|---|---|---|
| Total API route files | 178 | `find src/app/api -name route.ts \| wc -l` |
| API routes that import `@/lib/logger` | 18 | grep |
| API routes that still use `console.*` | 108 | grep |
| API routes using logger OR console | 121 | grep |
| Total `console.*` occurrences across codebase | 314 | grep (134 files) |
| Files importing `@/lib/logger` | 18 | grep |

### Files that correctly use the logger (18 total):
- `src/lib/ai/listing-generator.ts`
- `src/lib/ai/rate-limiter.ts`
- `src/lib/growth-manager/growth-manager-service.ts`
- `src/lib/marketing/marketing-ai-service.ts`
- `src/app/api/ai/quote-builder/route.ts`
- `src/app/api/ai/vendor-summary/route.ts`
- `src/app/api/ai/review-summary/route.ts`
- `src/app/api/ai/vendor-assistant/route.ts`
- `src/app/api/ai/search/route.ts`
- `src/app/api/ai/generate-description/route.ts`
- `src/app/api/ai/product-writer/route.ts`
- `src/app/api/ai/event-planner/route.ts`
- `src/app/api/ai/vendor-faq/route.ts`
- `src/app/api/josh/chat/route.ts`
- `src/app/api/bookings/smart/route.ts`
- `src/app/api/payments/create-order/route.ts`
- `src/app/api/vendor/ai/classify/route.ts`
- `src/app/api/chat/route.ts`

**Pattern observation:** The logger was introduced alongside the AI/chat features (which were built later). Older routes (vendors, products, bookings, reviews, admin) all still use `console.log/error/warn`.

### Notable `console.*` hotspots:
- `src/app/api/josh/chat/route.ts` — 41 console.* occurrences (despite importing logger — mixed usage)
- `src/app/api/vendors/[slug]/route.ts` — 15 console.* occurrences
- `src/lib/josh/conversation-store.ts` — 17 console.* occurrences
- `src/lib/bookings/booking-service.ts` — 10 console.* occurrences
- `src/lib/subscription/subscription-service.ts` — 6 console.* occurrences
- `src/app/api/wishlist/route.ts` — 7 console.* occurrences
- `src/app/api/follow/route.ts` — 8 console.* occurrences
- `src/app/api/vendor/me/route.ts` — 9 console.* occurrences

**Verdict: NEEDS IMPROVEMENT** — logger is well-built but adoption is only ~10% of API routes (18/178). Production logs will be inconsistent: AI routes emit structured JSON, while everything else emits unstructured `console.*`. Should migrate the remaining 108 routes that still use console.

---

# Summary Scorecard

| Check | Status | Notes |
|---|---|---|
| **Part 1 — SEO** | | |
| 1. Metadata (layout.tsx) | ✅ PASS | title/desc/OG/twitter/metadataBase all present; missing homepage canonical |
| 2. Sitemap (sitemap.ts) | ✅ PASS | Auto-derives vendors, categories, cities, ecosystems; missing products |
| 3. robots.txt (robots.ts) | ✅ PASS | Allow /, disallow /api/, /admin, /vendor/dashboard; sitemap referenced |
| 4. JSON-LD | ✅ PASS | 13 files; covers Marketplace, LocalBusiness, Product, Breadcrumb, FAQ, ItemList, WebSite |
| 5. Open Graph | ⚠️ PARTIAL | All dynamic pages ✓; static legal/marketing pages ✗ |
| 6. Canonical URLs | ⚠️ PARTIAL | Dynamic pages ✓; static pages ✗; www vs non-www mismatch |
| 7. Dynamic pages | ✅ PASS | vendor/[slug], product/[slug], [ecosystem]/[[...path]], 20+ keyword pages |
| **Part 2 — Production** | | |
| 1. Environment variables | ❌ FAIL | .env has only SQLite URL; .env.example missing; 23 vars need Vercel config |
| 2. Supabase connection | ✅ PASS | Server (cookies), Admin (service role), Client (anon) — all correct |
| 3. Storage buckets | ✅ PASS | vendor-uploads bucket + RLS + client upload + admin cleanup |
| 4. Razorpay | ✅ PASS | Key mgmt, order creation, HMAC-SHA256 signature verify — all correct |
| 5. Google Places / OSM | ⚠️ PARTIAL | Client autocomplete ✓; server /api/geocode is OSM-only |
| 6. Cron jobs | ⚠️ PARTIAL | Endpoints cron-ready with CRON_SECRET; vercel.json missing → not scheduled |
| 7. Analytics | ⚠️ PARTIAL | DB analytics ✓; GA4 wired (env var not set); Sentry stub-only |
| 8. Logging | ⚠️ NEEDS WORK | Logger is excellent; only 18/178 API routes migrated (108 still use console.*) |

---

# Recommended Next Actions (Priority Order)

### P0 — Block launch
1. **Create `.env.example`** documenting all 23 env vars (use `my-env-values.txt` as starting point).
2. **Set all production env vars in Vercel** (Supabase URL/anon/service-role, DATABASE_URL=postgresql, Razorpay×3, Google OAuth×2, ZAI×5, Places, GA4, CRON_SECRET, Resend, WhatsApp, FCM).
3. **Create `vercel.json`** with cron schedule for `/api/bookings/reminders` (daily 08:00) and `/api/subscriptions/reminders` (daily 09:00).
4. **Switch `DATABASE_URL`** from `file:./custom.db` (SQLite) to Supabase Postgres connection string. Run `prisma migrate deploy` against prod DB.
5. **Standardize canonical base URL** — pick either `https://findmybites.com` OR `https://www.findmybites.com` and 301-redirect the other. Apply consistently across `layout.tsx`, `seo.ts`, `seo-content.ts`, `sitemap.ts`, `robots.ts`, `vendor/[slug]/page.tsx`, `product/[slug]/page.tsx`.

### P1 — Should fix before launch
6. **Add Google Places Geocoding API call** to `src/lib/geocode.ts` as primary, with OSM Nominatim as fallback. Mirror the client-side pattern from `address-autocomplete.tsx`.
7. **Add canonical URLs + openGraph** to static pages: about, contact, privacy, terms, blog, careers, help, trust-safety.
8. **Add `Organization` JSON-LD** to static pages (about/contact) for richer brand presence in search.
9. **Add product pages to sitemap** (`/product/[slug]` for all published products).
10. **Set `NEXT_PUBLIC_GA_ID`** in Vercel env vars (currently GA4 no-ops in production).
11. **Activate Sentry** by installing `@sentry/nextjs` and uncommenting the Sentry calls in `error-monitoring.tsx`. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel.

### P2 — Quality improvements
12. **Migrate remaining 108 API routes** from `console.*` to `@/lib/logger`. Priority order: high-traffic (vendors, products, bookings, reviews) → admin → low-traffic (templates, filters, etc.).
13. **Use `crypto.timingSafeEqual`** in `verifyPaymentSignature()` instead of `===` to prevent timing attacks.
14. **Clean up `src/app/api/josh/chat/route.ts`** — 41 `console.*` calls mixed with logger usage (file already imports logger).
15. **Add `/api/notifications/cron` endpoint** to satisfy the TODO in `src/lib/notifications.ts`.
16. **Add homepage canonical** to `src/app/layout.tsx`: `alternates: { canonical: "https://www.findmybites.com" }`.

---

*End of report — QA-PHASE6-7-SEO-PROD*
