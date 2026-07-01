-- ============================================================
-- Fix Category Labels — Update DB to match desired category names
-- ============================================================
-- The Category table was seeded from constants.ts which had old labels.
-- Update the labels to match the desired new category structure.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Show BEFORE
SELECT 'BEFORE' as status;
SELECT slug, label, ecosystem FROM "Category" ORDER BY ecosystem, "sortOrder";

-- ═══════════════════════════════════════════════════════════════════════════
-- Update labels to desired names
-- Change these values to whatever you want displayed in the UI
-- ═══════════════════════════════════════════════════════════════════════════

-- FindMyBites categories
UPDATE "Category" SET "label" = 'Home Bakers & Bakery' WHERE "slug" = 'bakers-bakery';
UPDATE "Category" SET "label" = 'Caterers' WHERE "slug" = 'caterers';
UPDATE "Category" SET "label" = 'Chef & Staff' WHERE "slug" = 'chef-staff';
UPDATE "Category" SET "label" = 'Food Trucks' WHERE "slug" = 'food-trucks';
UPDATE "Category" SET "label" = 'Beverage Specialists' WHERE "slug" = 'beverage-specialists';
UPDATE "Category" SET "label" = 'Specialty Food' WHERE "slug" = 'specialty-food';

-- PimpMyParty categories
UPDATE "Category" SET "label" = 'Event Planners' WHERE "slug" = 'event-planners';
UPDATE "Category" SET "label" = 'Decorators' WHERE "slug" = 'decorators';
UPDATE "Category" SET "label" = 'Photographers' WHERE "slug" = 'photographers';
UPDATE "Category" SET "label" = 'Videographers' WHERE "slug" = 'videographers';
UPDATE "Category" SET "label" = 'DJs' WHERE "slug" = 'djs';
UPDATE "Category" SET "label" = 'Entertainers' WHERE "slug" = 'entertainers';
UPDATE "Category" SET "label" = 'Venues' WHERE "slug" = 'venues';
UPDATE "Category" SET "label" = 'Florists' WHERE "slug" = 'florists';
UPDATE "Category" SET "label" = 'Rental Services' WHERE "slug" = 'rental-services';
UPDATE "Category" SET "label" = 'Makeup Artists' WHERE "slug" = 'makeup-artists';
UPDATE "Category" SET "label" = 'Beauty Services' WHERE "slug" = 'beauty-services';
UPDATE "Category" SET "label" = 'Transportation' WHERE "slug" = 'transportation';
UPDATE "Category" SET "label" = 'Invitation & Printing' WHERE "slug" = 'invitation-printing';
UPDATE "Category" SET "label" = 'Kids Party Services' WHERE "slug" = 'kids-party-services';
UPDATE "Category" SET "label" = 'Audio Visual & Lighting' WHERE "slug" = 'audio-visual-services';
UPDATE "Category" SET "label" = 'Party Supplies & Stores' WHERE "slug" = 'party-supplies';

-- Show AFTER
SELECT 'AFTER' as status;
SELECT slug, label, ecosystem FROM "Category" ORDER BY ecosystem, "sortOrder";
