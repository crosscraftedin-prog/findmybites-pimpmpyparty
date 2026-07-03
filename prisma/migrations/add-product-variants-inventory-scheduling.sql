-- ============================================================
-- Product Enhancement: Variants, Inventory, Scheduling, Analytics
-- ============================================================

-- Variants (JSON array stored as text)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "variants" TEXT;

-- Inventory
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockType" TEXT NOT NULL DEFAULT 'unlimited';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- Scheduling
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "scheduledPublishAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "scheduledExpiryAt" TIMESTAMP(3);

-- Enhanced analytics
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "whatsappClicks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "orderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMP(3);

-- Index for scheduling queries
CREATE INDEX IF NOT EXISTS "Product_scheduledPublishAt_idx" ON "Product"("scheduledPublishAt");
CREATE INDEX IF NOT EXISTS "Product_scheduledExpiryAt_idx" ON "Product"("scheduledExpiryAt");
CREATE INDEX IF NOT EXISTS "Product_stockType_idx" ON "Product"("stockType");
