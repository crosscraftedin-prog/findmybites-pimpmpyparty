-- ═══════════════════════════════════════════════════════════════════════════
-- Seed Business Types for all categories
-- ═══════════════════════════════════════════════════════════════════════════
-- Idempotent: uses ON CONFLICT to skip existing rows.
-- Run this on production to populate the business_types table.
-- ═══════════════════════════════════════════════════════════════════════════

-- FindMyBites categories
INSERT INTO "business_types" ("id", "categoryId", "value", "label", "sortOrder", "active", "createdAt")
SELECT gen_random_uuid()::text, * FROM (VALUES
  -- bakers-bakery
  ('bakers-bakery', 'home_baker', 'Home Baker', 1, true),
  ('bakers-bakery', 'bakery', 'Bakery', 2, true),
  ('bakers-bakery', 'cake_artist', 'Cake Artist', 3, true),
  ('bakers-bakery', 'pastry_chef', 'Pastry Chef', 4, true),
  ('bakers-bakery', 'chocolatier', 'Chocolatier', 5, true),
  ('bakers-bakery', 'dessert_maker', 'Dessert Maker', 6, true),
  -- caterers
  ('caterers', 'caterer', 'Caterer', 1, true),
  ('caterers', 'cloud_kitchen', 'Cloud Kitchen', 2, true),
  ('caterers', 'meal_prep', 'Meal Prep Service', 3, true),
  ('caterers', 'buffet_service', 'Buffet Service', 4, true),
  ('caterers', 'bbq_grill', 'BBQ & Grill', 5, true),
  -- chef-staff
  ('chef-staff', 'private_chef', 'Private Chef', 1, true),
  ('chef-staff', 'home_chef', 'Home Chef', 2, true),
  ('chef-staff', 'sous_chef', 'Sous Chef', 3, true),
  ('chef-staff', 'kitchen_staff', 'Kitchen Staff', 4, true),
  -- food-trucks
  ('food-trucks', 'food_truck', 'Food Truck', 1, true),
  ('food-trucks', 'food_cart', 'Food Cart', 2, true),
  ('food-trucks', 'food_stall', 'Food Stall', 3, true),
  -- beverage-specialists
  ('beverage-specialists', 'coffee_roaster', 'Coffee Roaster', 1, true),
  ('beverage-specialists', 'tea_specialist', 'Tea Specialist', 2, true),
  ('beverage-specialists', 'juice_bar', 'Juice Bar', 3, true),
  ('beverage-specialists', 'smoothie_bar', 'Smoothie Bar', 4, true),
  -- specialty-food
  ('specialty-food', 'organic_store', 'Organic Store', 1, true),
  ('specialty-food', 'gourmet_shop', 'Gourmet Shop', 2, true),
  ('specialty-food', 'health_food', 'Health Food Store', 3, true),
  ('specialty-food', 'gift_shop', 'Gift Shop', 4, true)
) AS t("categoryId", "value", "label", "sortOrder", "active")
ON CONFLICT ("categoryId", "value") DO NOTHING;

-- PimpMyParty categories
INSERT INTO "business_types" ("id", "categoryId", "value", "label", "sortOrder", "active", "createdAt")
SELECT gen_random_uuid()::text, * FROM (VALUES
  -- event-planners
  ('event-planners', 'event_planner', 'Event Planner', 1, true),
  ('event-planners', 'wedding_planner', 'Wedding Planner', 2, true),
  ('event-planners', 'corporate_planner', 'Corporate Planner', 3, true),
  ('event-planners', 'party_planner', 'Party Planner', 4, true),
  -- decorators
  ('decorators', 'decorator', 'Decorator', 1, true),
  ('decorators', 'balloon_artist', 'Balloon Artist', 2, true),
  ('decorators', 'floral_designer', 'Floral Designer', 3, true),
  ('decorators', 'theme_decorator', 'Theme Decorator', 4, true),
  -- photographers
  ('photographers', 'photographer', 'Photographer', 1, true),
  ('photographers', 'videographer', 'Videographer', 2, true),
  ('photographers', 'drone_pilot', 'Drone Pilot', 3, true),
  ('photographers', 'photo_studio', 'Photo Studio', 4, true),
  -- djs
  ('djs', 'dj', 'DJ', 1, true),
  ('djs', 'mc', 'MC / Host', 2, true),
  ('djs', 'sound_engineer', 'Sound Engineer', 3, true),
  -- venues
  ('venues', 'banquet_hall', 'Banquet Hall', 1, true),
  ('venues', 'outdoor_venue', 'Outdoor Venue', 2, true),
  ('venues', 'restaurant_venue', 'Restaurant Venue', 3, true),
  ('venues', 'hotel_venue', 'Hotel Venue', 4, true),
  -- florists
  ('florists', 'florist', 'Florist', 1, true),
  ('florists', 'flower_shop', 'Flower Shop', 2, true),
  -- makeup-artists
  ('makeup-artists', 'makeup_artist', 'Makeup Artist', 1, true),
  ('makeup-artists', 'mehendi_artist', 'Mehendi Artist', 2, true),
  ('makeup-artists', 'hair_stylist', 'Hair Stylist', 3, true),
  -- rental-services
  ('rental-services', 'rental_service', 'Rental Service', 1, true),
  ('rental-services', 'furniture_rental', 'Furniture Rental', 2, true),
  ('rental-services', 'equipment_rental', 'Equipment Rental', 3, true)
) AS t("categoryId", "value", "label", "sortOrder", "active")
ON CONFLICT ("categoryId", "value") DO NOTHING;

-- Verify
SELECT "categoryId", count(*) FROM "business_types" GROUP BY "categoryId" ORDER BY "categoryId";
