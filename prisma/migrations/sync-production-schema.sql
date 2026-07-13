-- ═══════════════════════════════════════════════════════════════════════════
-- COMBINED PRODUCTION SCHEMA SYNC MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
-- This single migration brings the production PostgreSQL database in sync
-- with prisma/schema.prisma. It is IDEMPOTENT — uses ADD COLUMN IF NOT EXISTS
-- and CREATE INDEX IF NOT EXISTS, so it can be run multiple times safely.
--
-- Run this on your production Supabase/PostgreSQL database:
--   psql "$DATABASE_URL" -f prisma/migrations/sync-production-schema.sql
--
-- After running this migration, the Prisma client can use all columns
-- directly (no raw SQL workarounds needed).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. vendor_listings: columns from add-admin-created-listings.sql ──────
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
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "aiSuggestions" TEXT;

-- ── 2. vendor_listings: columns from add-vendor-profile-management.sql ──
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "yearStarted" INTEGER;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "businessRegNumber" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "gstVatNumber" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "languagesSpoken" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "hideAddress" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "pinterest" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "telegram" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "holidayMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "vacationMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "emergencyClosure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "homeService" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "onlineConsultation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "maxOrder" INTEGER;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "responseRate" INTEGER DEFAULT 0;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "profileViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "productViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "galleryViews" INTEGER NOT NULL DEFAULT 0;

-- ── 3. vendor_listings: columns from add-vendor-invite-type.sql ─────────
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "invite_type" TEXT NOT NULL DEFAULT 'organic';
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "ownership_status" TEXT DEFAULT 'unclaimed';

-- ── 4. vendor_listings: columns from clean-start / product management ───
-- These may already exist from earlier migrations but ADD COLUMN IF NOT EXISTS
-- makes this safe to re-run.
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "openHours" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "pickupAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "serviceAreas" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "serviceRadiusKm" INTEGER;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "settingsLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "fssaiNumber" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "prepTime" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "bookingNotice" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "responseTime" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;

-- ── 5. Social media columns ─────────────────────────────────────────────
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "snapchat" TEXT;

-- ── 6. Indexes on vendor_listings ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS "vendor_listings_listingStatus_idx" ON "vendor_listings" ("listingStatus");
CREATE INDEX IF NOT EXISTS "vendor_listings_ownership_status_idx" ON "vendor_listings" ("ownership_status");
CREATE INDEX IF NOT EXISTS "vendor_listings_adminCreated_idx" ON "vendor_listings" ("adminCreated");
CREATE INDEX IF NOT EXISTS "vendor_listings_phone_idx" ON "vendor_listings" ("phone");
CREATE INDEX IF NOT EXISTS "vendor_listings_inviteStatus_idx" ON "vendor_listings" ("inviteStatus");
CREATE INDEX IF NOT EXISTS "vendor_listings_invite_type_idx" ON "vendor_listings" ("invite_type");
CREATE INDEX IF NOT EXISTS "vendor_listings_businessType_idx" ON "vendor_listings" ("businessType");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_idx" ON "vendor_listings" ("ecosystem");
CREATE INDEX IF NOT EXISTS "vendor_listings_category_idx" ON "vendor_listings" ("category");
CREATE INDEX IF NOT EXISTS "vendor_listings_continent_idx" ON "vendor_listings" ("continent");
CREATE INDEX IF NOT EXISTS "vendor_listings_featured_idx" ON "vendor_listings" ("featured");
CREATE INDEX IF NOT EXISTS "vendor_listings_priceRange_idx" ON "vendor_listings" ("priceRange");
CREATE INDEX IF NOT EXISTS "vendor_listings_rating_idx" ON "vendor_listings" ("rating");
CREATE INDEX IF NOT EXISTS "vendor_listings_basePrice_idx" ON "vendor_listings" ("basePrice");
CREATE INDEX IF NOT EXISTS "vendor_listings_countryCode_idx" ON "vendor_listings" ("countryCode");
CREATE INDEX IF NOT EXISTS "vendor_listings_createdAt_idx" ON "vendor_listings" ("createdAt");
CREATE INDEX IF NOT EXISTS "vendor_listings_approved_idx" ON "vendor_listings" ("approved");
CREATE INDEX IF NOT EXISTS "vendor_listings_userEmail_idx" ON "vendor_listings" ("userEmail");
CREATE INDEX IF NOT EXISTS "vendor_listings_city_idx" ON "vendor_listings" ("city");
CREATE INDEX IF NOT EXISTS "vendor_listings_state_idx" ON "vendor_listings" ("state");
CREATE INDEX IF NOT EXISTS "vendor_listings_latitude_idx" ON "vendor_listings" ("latitude");
CREATE INDEX IF NOT EXISTS "vendor_listings_longitude_idx" ON "vendor_listings" ("longitude");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_category_idx" ON "vendor_listings" ("ecosystem", "category");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_continent_idx" ON "vendor_listings" ("ecosystem", "continent");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_featured_idx" ON "vendor_listings" ("ecosystem", "featured");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_priceRange_idx" ON "vendor_listings" ("ecosystem", "priceRange");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_rating_idx" ON "vendor_listings" ("ecosystem", "rating");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_approved_idx" ON "vendor_listings" ("ecosystem", "approved");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_city_idx" ON "vendor_listings" ("ecosystem", "city");
CREATE INDEX IF NOT EXISTS "vendor_listings_approved_latitude_longitude_idx" ON "vendor_listings" ("approved", "latitude", "longitude");

-- Unique index on claimToken
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_listings_claimToken_key" ON "vendor_listings" ("claimToken");

-- ── 7. vendor_claims table ──────────────────────────────────────────────
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

-- ── 8. attributes table (Global Attribute System) ───────────────────────
CREATE TABLE IF NOT EXISTS "attributes" (
  "id"          TEXT PRIMARY KEY,
  "slug"        TEXT UNIQUE NOT NULL,
  "name"        TEXT NOT NULL,
  "group"       TEXT NOT NULL,
  "icon"        TEXT,
  "color"       TEXT,
  "description" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "ecosystem"   TEXT NOT NULL DEFAULT 'BOTH',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "attributes_group_active_sort_idx" ON "attributes" ("group", "active", "sortOrder");
CREATE INDEX IF NOT EXISTS "attributes_ecosystem_active_idx" ON "attributes" ("ecosystem", "active");

-- ── 9. vendor_attributes table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "vendor_attributes" (
  "id"          TEXT PRIMARY KEY,
  "vendorId"    TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("vendorId", "attributeId")
);

CREATE INDEX IF NOT EXISTS "vendor_attributes_vendorId_idx" ON "vendor_attributes" ("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_attributes_attributeId_idx" ON "vendor_attributes" ("attributeId");

-- ── 10. product_attributes table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id"          TEXT PRIMARY KEY,
  "productId"   TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("productId", "attributeId")
);

CREATE INDEX IF NOT EXISTS "product_attributes_productId_idx" ON "product_attributes" ("productId");
CREATE INDEX IF NOT EXISTS "product_attributes_attributeId_idx" ON "product_attributes" ("attributeId");

-- ── 11. marketplace_settings table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "marketplace_settings" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'vendor_listings' AND column_name IN
--   ('listingStatus','businessSource','adminCreated','phone','claimToken',
--    'inviteStatus','claimedAt','businessType','ownership_status','invite_type');
--   -- Should return 10 rows
--
--   SELECT count(*) FROM "vendor_claims";  -- Should be 0 (empty table)
--   SELECT count(*) FROM "attributes";     -- Should be >0 after seed
--   SELECT count(*) FROM "marketplace_settings";  -- Should be 0 (empty)
-- ═══════════════════════════════════════════════════════════════════════════
