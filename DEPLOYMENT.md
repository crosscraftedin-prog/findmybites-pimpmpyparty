# Prisma Migration & Deployment Workflow

## Overview

This document describes the mandatory workflow for database schema changes,
CI checks, and deployment ordering. **Following this workflow prevents
schema drift between development, staging, and production.**

---

## 1. Making Schema Changes

### Step 1: Modify `prisma/schema.prisma`

Edit the schema as needed (add models, fields, indexes, etc.).

### Step 2: Generate a Migration

```bash
# Option A: Standard Prisma migration (recommended for local dev with PostgreSQL)
bun run db:migrate -- --name descriptive_name

# Option B: If local dev uses SQLite (can't run prisma migrate):
# 1. Add the SQL to prisma/migrations/sync-production-schema.sql
# 2. Run: bun run db:generate  (regenerate Prisma client)
# 3. Run sync-production-schema.sql on production manually
```

### Step 3: Commit BOTH Files

```bash
git add prisma/schema.prisma
git add prisma/migrations/  # new migration folder OR updated sync-production-schema.sql
git commit -m "feat: add new_field to vendor_listings"
```

**NEVER commit `schema.prisma` without a corresponding migration.**
The CI will fail (see below).

---

## 2. CI: Schema Drift Check

### GitHub Actions Workflow

File: `.github/workflows/schema-drift-check.yml`

**Trigger:** Any PR or push to `main` that modifies `prisma/schema.prisma`.

**What it checks:**
- If `schema.prisma` was modified, verifies that at least one of:
  - A new `prisma/migrations/<timestamp>/migration.sql` was added, OR
  - `prisma/migrations/sync-production-schema.sql` was updated

**On failure:** The CI job fails with a clear error message explaining
how to create the missing migration.

### Local Pre-commit Check

```bash
bun run check:schema-drift
```

This runs the same check locally before pushing.

---

## 3. Deployment Order (MANDATORY)

```
┌─────────────────────────────────────────────────────┐
│  1. Generate Migration                              │
│     bun run db:migrate -- --name <name>             │
│     (or update sync-production-schema.sql)          │
├─────────────────────────────────────────────────────┤
│  2. Commit & Push to GitHub                         │
│     git add prisma/ && git commit && git push       │
├─────────────────────────────────────────────────────┤
│  3. CI Schema Drift Check runs                      │
│     (GitHub Actions — must pass)                    │
├─────────────────────────────────────────────────────┤
│  4. Apply Migration to Production                   │
│     psql "$DATABASE_URL" -f prisma/migrations/      │
│       sync-production-schema.sql                    │
│     (or: bun run db:deploy if using prisma migrate) │
├─────────────────────────────────────────────────────┤
│  5. Vercel Auto-Deploys                             │
│     - postinstall: prisma generate                  │
│     - build: next build                             │
├─────────────────────────────────────────────────────┤
│  6. Health Check                                    │
│     GET /api/health/db → must return 200            │
└─────────────────────────────────────────────────────┘
```

### Why This Order Matters

- **Migration before deploy:** If the app deploys first, Prisma will try
  to use columns that don't exist yet → 500 errors.
- **Health check after deploy:** Verifies the database schema matches
  the application's expectations. If it doesn't, the health check
  returns 503 with a clear error.

---

## 4. Startup Health Check

### API Endpoint

`GET /api/health/db`

**Returns:**
- `200` — `{ status: "healthy", message: "Database schema is in sync" }`
- `503` — `{ status: "unhealthy", missingColumns: [...], missingTables: [...], error: "..." }`

### What It Checks

1. **Critical tables exist:** `vendor_listings`, `vendor_claims`, `attributes`,
   `vendor_attributes`, `product_attributes`, `marketplace_settings`
2. **Critical columns on vendor_listings:** `listingStatus`, `businessSource`,
   `adminCreated`, `phone`, `claimToken`, `inviteStatus`, `claimedAt`,
   `aiSuggestions`, `businessType`, `ownership_status`, `invite_type`, and more

### Usage

```bash
# Check after deploy
curl https://findmybites-pimpmpyparty.vercel.app/api/health/db

# Local check
bun run db:health
```

### Vercel Health Check

Configure in Vercel dashboard:
- **Path:** `/api/health/db`
- **Expected status:** 200

If the health check fails, Vercel will not route traffic to the new deployment.

---

## 5. Scripts Reference

| Script | Purpose |
|---|---|
| `bun run db:migrate` | Create a new migration from schema changes (dev) |
| `bun run db:deploy` | Apply pending migrations (production) |
| `bun run db:generate` | Regenerate Prisma client from schema |
| `bun run db:health` | Check if the database schema is in sync |
| `bun run check:schema-drift` | Verify schema.prisma has a corresponding migration |

---

## 6. Rules

1. **NEVER** modify `schema.prisma` without creating a migration.
2. **NEVER** apply schema changes directly to the database via SQL without
   also updating `schema.prisma` and the migration files.
3. **NEVER** deploy the application before applying migrations.
4. **ALWAYS** run `bun run check:schema-drift` before pushing.
5. **ALWAYS** verify `/api/health/db` returns 200 after deploying.
6. **ALWAYS** commit `schema.prisma` and migration files together.
