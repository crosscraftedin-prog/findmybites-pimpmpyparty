-- ═══════════════════════════════════════════════════════════════
-- Filter Synchronization — Update + Add new filters
-- Run this in Supabase SQL Editor (safe to run multiple times)
-- ═══════════════════════════════════════════════════════════════

-- Helper function (recreate in case it was dropped)
CREATE OR REPLACE FUNCTION create_filter(
  p_name TEXT, p_type TEXT, p_unit TEXT, p_values TEXT[], p_categories TEXT[]
) RETURNS TEXT AS $$
DECLARE
  v_group_id TEXT;
  v_val TEXT;
  v_cat TEXT;
  v_order INT := 0;
BEGIN
  -- Get existing group or create
  SELECT id INTO v_group_id FROM filter_groups WHERE name = p_name LIMIT 1;
  IF v_group_id IS NULL THEN
    INSERT INTO filter_groups (id, name, type, unit, active, "createdAt", "updatedAt")
    VALUES ('c' || replace(gen_random_uuid()::text, '-', ''), p_name, p_type, p_unit, true, NOW(), NOW())
    RETURNING id INTO v_group_id;
  END IF;

  -- Add values (skip duplicates)
  IF array_length(p_values, 1) > 0 THEN
    FOREACH v_val IN ARRAY p_values LOOP
      INSERT INTO filter_values (id, "groupId", value, "sortOrder", active, "createdAt")
      VALUES ('c' || replace(gen_random_uuid()::text, '-', ''), v_group_id, v_val, v_order, true, NOW())
      ON CONFLICT DO NOTHING;
      v_order := v_order + 1;
    END LOOP;
  END IF;

  -- Assign to categories (skip duplicates)
  FOREACH v_cat IN ARRAY p_categories LOOP
    INSERT INTO category_filters (id, "categoryId", "filterGroupId", "createdAt")
    VALUES ('c' || replace(gen_random_uuid()::text, '-', ''), v_cat, v_group_id, NOW())
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- HOME BAKERS (bakers-bakery) — Update + Add filters
-- ═══════════════════════════════════════════════════════════════

-- Product Type (NEW for bakers-bakery)
SELECT create_filter('Bakery Product Type', 'multi', NULL,
  ARRAY['Cakes','Cupcakes','Brownies','Cookies','Cake Pops','Cheesecakes','Dessert Boxes','Snack Boxes','Donuts','Muffins','Pastries','Macarons','Breads','Pies & Tarts'],
  ARRAY['bakers-bakery']);

-- Occasion (NEW)
SELECT create_filter('Occasion', 'multi', NULL,
  ARRAY['Birthday','Wedding','Anniversary','Baby Shower','Engagement','Graduation','Corporate','Festival'],
  ARRAY['bakers-bakery','decorators','florists','party-supplies']);

-- Dietary (UPDATE — add Sugar-Free, Nut-Free to existing group)
-- This will reuse the existing "Dietary Options" group and add missing values
SELECT create_filter('Dietary Options', 'multi', NULL,
  ARRAY['Vegetarian','Vegan','Halal','Kosher','Jain','Gluten Free','Dairy Free','Organic','Sugar-Free','Nut-Free','Egg','Eggless'],
  ARRAY['caterers','bakers-bakery','chef-staff','food-trucks','specialty-food']);

-- Cake Style (UPDATE — add Sculpted Cake to existing "Cake Type")
SELECT create_filter('Cake Type', 'multi', NULL,
  ARRAY['Fondant','Buttercream','Fresh Cream','Photo Cake','Tier Cake','Cupcakes','Bento Cake','Cheesecake','Sculpted Cake'],
  ARRAY['bakers-bakery']);

-- Delivery (NEW — more detailed than existing Yes/No)
SELECT create_filter('Delivery Options', 'multi', NULL,
  ARRAY['Pickup','Local Delivery','Same-Day Delivery','Nationwide Shipping'],
  ARRAY['bakers-bakery','caterers','food-trucks','beverage-specialists','specialty-food','party-supplies','rental-services']);

-- Preparation Time (UPDATE — add specific options)
SELECT create_filter('Preparation Time', 'single', NULL,
  ARRAY['Same Day','24 Hours','2–3 Days','1 Week+'],
  ARRAY['bakers-bakery']);

-- ═══════════════════════════════════════════════════════════════
-- SNACK BOXES (bakers-bakery / specialty-food)
-- ═══════════════════════════════════════════════════════════════

-- Snack Box Type (NEW)
SELECT create_filter('Snack Box Type', 'multi', NULL,
  ARRAY['Kids Party Snack Box','Birthday Snack Box','School Snack Box','Corporate Snack Box','Breakfast Box','Lunch Box','Picnic Box','Dessert Box'],
  ARRAY['bakers-bakery','specialty-food']);

-- Contents (NEW)
SELECT create_filter('Snack Box Contents', 'multi', NULL,
  ARRAY['Sweet','Savoury','Mixed'],
  ARRAY['bakers-bakery','specialty-food']);

-- Minimum Order Quantity (NEW)
SELECT create_filter('Minimum Order Quantity', 'range', 'units', ARRAY[]::TEXT[],
  ARRAY['bakers-bakery','specialty-food','caterers']);

-- ═══════════════════════════════════════════════════════════════
-- PARTY SUPPLIES & STORES (party-supplies) — NEW CATEGORY
-- ═══════════════════════════════════════════════════════════════

-- Party Product Type (NEW)
SELECT create_filter('Party Product Type', 'multi', NULL,
  ARRAY['Balloons','Helium Balloons','Birthday Candles','Cake Toppers','Party Props','Photo Booth Props','Disposable Tableware','Party Decorations','Banners','Party Hats','Confetti','Party Poppers','Piñatas','Goodie Bags','Gift Wrapping','Celebration Accessories'],
  ARRAY['party-supplies']);

-- Theme (NEW)
SELECT create_filter('Party Theme', 'multi', NULL,
  ARRAY['Princess','Superhero','Unicorn','Dinosaur','Jungle','Space','Floral','Sports','Cartoon','Custom Theme'],
  ARRAY['party-supplies','decorators','kids-party-services']);

-- Material (NEW)
SELECT create_filter('Material', 'multi', NULL,
  ARRAY['Paper','Plastic','Foil','Latex','Wood','Eco-Friendly'],
  ARRAY['party-supplies','rental-services']);

-- Personalization (NEW)
SELECT create_filter('Personalization', 'multi', NULL,
  ARRAY['Custom Name','Photo Printing','Logo Printing'],
  ARRAY['party-supplies','invitation-printing']);

-- ═══════════════════════════════════════════════════════════════
-- UNIVERSAL FILTERS — Assign to new category too
-- ═══════════════════════════════════════════════════════════════

-- Assign existing universal filters to party-supplies
SELECT create_filter('Years of Experience', 'range', 'Years', ARRAY[]::TEXT[], ARRAY['party-supplies']);
SELECT create_filter('Home Service Available', 'single', NULL, ARRAY['Yes','No'], ARRAY['party-supplies']);
SELECT create_filter('Available for Destination Events', 'single', NULL, ARRAY['Yes','No'], ARRAY['party-supplies']);
SELECT create_filter('Emergency Booking', 'single', NULL, ARRAY['Yes','No'], ARRAY['party-supplies']);
SELECT create_filter('Booking Type', 'multi', NULL, ARRAY['Instant Booking','Request Quote','Call to Book'], ARRAY['party-supplies']);
SELECT create_filter('Minimum Budget', 'range', 'Currency', ARRAY[]::TEXT[], ARRAY['party-supplies']);

-- ═══════════════════════════════════════════════════════════════
-- CLEANUP — Remove duplicate filter values
-- ═══════════════════════════════════════════════════════════════

-- Delete duplicate filter_values (keep the oldest one)
DELETE FROM filter_values
WHERE id NOT IN (
  SELECT DISTINCT ON ("groupId", value) id
  FROM filter_values
  ORDER BY "groupId", value, "createdAt" ASC
);

-- Delete duplicate category_filters
DELETE FROM category_filters
WHERE id NOT IN (
  SELECT DISTINCT ON ("categoryId", "filterGroupId") id
  FROM category_filters
  ORDER BY "categoryId", "filterGroupId", "createdAt" ASC
);

-- Delete duplicate vendor_filter_values
DELETE FROM vendor_filter_values
WHERE id NOT IN (
  SELECT DISTINCT ON ("vendorId", "filterValueId") id
  FROM vendor_filter_values
  ORDER BY "vendorId", "filterValueId", "createdAt" ASC
);

-- ═══════════════════════════════════════════════════════════════
-- CLEANUP helper function
-- ═══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS create_filter(TEXT, TEXT, TEXT, TEXT[], TEXT[]);

-- ═════ DONE ═══
-- New filters created: ~8 new filter groups
-- Existing filters updated: Dietary Options (4 new values), Cake Type (1 new value), Preparation Time (4 values)
-- New category: party-supplies (with 5 filter groups + 6 universal filters)
-- Duplicates removed: filter_values, category_filters, vendor_filter_values
