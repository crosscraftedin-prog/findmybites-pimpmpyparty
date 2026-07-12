-- ═══════════════════════════════════════════════════════════════════════════
-- Admin-Created Business Listings — Migration
-- ═══════════════════════════════════════════════════════════════════════════
-- Adds fields to vendor_listings for the Marketplace Growth System:
--   - listingStatus (draft/published/claimed/hidden/rejected)
--   - businessSource (manual/google/website/customer)
--   - adminCreated (boolean flag)
--   - phone (for claim verification + duplicate detection)
--   - claimToken + claimTokenExpiresAt (unique, for claim links)
--   - inviteStatus + inviteSentAt + inviteOpenedAt
--   - claimedAt + claimedByUserId
--
-- Also creates the vendor_claims table for the audit trail.
--
-- ADDITIVE — does not modify or delete existing data. All new fields are
-- nullable or have safe defaults.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── New columns on vendor_listings ────────────────────────────────────────
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "listingStatus" TEXT DEFAULT 'published';
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "businessSource" TEXT DEFAULT 'manual';
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "adminCreated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "claimToken" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "claimTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "inviteStatus" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "inviteSentAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "inviteOpenedAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "claimedByUserId" TEXT;

-- ── Indexes on new columns ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "vendor_listings_listingStatus_idx" ON "vendor_listings" ("listingStatus");
CREATE INDEX IF NOT EXISTS "vendor_listings_ownership_status_idx" ON "vendor_listings" ("ownership_status");
CREATE INDEX IF NOT EXISTS "vendor_listings_adminCreated_idx" ON "vendor_listings" ("adminCreated");
CREATE INDEX IF NOT EXISTS "vendor_listings_phone_idx" ON "vendor_listings" ("phone");
CREATE INDEX IF NOT EXISTS "vendor_listings_inviteStatus_idx" ON "vendor_listings" ("inviteStatus");

-- Unique index on claimToken (must be unique when non-null)
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_listings_claimToken_key" ON "vendor_listings" ("claimToken");

-- ── vendor_claims table (audit trail) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "vendor_claims" (
  "id"              TEXT PRIMARY KEY,
  "vendorId"        TEXT NOT NULL,
  "eventType"       TEXT NOT NULL,
  "initiatedBy"     TEXT,
  "adminId"         TEXT,
  "adminEmail"      TEXT,
  "claimantEmail"   TEXT,
  "claimantUserId"  TEXT,
  "claimantName"    TEXT,
  "tokenSnippet"    TEXT,
  "notes"           TEXT,
  "metadata"        TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "vendor_claims_vendorId_idx" ON "vendor_claims" ("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_claims_eventType_idx" ON "vendor_claims" ("eventType");
CREATE INDEX IF NOT EXISTS "vendor_claims_createdAt_idx" ON "vendor_claims" ("createdAt");

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'vendor_listings' AND column_name IN ('listingStatus','businessSource','adminCreated','phone','claimToken','inviteStatus','claimedAt');
--   SELECT count(*) FROM "vendor_claims";
-- ═══════════════════════════════════════════════════════════════════════════
