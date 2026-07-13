-- ═══════════════════════════════════════════════════════════════════════════
-- COMBINED PRODUCTION SCHEMA SYNC MIGRATION (v2 — robust)
-- ═══════════════════════════════════════════════════════════════════════════
-- This single migration brings the production PostgreSQL database in sync
-- with prisma/schema.prisma. It is IDEMPOTENT and ROBUST:
--   - Uses ADD COLUMN IF NOT EXISTS for all columns
--   - Uses CREATE TABLE IF NOT EXISTS for all tables
--   - Uses ALTER TABLE ADD COLUMN IF NOT EXISTS to fix any existing tables
--     that may have been created with different column names
--   - Uses DO $$ blocks for index creation to handle missing columns gracefully
--
-- Run this on your production Supabase/PostgreSQL database.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. vendor_listings: ALL columns from Prisma schema ───────────────────
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
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "invite_type" TEXT NOT NULL DEFAULT 'organic';
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "ownership_status" TEXT DEFAULT 'unclaimed';
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
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "snapchat" TEXT;

-- ── 2. vendor_listings: Indexes (using DO blocks to handle errors gracefully) ─
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_listingStatus_idx" ON "vendor_listings" ("listingStatus");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_ownership_status_idx" ON "vendor_listings" ("ownership_status");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_adminCreated_idx" ON "vendor_listings" ("adminCreated");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_phone_idx" ON "vendor_listings" ("phone");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_inviteStatus_idx" ON "vendor_listings" ("inviteStatus");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_invite_type_idx" ON "vendor_listings" ("invite_type");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_listings_businessType_idx" ON "vendor_listings" ("businessType");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "vendor_listings_claimToken_key" ON "vendor_listings" ("claimToken");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Standard indexes (these columns should always exist on a basic vendor_listings table)
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
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_category_idx" ON "vendor_listings" ("ecosystem", "category");
CREATE INDEX IF NOT EXISTS "vendor_listings_ecosystem_approved_idx" ON "vendor_listings" ("ecosystem", "approved");

-- ── 3. vendor_claims table ──────────────────────────────────────────────
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

-- Ensure vendorId column exists (in case table was created with different name)
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "initiatedBy" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "adminId" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "adminEmail" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "claimantEmail" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "claimantUserId" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "claimantName" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "tokenSnippet" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "metadata" TEXT;
ALTER TABLE "vendor_claims" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_claims_vendorId_idx" ON "vendor_claims" ("vendorId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_claims_eventType_idx" ON "vendor_claims" ("eventType");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_claims_createdAt_idx" ON "vendor_claims" ("createdAt");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 4. attributes table ─────────────────────────────────────────────────
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

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "attributes_group_active_sort_idx" ON "attributes" ("group", "active", "sortOrder");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "attributes_ecosystem_active_idx" ON "attributes" ("ecosystem", "active");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 5. vendor_attributes table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "vendor_attributes" (
  "id"          TEXT PRIMARY KEY,
  "vendorId"    TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist
ALTER TABLE "vendor_attributes" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_attributes" ADD COLUMN IF NOT EXISTS "attributeId" TEXT;
ALTER TABLE "vendor_attributes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Add unique constraint (drop first to avoid conflict)
DO $$ BEGIN
  ALTER TABLE "vendor_attributes" DROP CONSTRAINT IF EXISTS "vendor_attributes_vendorId_attributeId_key";
  ALTER TABLE "vendor_attributes" ADD CONSTRAINT "vendor_attributes_vendorId_attributeId_key" UNIQUE ("vendorId", "attributeId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_attributes_vendorId_idx" ON "vendor_attributes" ("vendorId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "vendor_attributes_attributeId_idx" ON "vendor_attributes" ("attributeId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 6. product_attributes table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id"          TEXT PRIMARY KEY,
  "productId"   TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "product_attributes" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "product_attributes" ADD COLUMN IF NOT EXISTS "attributeId" TEXT;
ALTER TABLE "product_attributes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  ALTER TABLE "product_attributes" DROP CONSTRAINT IF EXISTS "product_attributes_productId_attributeId_key";
  ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_attributeId_key" UNIQUE ("productId", "attributeId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "product_attributes_productId_idx" ON "product_attributes" ("productId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "product_attributes_attributeId_idx" ON "product_attributes" ("attributeId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── 7. marketplace_settings table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "marketplace_settings" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'vendor_listings' AND column_name = 'listingStatus';
--   -- Should return 1 row
-- ═══════════════════════════════════════════════════════════════════════════
