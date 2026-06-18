-- Add the Product table for vendor products/services
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kcqygvzxgkvwlupoyzzw/sql/new

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD CONSTRAINT IF NOT EXISTS "Product_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Product_vendorId_idx" ON "Product"("vendorId");
