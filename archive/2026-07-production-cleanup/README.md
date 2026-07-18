# Production Archive — 2026-07 Production Cleanup

## Overview

This directory contains 27 files that were archived during a production-safe cleanup audit on 2026-07-14. These files had zero verified runtime references (no static imports, dynamic imports, registry lookups, or configuration references) at the time of archival.

**These files are preserved for future features. They are NOT deleted.**

## ⚠️ DO NOT IMPORT FROM THIS DIRECTORY

These files are excluded from:
- TypeScript compilation (`tsconfig.json` → `exclude`)
- ESLint (`eslint.config.mjs` → `ignores`)
- Next.js build

Importing from this directory will cause build failures.

## Archive Structure

```
archive/2026-07-production-cleanup/
├── components/
│   ├── admin/
│   │   └── admin-analytics-extras.tsx
│   ├── bookings/
│   │   ├── admin-bookings.tsx
│   │   ├── booking-form.tsx
│   │   ├── customer-bookings.tsx
│   │   └── vendor-bookings-dashboard.tsx
│   ├── dashboard/
│   │   ├── billing-history.tsx
│   │   └── subscription-dashboard.tsx
│   ├── inventory/
│   │   └── inventory-analytics.tsx
│   ├── marketplace/
│   │   ├── attribute-badges.tsx
│   │   ├── become-vendor.tsx
│   │   ├── hero.tsx
│   │   ├── quote-dialog.tsx
│   │   ├── stats-bar.tsx
│   │   ├── upgrade-prompt.tsx
│   │   └── world-presence.tsx
│   └── setup-assistant/
│       └── setup-assistant.tsx
└── lib/
    ├── animations.ts
    ├── auth-helpers.ts
    ├── category-fields.ts
    ├── josh-system-prompt-v2.ts
    ├── josh-system-prompt-v3.ts
    ├── josh-system-prompt.ts
    ├── notifications.ts
    ├── rate-limit.ts
    ├── tag-generator.ts
    ├── vendor-emails.ts
    └── products/
        └── template-validation.ts
```

## Audit Methodology

Each file was verified using 6 search strategies:

1. **Static imports** — `grep -rn "from.*FILENAME"` across all `.ts`, `.tsx`, `.mjs`, `.cjs`, `.js` files
2. **Dynamic imports** — `grep -rn "dynamic.*import.*FILENAME|lazy.*import.*FILENAME|import(.*FILENAME"` across all `.ts`, `.tsx` files
3. **String references** — filename + PascalCase component name + all exported symbol names across all `.ts`, `.tsx`, `.json` files
4. **Template Engine** — checked `prisma/`, `src/lib/products/`, JSON configuration files
5. **Route usage** — checked all `app/**/page.tsx`, `layout.tsx`, `route.ts` files
6. **Server-side/cron** — checked `scripts/`, `vercel.json`, `package.json`

## Files Archived

### Components (16 files)

| File | Lines | Original Path | Reason |
|------|-------|---------------|--------|
| admin-analytics-extras.tsx | 181 | src/components/admin/ | Zero imports |
| admin-bookings.tsx | 874 | src/components/bookings/ | Zero imports (replaced by admin/admin-bookings.tsx) |
| booking-form.tsx | 197 | src/components/bookings/ | Zero imports (marketplace/booking-form.tsx is the active one) |
| customer-bookings.tsx | 395 | src/components/bookings/ | Zero imports |
| vendor-bookings-dashboard.tsx | 500 | src/components/bookings/ | Zero imports |
| billing-history.tsx | 201 | src/components/dashboard/ | Zero imports |
| subscription-dashboard.tsx | 248 | src/components/dashboard/ | Zero imports |
| inventory-analytics.tsx | 220 | src/components/inventory/ | Zero imports |
| attribute-badges.tsx | 216 | src/components/marketplace/ | Zero imports |
| become-vendor.tsx | 137 | src/components/marketplace/ | Zero imports |
| hero.tsx | 215 | src/components/marketplace/ | Zero imports (replaced by premium-hero.tsx) |
| quote-dialog.tsx | 262 | src/components/marketplace/ | Zero imports |
| stats-bar.tsx | 80 | src/components/marketplace/ | Zero imports |
| upgrade-prompt.tsx | 132 | src/components/marketplace/ | Zero imports |
| world-presence.tsx | 143 | src/components/marketplace/ | Zero imports |
| setup-assistant.tsx | 415 | src/components/setup-assistant/ | Zero imports (API route exists, component not imported) |

### Lib Modules (11 files)

| File | Lines | Original Path | Reason |
|------|-------|---------------|--------|
| animations.ts | 42 | src/lib/ | Zero imports |
| auth-helpers.ts | 56 | src/lib/ | Zero imports |
| category-fields.ts | 386 | src/lib/ | Zero imports |
| josh-system-prompt.ts | 113 | src/lib/ | Superseded by josh-system-prompt-v4.ts |
| josh-system-prompt-v2.ts | 215 | src/lib/ | Superseded by v4 |
| josh-system-prompt-v3.ts | 161 | src/lib/ | Superseded by v4 |
| notifications.ts | 61 | src/lib/ | Zero imports |
| rate-limit.ts | 79 | src/lib/ | Zero imports (lib/ai/rate-limiter.ts is the active one) |
| tag-generator.ts | 58 | src/lib/ | Zero imports |
| vendor-emails.ts | 65 | src/lib/ | Zero imports |
| template-validation.ts | 170 | src/lib/products/ | Zero imports |

## Restoration

To restore a file from this archive:

1. Copy the file back to its original location (see the "Original Path" column above)
2. Remove the archival header comment from the top of the file
3. Verify that the file's imports still resolve (dependencies may have changed)
4. Run `npx tsc --noEmit` to verify TypeScript compilation
5. Run `bun run lint` to verify ESLint passes

## Permanent Deletions

Only 3 `.bak` backup files were permanently deleted (not archived):

| File | Lines | Reason |
|------|-------|--------|
| src/components/admin/admin-overview.tsx.bak | 300 | Stale backup |
| src/components/admin/admin-panel.tsx.bak | 1,835 | Stale backup |
| src/components/vendor-dashboard/vendor-dashboard.tsx.bak | 1,702 | Stale backup |

## Verification

- ✅ TypeScript: PASS (archive excluded from compilation)
- ✅ ESLint: PASS (archive excluded from linting)
- ✅ All routes functional: /, /dashboard, /admin, /product/[slug], /vendor/[slug]
- ✅ Product Wizard: 6 cards, sticky action bar, all functionality intact
- ✅ No missing imports (zero TS2307 errors)
- ✅ No runtime errors
