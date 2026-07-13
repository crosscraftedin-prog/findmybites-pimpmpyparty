# Prisma Migration & Deployment Workflow

## Migration Strategy

### Development
```bash
bun run db:migrate -- --name <descriptive_name>
```
This generates a new migration in `prisma/migrations/<timestamp>/migration.sql`.

### Production
```bash
bun run db:deploy
```
This applies all pending migrations via `prisma migrate deploy`.

### Emergency Recovery Only
`prisma/migrations/sync-production-schema.sql` is an idempotent "catch-up" migration
for emergencies when the database is severely out of sync. **Do NOT use it for
normal deployments.** Use `bun run db:deploy` instead.

---

## CI: Schema Drift Check

**Local:** `bun run check:schema-drift`

**GitHub Actions:** `.github/workflows/schema-drift-check.yml` (must be added manually —
the git token lacks `workflow` scope to push it automatically)

Fails if:
- `schema.prisma` changed but no migration was created
- A migration was added but `schema.prisma` was not committed
- Prisma client is not generated (`node_modules/.prisma/client` missing)

---

## Deployment Order (MANDATORY)

```
1. Generate migration → bun run db:migrate -- --name <name>
2. Commit & push       → git add prisma/ && git commit && git push
3. CI checks           → schema drift check must pass
4. Apply migration     → bun run db:deploy (on production)
5. Vercel auto-deploys → postinstall: prisma generate → next build
6. Health check        → GET /api/health/db must return 200
```

---

## Health Check

`GET /api/health/db` — cached for 60 seconds, never blocks requests.

```json
// Healthy
{ "healthy": true, "prisma": true, "missingTables": [], "missingColumns": [] }

// Unhealthy
{ "healthy": false, "prisma": false, "missingTables": [...], "missingColumns": [] }
```

Configure as Vercel deployment health check path: `/api/health/db`

---

## Error Handling

All API routes catch Prisma errors and return generic messages:
- Client sees: `"We couldn't complete your request. Please try again."`
- Server logs: full error with stack trace via `console.error`

No Prisma stack traces or column names are ever exposed to clients.

---

## Vendor Creation (Atomic)

Vendor creation runs inside `db.$transaction()`:
- Creates vendor record
- Flags custom subcategories for admin review
- Rolls back ALL changes if any step fails
