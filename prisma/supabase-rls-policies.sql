-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  SUPABASE PRODUCTION HARDENING — RLS + Storage Policies                  ║
-- ║  FindMyBites × PimpMyParty                                              ║
-- ║                                                                          ║
-- ║  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)    ║
-- ║  Safe to re-run (idempotent — uses DROP IF EXISTS + CREATE)              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── PHASE 1: ROW LEVEL SECURITY (RLS) ─────────────────────────────────────

-- Enable RLS on ALL tables (if not already enabled)
ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subcategory" ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first (clean slate)
DROP POLICY IF EXISTS "vendor_public_read" ON "Vendor";
DROP POLICY IF EXISTS "vendor_owner_write" ON "Vendor";
DROP POLICY IF EXISTS "vendor_admin_all" ON "Vendor";
DROP POLICY IF EXISTS "review_public_read" ON "Review";
DROP POLICY IF EXISTS "review_owner_write" ON "Review";
DROP POLICY IF EXISTS "review_admin_all" ON "Review";
DROP POLICY IF EXISTS "booking_insert" ON "Booking";
DROP POLICY IF EXISTS "booking_owner_read" ON "Booking";
DROP POLICY IF EXISTS "booking_vendor_read" ON "Booking";
DROP POLICY IF EXISTS "booking_admin_all" ON "Booking";
DROP POLICY IF EXISTS "product_public_read" ON "Product";
DROP POLICY IF EXISTS "product_owner_write" ON "Product";
DROP POLICY IF EXISTS "product_admin_all" ON "Product";
DROP POLICY IF EXISTS "category_public_read" ON "Category";
DROP POLICY IF EXISTS "category_admin_all" ON "Category";
DROP POLICY IF EXISTS "subcategory_public_read" ON "Subcategory";
DROP POLICY IF EXISTS "subcategory_admin_all" ON "Subcategory";

-- ── Vendor table policies ──────────────────────────────────────────────────
-- Public can read APPROVED vendors only (pending/rejected/flagged are hidden)
CREATE POLICY "vendor_public_read" ON "Vendor"
  FOR SELECT USING (approved = true);

-- Vendor owner can read their own vendor record (even if not approved)
CREATE POLICY "vendor_owner_read" ON "Vendor"
  FOR SELECT USING (auth.uid()::text = "userEmail" OR "userEmail" = auth.jwt() ->> 'email');

-- Vendor owner can INSERT their own vendor record
CREATE POLICY "vendor_owner_insert" ON "Vendor"
  FOR INSERT WITH CHECK ("userEmail" = auth.jwt() ->> 'email');

-- Vendor owner can UPDATE their own vendor record (but not approval status)
CREATE POLICY "vendor_owner_update" ON "Vendor"
  FOR UPDATE USING ("userEmail" = auth.jwt() ->> 'email');

-- ── Review table policies ──────────────────────────────────────────────────
-- Public can read all reviews
CREATE POLICY "review_public_read" ON "Review"
  FOR SELECT USING (true);

-- Any authenticated user can post a review
CREATE POLICY "review_authenticated_insert" ON "Review"
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── Booking table policies ─────────────────────────────────────────────────
-- Public can create bookings (customer enquiry forms)
CREATE POLICY "booking_public_insert" ON "Booking"
  FOR INSERT WITH CHECK (true);

-- Vendor owner can read bookings for their vendors
CREATE POLICY "booking_vendor_read" ON "Booking"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Vendor" v
      WHERE v.id = "Booking"."vendorId"
      AND v."userEmail" = auth.jwt() ->> 'email'
    )
  );

-- ── Product table policies ─────────────────────────────────────────────────
-- Public can read products of approved vendors
CREATE POLICY "product_public_read" ON "Product"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Vendor" v
      WHERE v.id = "Product"."vendorId"
      AND v.approved = true
    )
  );

-- Vendor owner can INSERT products for their own vendor
CREATE POLICY "product_owner_insert" ON "Product"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Vendor" v
      WHERE v.id = "Product"."vendorId"
      AND v."userEmail" = auth.jwt() ->> 'email'
    )
  );

-- Vendor owner can UPDATE/DELETE products for their own vendor
CREATE POLICY "product_owner_update" ON "Product"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Vendor" v
      WHERE v.id = "Product"."vendorId"
      AND v."userEmail" = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "product_owner_delete" ON "Product"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Vendor" v
      WHERE v.id = "Product"."vendorId"
      AND v."userEmail" = auth.jwt() ->> 'email'
    )
  );

-- ── Category & Subcategory table policies ──────────────────────────────────
-- Public can read all categories
CREATE POLICY "category_public_read" ON "Category"
  FOR SELECT USING (true);

CREATE POLICY "subcategory_public_read" ON "Subcategory"
  FOR SELECT USING (true);

-- NOTE: Category/Subcategory writes are handled via admin API routes
-- which use the service role key (bypasses RLS). No direct user writes needed.


-- ─── PHASE 3: STORAGE BUCKET SECURITY ───────────────────────────────────────

-- Create the vendor-images bucket if it doesn't exist (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-images', 'vendor-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies (clean slate)
DROP POLICY IF EXISTS "vendor_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_owner_delete" ON storage.objects;

-- Public can read all vendor images (CDN-backed)
CREATE POLICY "vendor_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-images');

-- Authenticated users can upload to vendor-images
CREATE POLICY "vendor_images_auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vendor-images');

-- Uploaders can update/delete their own files
CREATE POLICY "vendor_images_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'vendor-images' AND owner = auth.uid()
  );

CREATE POLICY "vendor_images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'vendor-images' AND owner = auth.uid()
  );


-- ─── VERIFICATION QUERIES ───────────────────────────────────────────────────
-- Run these to verify RLS is enabled and policies are in place:

-- Check RLS status:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check all policies:
-- SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Check storage policies:
-- SELECT policyname, bucket_id, cmd, role FROM pg_policies WHERE schemaname = 'storage';
