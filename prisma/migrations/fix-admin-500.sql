-- ============================================================
-- FIX: Add ALL missing columns + create Product table
-- ============================================================
-- Root cause of 500 errors:
--   1. Product table was NEVER created in production
--   2. vendor_listings (renamed from Vendor) is missing ~15 columns
--   3. Booking is missing Phase 4 columns
--   4. reviews (renamed from Review) is missing Phase 5 columns
--
-- This SQL fixes ALL of these. Safe to run multiple times.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CREATE PRODUCT TABLE (was never created in production!)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "productType" TEXT,
    "sizes" TEXT,
    "flavours" TEXT,
    "weight" TEXT,
    "prepTime" TEXT,
    "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "minGuests" INTEGER,
    "pricePerHead" INTEGER,
    "images" TEXT,
    "videoUrl" TEXT,
    "pricingTiers" TEXT,
    "servings" TEXT,
    "shape" TEXT,
    "eggless" BOOLEAN NOT NULL DEFAULT false,
    "sameDay" BOOLEAN NOT NULL DEFAULT false,
    "customOrder" BOOLEAN NOT NULL DEFAULT false,
    "pickupAvailable" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "availableCountries" TEXT,
    "availableStates" TEXT,
    "availableCities" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "stockCount" INTEGER,
    "extraFields" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ecosystem" TEXT,
    "category" TEXT,
    "packageType" TEXT DEFAULT 'standard',
    "comparePrice" INTEGER,
    "currency" TEXT DEFAULT 'USD',
    "duration" TEXT,
    "capacity" INTEGER,
    "includes" TEXT,
    "dietaryTags" TEXT,
    "addOns" TEXT,
    "leadTime" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allergens" TEXT,
    "customAllergen" TEXT,
    "cuisineType" TEXT,
    "customisationAvailable" BOOLEAN NOT NULL DEFAULT true,
    "customisationNotes" TEXT,
    "shelfLife" TEXT,
    "storageMethod" TEXT,
    "storageInstructions" TEXT,
    "recipePublic" BOOLEAN NOT NULL DEFAULT false,
    "recipeText" TEXT,
    "recipePdf" TEXT,
    "discountPercent" INTEGER,
    "offerType" TEXT DEFAULT 'none',
    "offerLabel" TEXT,
    "offerExpiresAt" TIMESTAMP(3),
    "freeItemDescription" TEXT,
    "bundleDescription" TEXT,
    "bundleDiscount" INTEGER,
    "isFlashDeal" BOOLEAN NOT NULL DEFAULT false,
    "flashDealEndsAt" TIMESTAMP(3),
    "minOrderForOffer" INTEGER,
    "exclusiveMemberOffer" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "templateSlug" TEXT,
    "templateVersion" INTEGER,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE INDEX IF NOT EXISTS "Product_vendorId_idx" ON "Product"("vendorId");
CREATE INDEX IF NOT EXISTS "Product_productType_idx" ON "Product"("productType");
CREATE INDEX IF NOT EXISTS "Product_featured_idx" ON "Product"("featured");
CREATE INDEX IF NOT EXISTS "Product_ecosystem_idx" ON "Product"("ecosystem");
CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category");
CREATE INDEX IF NOT EXISTS "Product_isAvailable_idx" ON "Product"("isAvailable");
CREATE INDEX IF NOT EXISTS "Product_templateSlug_idx" ON "Product"("templateSlug");

-- Product FK to vendor_listings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Product_vendorId_fkey' AND table_name = 'Product') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping Product FK: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ADD MISSING COLUMNS TO vendor_listings (was "Vendor")
-- The original table is missing ~15 columns that Prisma expects
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "openHours" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "pickupAvailable" BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "serviceAreas" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "snapchat" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "fssaiNumber" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "settingsLocked" BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "ownership_status" TEXT DEFAULT 'unclaimed';
  ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping vendor_listings columns: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ADD MISSING COLUMNS TO Booking
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "phone" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "eventTime" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "address" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "notes" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "referenceImage" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "productId" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "leadScore" INTEGER;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "aiQualification" TEXT;
  ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "conciergeEventId" TEXT;
  CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
  CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
  CREATE INDEX IF NOT EXISTS "Booking_email_idx" ON "Booking"("email");
  CREATE INDEX IF NOT EXISTS "Booking_conciergeEventId_idx" ON "Booking"("conciergeEventId");
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping Booking columns: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ADD MISSING COLUMNS TO reviews (was "Review")
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerEmail" TEXT;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "photos" TEXT;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorReply" TEXT;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorRepliedAt" TIMESTAMP(3);
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "productId" TEXT;
  CREATE INDEX IF NOT EXISTS "reviews_reviewerEmail_idx" ON "reviews"("reviewerEmail");
  CREATE INDEX IF NOT EXISTS "reviews_verified_idx" ON "reviews"("verified");
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping reviews columns: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. FIX FK CONSTRAINTS — the original FKs referenced "Vendor" and "Review"
--    which are now renamed. Need to recreate them pointing to the new names.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop old FK constraints that reference "Vendor" or "Review" (old names)
DO $$
BEGIN
  -- Drop Review_vendorId_fkey (references "Vendor" which is now "vendor_listings")
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Review_vendorId_fkey' AND table_name = 'reviews') THEN
    ALTER TABLE "reviews" DROP CONSTRAINT "Review_vendorId_fkey";
  END IF;
  -- Drop Booking_vendorId_fkey (references "Vendor")
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Booking_vendorId_fkey' AND table_name = 'Booking') THEN
    ALTER TABLE "Booking" DROP CONSTRAINT "Booking_vendorId_fkey";
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping FK drop: %', SQLERRM;
END $$;

-- Recreate FKs with correct table names
DO $$
BEGIN
  -- reviews → vendor_listings
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reviews_vendorId_fkey' AND table_name = 'reviews') THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;

  -- Booking → vendor_listings
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Booking_vendorId_fkey' AND table_name = 'Booking') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;

  -- Product → vendor_listings
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Product_vendorId_fkey' AND table_name = 'Product') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping FK creation: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. VERIFY — check all tables and key columns exist
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Product table exists' as check, CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'Product' AND table_schema = 'public'
) THEN 'YES' ELSE 'NO' END as result;

SELECT 'vendor_listings has approved column' as check, CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_listings' AND column_name = 'approved' AND table_schema = 'public'
) THEN 'YES' ELSE 'NO' END as result;

SELECT 'vendor_listings has deliveryAvailable column' as check, CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_listings' AND column_name = 'deliveryAvailable' AND table_schema = 'public'
) THEN 'YES' ELSE 'NO' END as result;

SELECT 'Booking has leadScore column' as check, CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name = 'Booking' AND column_name = 'leadScore' AND table_schema = 'public'
) THEN 'YES' ELSE 'NO' END as result;

SELECT 'reviews has verified column' as check, CASE WHEN EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'verified' AND table_schema = 'public'
) THEN 'YES' ELSE 'NO' END as result;
