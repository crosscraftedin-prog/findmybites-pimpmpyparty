-- ============================================================
-- Product Management System: extended fields
-- ============================================================
-- Adds fields for FindMyBites (food-specific) and PimpMyParty (package-specific)
-- products, plus pricing options, availability modes, and analytics.
-- ============================================================

-- FindMyBites food-specific
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subCategory" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vegetarian" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vegan" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "halal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "glutenFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sugarFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "spicyLevel" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "ingredients" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allergenInfo" TEXT;

-- PimpMyParty package-specific
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "includedServices" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "optionalServices" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "equipmentIncluded" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "indoorOutdoor" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "travelAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bookingNotice" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT;

-- Pricing options
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "offerPrice" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "startingFromPrice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hidePrice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceOnRequest" BOOLEAN NOT NULL DEFAULT false;

-- Availability modes
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "limitedTime" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "customOrderOnly" BOOLEAN NOT NULL DEFAULT false;

-- Analytics
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "enquiryCount" INTEGER NOT NULL DEFAULT 0;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "Product_subCategory_idx" ON "Product"("subCategory");
CREATE INDEX IF NOT EXISTS "Product_isAvailable_isFeatured_idx" ON "Product"("isAvailable", "isFeatured");
