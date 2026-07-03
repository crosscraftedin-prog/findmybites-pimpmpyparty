-- ============================================================
-- Add invite_type column to vendor_listings
-- ============================================================
-- Tracks how a vendor was onboarded:
--   'admin'   — admin invited them (approved immediately, auto-claim on first login)
--   'organic' — vendor self-registered (pending until admin approves)
-- ============================================================

ALTER TABLE "vendor_listings"
  ADD COLUMN IF NOT EXISTS "invite_type" TEXT NOT NULL DEFAULT 'organic';

CREATE INDEX IF NOT EXISTS "vendor_listings_invite_type_idx"
  ON "vendor_listings"("invite_type");
