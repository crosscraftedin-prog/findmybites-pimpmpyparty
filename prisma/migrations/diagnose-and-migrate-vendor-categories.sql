-- ============================================================
-- DIAGNOSTIC: Check what category values vendors actually store
-- ============================================================
-- Run this FIRST to see the current state of vendor categories
-- ============================================================

-- 1. Show 10 sample vendor records with their actual stored category values
SELECT name, category, subcategory, ecosystem
FROM "vendor_listings"
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2. Count vendors by category (shows which slugs are in use)
SELECT category, count(*) as vendor_count
FROM "vendor_listings"
GROUP BY category
ORDER BY vendor_count DESC;

-- 3. Check which of these categories exist in the Category table
SELECT v.category as vendor_category, count(*) as vendor_count,
  CASE WHEN c.slug IS NOT NULL THEN '✅ EXISTS IN DB' ELSE '❌ NOT IN DB (OLD SLUG)' END as db_status
FROM "vendor_listings" v
LEFT JOIN "Category" c ON c.slug = v.category
GROUP BY v.category, c.slug
ORDER BY vendor_count DESC;

-- 4. Show all categories in the Category table for comparison
SELECT slug, label, ecosystem FROM "Category" ORDER BY ecosystem, "sortOrder";

-- ============================================================
-- MIGRATION: Update old category slugs to new DB-driven slugs
-- ============================================================
-- Run this AFTER reviewing the diagnostic results above.
-- This updates vendor_listings.category to use the new slugs.
-- ============================================================

-- Old slug → New slug mappings (from CATEGORY_MIGRATION_MAP in constants.ts)
UPDATE "vendor_listings" SET "category" = 'bakers-bakery' WHERE "category" IN ('cake-artists', 'bakers', 'cupcake-specialists', 'chocolatiers', 'dessert-makers');
UPDATE "vendor_listings" SET "category" = 'caterers' WHERE "category" = 'catering';
UPDATE "vendor_listings" SET "category" = 'chef-staff' WHERE "category" = 'private-chefs';
UPDATE "vendor_listings" SET "category" = 'specialty-food' WHERE "category" = 'specialty-foods';

-- Verify the migration worked
SELECT v.category as vendor_category, count(*) as vendor_count,
  CASE WHEN c.slug IS NOT NULL THEN '✅ EXISTS IN DB' ELSE '❌ NOT IN DB (OLD SLUG)' END as db_status
FROM "vendor_listings" v
LEFT JOIN "Category" c ON c.slug = v.category
GROUP BY v.category, c.slug
ORDER BY vendor_count DESC;

-- 5. Show 10 sample vendor records AFTER migration
SELECT name, category, subcategory, ecosystem
FROM "vendor_listings"
ORDER BY "createdAt" DESC
LIMIT 10;
