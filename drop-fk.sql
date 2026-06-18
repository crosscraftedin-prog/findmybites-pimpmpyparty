-- Drop the userEmail foreign key constraint (was blocking vendor creation)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kcqygvzxgkvwlupoyzzw/sql/new

DO $$ BEGIN
  ALTER TABLE "Vendor" DROP CONSTRAINT IF EXISTS "Vendor_userEmail_fkey";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Verify it's gone
SELECT conname FROM pg_constraint WHERE conrelid = '"Vendor"'::regclass AND contype = 'f';
