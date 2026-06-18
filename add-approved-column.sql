-- Add the "approved" column to the Vendor table for the admin approval workflow
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kcqygvzxgkvwlupoyzzw/sql/new

-- Add the column (default false = pending approval)
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing 24 seed vendors as approved (they were created before this feature)
UPDATE "Vendor" SET "approved" = true WHERE "approved" = false;

-- Create an index for fast filtering (public queries filter approved=true)
CREATE INDEX IF NOT EXISTS "Vendor_approved_idx" ON "Vendor"("approved");
