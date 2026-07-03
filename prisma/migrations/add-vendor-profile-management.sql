-- ============================================================
-- Vendor Business Profile Management: extended fields
-- ============================================================

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

CREATE INDEX IF NOT EXISTS "vendor_listings_businessType_idx" ON "vendor_listings"("businessType");
