-- Enhanced schema: add business settings + SEO to Vendor, expand Product table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kcqygvzxgkvwlupoyzzw/sql/new

-- 1. Add business settings + SEO fields to Vendor
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "openHours" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "pickupAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "serviceAreas" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;

-- 2. Add enhanced Product columns (if Product table already exists)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productType" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sizes" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "flavours" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "prepTime" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minGuests" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pricePerHead" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images" TEXT;

-- 3. Make slug unique on Product (only if no duplicates exist)
DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- 4. Add indexes for product discovery
CREATE INDEX IF NOT EXISTS "Product_productType_idx" ON "Product"("productType");
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");
