-- V7.1 SUBSCRIPTION INTEGRITY MIGRATION
--
-- Guarantees that at most ONE VendorSubscription row can have status='active'
-- per vendor at any time.
--
-- This is a PARTIAL UNIQUE INDEX — it only applies to rows where status='active'.
-- Rows with status='pending', 'expired', 'cancelled', or 'past_due' are excluded
-- from the index, so multiple historical subscriptions can coexist without
-- violating the constraint.
--
-- Application code (expireOtherActiveSubscriptions in subscription-service.ts)
-- expires previous active rows BEFORE setting a new row to 'active'. This index
-- is the database-level safety net that enforces the invariant even if the
-- application logic has a bug.
--
-- Before creating the index, we clean up any existing duplicate active rows
-- by keeping the one with the latest planExpiresAt and expiring the rest.

-- ── Step 1: Clean up existing duplicate active subscriptions ──────────────
-- For each vendor that has multiple active subscriptions, keep only the one
-- with the latest planExpiresAt; expire the rest.

UPDATE vendor_subscriptions
SET status = 'expired'
WHERE id IN (
  SELECT id FROM (
    SELECT
      vs.id,
      vs.vendorId,
      vs.planExpiresAt,
      ROW_NUMBER() OVER (
        PARTITION BY vs.vendorId
        ORDER BY vs.planExpiresAt DESC, vs.updatedAt DESC
      ) AS rn
    FROM vendor_subscriptions vs
    WHERE vs.status = 'active'
  ) ranked
  WHERE ranked.rn > 1
);

-- ── Step 2: Create the partial unique index ───────────────────────────────
-- This index ensures that at most ONE row per vendorId can have status='active'.
-- Any attempt to insert or update a second row to status='active' for the same
-- vendorId will raise a unique constraint violation.

CREATE UNIQUE INDEX IF NOT EXISTS vendor_subscriptions_one_active_per_vendor
  ON vendor_subscriptions ("vendorId")
  WHERE status = 'active';

-- ── Step 3: Verify the index was created ──────────────────────────────────
-- (Run this query to confirm: the index should appear in the result)
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vendor_subscriptions';

-- ── Notes ─────────────────────────────────────────────────────────────────
-- 1. This migration is IDEMPOTENT — safe to run multiple times.
-- 2. The IF NOT EXISTS clause prevents errors on re-runs.
-- 3. The cleanup in Step 1 only affects duplicate active rows — it does NOT
--    touch pending, expired, cancelled, or past_due subscriptions.
-- 4. The index name is descriptive: "one_active_per_vendor".
-- 5. PostgreSQL partial indexes are the correct tool for this — they enforce
--    a constraint only on a subset of rows, which is exactly what we need
--    (only one ACTIVE row per vendor, but unlimited historical rows).
