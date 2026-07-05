# QA Phase 1 — Security Fix Verification Report

**Task ID:** QA-PHASE1-VERIFY
**Project:** /home/z/my-project (Next.js)
**Auditor:** Principal QA Engineer (Explore sub-agent)
**Mode:** Read-only verification — no source files were modified
**Date:** Auto-generated at report time

---

## Executive Summary

**Result: 11 / 11 checks PASSED ✅**

All previously applied security fixes from the Phase 1 hardening pass are intact in the codebase. No regressions, no missing imports, and no bypassed guards were detected. The project is cleared to proceed to the next QA phase (e.g., integration tests, runtime smoke tests).

---

## Detailed Findings

### 1. CSRF Protection — ✅ PASS

Files inspected: `src/lib/security/csrf.ts`, `src/middleware.ts`

- **Web Crypto API usage** — `csrf.ts` line 28 uses `crypto.getRandomValues(bytes)` (Web Crypto). No reference to Node.js `crypto.randomBytes` anywhere in the file. Edge-runtime safe.
- **Middleware wiring** — `src/middleware.ts` line 3 imports `{ ensureCsrfCookie, validateCsrf }`; calls `validateCsrf(request)` at line 25 (returns 403 on failure) and `ensureCsrfCookie(request, response)` at line 38 on GET requests.
- **GET/HEAD/OPTIONS bypass** — `validateCsrf()` returns `true` immediately at `csrf.ts` line 49 for these methods.
- **Exempt paths** — `EXEMPT_PATHS` at lines 18–23 contains `/api/auth`, `/api/payments/verify`, `/api/payments/verify-payment`, and `/api/health`. All three required exempt paths are present.

---

### 2. AI Security — ✅ PASS

Files inspected: `src/lib/ai/security.ts` and 4 consumers.

- **`sanitizePrompt()`** — Defined at `security.ts` line 38, with `INJECTION_PATTERNS` (12 patterns) at lines 11–24. Returns `{ safe, sanitized, blocked, reason? }`.
- **`callWithTimeout()`** — Defined at `security.ts` line 72 with `AI_TIMEOUT_MS = 30_000` (line 66) as the 30s default; uses `AbortController`.
- **Consumer imports:**
  - `src/lib/ai/listing-generator.ts` line 21: `import { sanitizePrompt, callWithTimeout } from "./security";` — used at lines 34, 45.
  - `src/lib/marketing/marketing-ai-service.ts` line 12: `import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";` — used at lines 25, 36.
  - `src/app/api/vendor/ai/classify/route.ts` line 14: `import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";` — used at lines 41, 84.
  - `src/app/api/josh/chat/route.ts` line 4: `import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";` — used at lines 133, 291, 357.

---

### 3. BOLA Fixes — ✅ PASS (10/10 routes)

| # | Route | Required Guard | Evidence |
|---|-------|----------------|----------|
| 1 | `src/app/api/reviews/[id]/route.ts` | `requireAdmin()` on DELETE | Line 15: `const guard = await requireAdmin(); if (guard) return guard;` |
| 2 | `src/app/api/bookings/route.ts` | admin/vendor auth on GET | Lines 45–58: `requireAdmin()` then `resolveVendorFromSession()` fallback with scope forced to session vendor |
| 3 | `src/app/api/bookings/vendor/[vendorId]/route.ts` | ownership check | Line 24: `if (vendor.id !== vendorId) return 403` |
| 4 | `src/app/api/bookings/analytics/route.ts` | auth on GET | Lines 19–27: `requireAdmin()` + `resolveVendorFromSession()` fallback, vendorId overridden to session vendor |
| 5 | `src/app/api/bookings/customer/[email]/route.ts` | email-match check | Line 34: `if (sessionEmail.toLowerCase() !== decodedEmail.toLowerCase()) return 403` |
| 6 | `src/app/api/bookings/[id]/timeline/route.ts` | `verifyBookingAccess` on GET | Line 10: `const accessGuard = await verifyBookingAccess(id); if (accessGuard) return accessGuard;` |
| 7 | `src/app/api/bookings/[id]/notes/route.ts` | `verifyBookingAccess` on GET+POST | POST line 11, GET line 32 — both call `verifyBookingAccess(id)` |
| 8 | `src/app/api/subscriptions/[vendorId]/route.ts` | ownership check | Line 34: `if (vendor.id !== vendorId) return 403` |
| 9 | `src/app/api/messages/conversation/route.ts` | participant verification on GET+POST | GET lines 41–69 (isP1/isP2 ladder), POST lines 152–158 (`isSenderP1`/`isSenderP2` check) |
| 10 | `src/app/api/admin/categories/[id]/subcategories/route.ts` | `requireAdmin()` on GET | Line 56: `const guard = await requireAdmin(); if (guard) return guard;` (POST also guarded at line 14) |

---

### 4. Logger — ✅ PASS

File inspected: `src/lib/logger.ts`

- **`withContext()` method** — Defined on the `Logger` interface at line 168 and implemented on the `logger` export at lines 183–188. Returns a `ContextualLogger` that auto-injects `requestId`/`userId`/`route` into every log line.
- **Sensitive data redaction** — `SENSITIVE_KEY_PATTERNS` declared at lines 47–83 (34 case-insensitive patterns covering password, token, apiKey, jwt, cookie, authorization, privateKey, supabase*Key, etc.). `redactSensitive()` at lines 91–107 recursively replaces matching keys with `"[REDACTED]"`.
- **`generateRequestId()` export** — Defined at lines 119–121, returns `req-${Date.now()}-${Math.random()...}`.

---

### 5. Rate Limiter — ✅ PASS

File inspected: `src/lib/ai/rate-limiter.ts`

- **Adapter pattern** — `RateLimiterAdapter` interface at lines 25–28 with `check()` + `increment()`.
- **MemoryAdapter** — Implemented at lines 31–59 (Map with daily key reset).
- **RedisAdapter scaffold** — Implemented at lines 62–78; throws `Error("Redis adapter not configured")` until Redis URL wiring is added (intentional scaffold). Selection logic at lines 81–90 falls back to memory when `RATE_LIMIT_REDIS_URL` is unset or adapter not yet implemented.
- **Exports** — `checkAiRateLimit` at line 93, `incrementAiCount` at line 106.
- **AI limits** — `AI_LIMITS` at lines 18–22: `free: 5, pro: 50, business: 200` ✅ all match the spec.

---

### 6. Payment Verification — ✅ PASS

File inspected: `src/app/api/payments/create-order/route.ts`

- **vendorId resolved from session, NOT body** — Comment at lines 40–41 explicitly states "Never trust vendorId from the request body." Session resolution at lines 42–57 (`supabase.auth.getUser()` with `getSession()` fallback). Vendor lookup at lines 59–62 queries `db.vendor.findFirst` by `owner_user_id` (or `userEmail`) — `body` only destructures `planName`, `amount`, `currency` (line 24). `actualVendorId` is assigned from `vendor.id` at line 68.
- **Logger signature (module, message, meta)** — All four logger calls use the correct 3-arg form:
  - Line 71: `logger.info("create-order", "Creating Razorpay order", { planName, amount, vendorId: actualVendorId })`
  - Line 86: `logger.error("create-order", "Razorpay order creation failed", { status: response.status, error })`
  - Line 91: `logger.info("create-order", "Order created successfully", { orderId: order.id })`
  - Line 99: `logger.error("create-order", "Unexpected error", { message: error.message })`

---

### 7. Cron Protection — ✅ PASS (2/2 routes)

| Route | Evidence |
|-------|----------|
| `src/app/api/bookings/reminders/route.ts` | Lines 13–18: `if (process.env.CRON_SECRET) { const authHeader = req.headers.get("authorization"); if (authHeader !== \`Bearer ${process.env.CRON_SECRET}\`) return 401; }` |
| `src/app/api/subscriptions/reminders/route.ts` | Lines 25–30: identical `CRON_SECRET` Bearer check |

Both endpoints correctly degrade to open (dev) only when `CRON_SECRET` is unset — production behavior is enforced when the env var is present.

---

### 8. Booking Access Helper — ✅ PASS

File inspected: `src/lib/bookings/booking-access.ts`

- **`verifyBookingAccess(bookingId)`** — Defined at line 21, returns `NextResponse | null` (null = authorized).
- **Admin / vendor / customer ladder** — implemented in order:
  1. Admin bypass — line 23: `await requireAdmin()`, returns `null` (authorized) if guard is falsy.
  2. Customer match (email) — line 56: `if (userEmail && booking.customerEmail?.toLowerCase() === userEmail.toLowerCase()) return null;`
  3. Vendor ownership — lines 61–68: queries `db.vendor.findFirst({ where: { id: booking.vendorId, owner_user_id: userId } })`; returns `null` if match.
  4. Deny — line 71: returns 403.

---

### 9. Unbounded Prisma Queries — ✅ PASS (6/6 files)

| File | Required `take` | Evidence |
|------|------------------|----------|
| `src/app/api/admin/business-types/route.ts` | 500 | Line 13: `db.businessType.findMany({ ..., take: 500 })` |
| `src/app/api/admin/filters/route.ts` | 200 | Line 21: `take: 200` on `filterGroup.findMany` |
| `src/app/api/admin/templates/export/route.ts` | 100 | Line 52: `take: 100` on `listingTemplate.findMany` |
| `src/app/api/admin/templates/route.ts` | 100 | Line 22: `take: 100` on `listingTemplate.findMany` |
| `src/app/api/admin/templates/mappings/route.ts` | 500 | Line 19: `take: 500` on `templateMapping.findMany` |
| `src/lib/marketing/growth-service.ts` | referrals `take: 10000` | Line 400: `db.referral.findMany({ select: { status: true, creditsEarned: true }, take: 10000 })` |

---

### 10. Health Endpoint — ✅ PASS

File inspected: `src/app/api/health/route.ts`

- Endpoint exists and exports a `GET` handler (line 12).
- Returns `status: "healthy"` + `database: "connected"` + latency on success (lines 18–23) after running a lightweight DB ping: `db.vendor.count({ take: 1 })` at line 16.
- Returns `status: "unhealthy"` + `database: "error"` with HTTP 503 on DB failure (lines 24–35).

---

### 11. Error Boundaries — ✅ PASS

| File | Evidence |
|------|----------|
| `src/app/dashboard/error.tsx` | Exists (38 lines). `"use client"` directive, default export `DashboardError`, uses `error` + `reset` props, renders friendly recovery UI with a "Try again" button calling `reset()`. |
| `src/app/admin/error.tsx` | Exists (37 lines). `"use client"` directive, default export `AdminError`, same shape — uses `error` + `reset` props with recovery UI. |

Both files were confirmed present via `LS` on `/home/z/my-project/src/app/dashboard` and `/home/z/my-project/src/app/admin`.

---

## Summary Scorecard

| # | Check | Result |
|---|-------|--------|
| 1 | CSRF Protection | ✅ PASS |
| 2 | AI Security | ✅ PASS |
| 3 | BOLA Fixes (10 routes) | ✅ PASS |
| 4 | Logger | ✅ PASS |
| 5 | Rate Limiter | ✅ PASS |
| 6 | Payment Verification | ✅ PASS |
| 7 | Cron Protection (2 routes) | ✅ PASS |
| 8 | Booking Access Helper | ✅ PASS |
| 9 | Unbounded Prisma Queries (6 files) | ✅ PASS |
| 10 | Health Endpoint | ✅ PASS |
| 11 | Error Boundaries | ✅ PASS |

**Total: 11 / 11 checks PASSED**

---

## Observations (non-blocking, FYI only)

These items do NOT represent failures against the Phase 1 spec, but are worth noting for future phases:

1. **CSRF exempt paths** — `EXEMPT_PATHS` in `csrf.ts` uses `path.startsWith(p)` matching. `/api/auth` correctly covers all sub-paths (e.g., `/api/auth/callback`). No issue, just confirming the matching semantics.
2. **CSRF origin check** — For `/api/` mutation routes, `validateCsrf` enforces an Origin/Host check (lines 55–65) but does NOT enforce the double-submit cookie token for API routes (only for non-API server-action mutations at lines 68–71). This is a deliberate defense-in-depth layering decision on top of Supabase's SameSite=Lax auth cookies — acceptable.
3. **`callWithTimeout` default** — `AI_TIMEOUT_MS = 30_000` is the default, but callers explicitly pass `30_000` again (e.g., `listing-generator.ts` line 51, `marketing-ai-service.ts` line 42, `classify/route.ts` line 90, `josh/chat/route.ts` lines 293, 365). Redundant but harmless — could be cleaned up later to rely on the default.
4. **`requireAdmin()` return convention** — Throughout the BOLA routes, `requireAdmin()` returns `null` when the caller IS an admin (falsy = authorized) and returns a `NextResponse` (truthy = block) when not. This is the inverse of typical guard semantics; the codebase uses it consistently but reviewers should be aware of the inversion to avoid copy-paste mistakes in new routes.
5. **RedisAdapter** — Scaffolded but throws "not configured". Selection logic logs a warning and falls back to MemoryAdapter when `RATE_LIMIT_REDIS_URL` is set. To enable, the Redis client must be wired in `rate-limiter.ts` lines 83–89.
6. **Josh chat route** — Still uses `console.log`/`console.error` in several places (e.g., lines 121–122, 151–156) rather than the structured `logger`. Not a Phase 1 requirement, but flagged for the logging-consistency pass.
7. **`messages/conversation/route.ts` admin check** — Hardcodes `["bookingjosh@gmail.com"]` as the admin email allow-list (lines 46, 145). Acceptable for the current single-admin model, but should be moved to an env var or role check before scaling.

---

## Recommended Next Actions

1. **Proceed to Phase 2 QA** — Integration/runtime smoke tests (HTTP-level) to confirm the guards actually fire as expected, not just that they exist statically.
2. **Add automated tests** for the BOLA ladder in `verifyBookingAccess()` — at minimum: admin user, owning vendor, non-owning vendor, owning customer, non-owning customer, unauthenticated.
3. **Add a CI lint rule** that fails any new `db.*.findMany()` call in `src/app/api/**` that omits a `take:` clause.
4. **Wire the Redis rate-limiter adapter** before scaling beyond a single Vercel instance (otherwise cold-start resets allow burst overages).
5. **Replace hardcoded admin email** in `messages/conversation/route.ts` with a proper role lookup.

---

*End of report. No source files were modified during this audit.*
