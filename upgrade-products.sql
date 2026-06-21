-- Upgrade Product table with enhanced fields
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kcqygvzxgkvwlupoyzzw/sql/new

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pricingTiers" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "servings" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shape" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "eggless" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sameDay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "customOrder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pickupAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableCountries" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableStates" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableCities" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "inStock" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockCount" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "extraFields" TEXT;

CREATE INDEX IF NOT EXISTS "Product_featured_idx" ON "Product"("featured");
