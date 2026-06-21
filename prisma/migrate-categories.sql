-- Migration: Update existing vendors from old FindMyBites category slugs
-- to the new 6-category architecture.
--
-- Run this in Supabase SQL Editor AFTER running seed-categories.sql.
-- Safe to re-run (idempotent — UPDATE is a no-op if already migrated).
--
-- Old (10) → New (6) mapping:
--   cake-artists         → bakers-bakery
--   bakers               → bakers-bakery
--   cupcake-specialists  → bakers-bakery
--   chocolatiers         → bakers-bakery
--   dessert-makers       → bakers-bakery
--   catering             → caterers
--   private-chefs        → chef-staff
--   food-trucks          → food-trucks (unchanged)
--   beverage-specialists → beverage-specialists (unchanged)
--   specialty-foods      → specialty-food

BEGIN;

-- Migrate vendor.category
UPDATE "Vendor" SET category = 'bakers-bakery' WHERE category = 'cake-artists';
UPDATE "Vendor" SET category = 'bakers-bakery' WHERE category = 'bakers';
UPDATE "Vendor" SET category = 'bakers-bakery' WHERE category = 'cupcake-specialists';
UPDATE "Vendor" SET category = 'bakers-bakery' WHERE category = 'chocolatiers';
UPDATE "Vendor" SET category = 'bakers-bakery' WHERE category = 'dessert-makers';
UPDATE "Vendor" SET category = 'caterers' WHERE category = 'catering';
UPDATE "Vendor" SET category = 'chef-staff' WHERE category = 'private-chefs';
UPDATE "Vendor" SET category = 'specialty-food' WHERE category = 'specialty-foods';
-- food-trucks, beverage-specialists unchanged

-- Migrate Product.productType (old type labels → new subcategory labels)
-- These are best-effort — old product types like "wedding cake" stay as-is
-- since the new architecture uses the same labels. No product data is lost.
-- The productType field is a free-text string, so existing values remain valid.

COMMIT;

-- Verify migration
SELECT 'Vendors by category (post-migration):' as info;
SELECT category, COUNT(*) as count
FROM "Vendor"
WHERE ecosystem = 'FINDMYBITES'
GROUP BY category
ORDER BY category;

-- Expected result: vendors now show bakers-bakery, caterers, chef-staff,
-- food-trucks, beverage-specialists, specialty-food (6 categories, no old slugs)
