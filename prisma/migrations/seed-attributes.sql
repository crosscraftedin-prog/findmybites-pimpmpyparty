-- ═══════════════════════════════════════════════════════════════════════════
-- Global Attribute System — Seed Data
-- ═══════════════════════════════════════════════════════════════════════════
-- Inserts 46 canonical attributes across 4 groups.
-- Idempotent: ON CONFLICT (slug) DO UPDATE — safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO "attributes" ("id", "slug", "name", "group", "icon", "color", "description", "sortOrder", "active", "ecosystem", "createdAt", "updatedAt")
VALUES
  ('attr-sugar-free', 'sugar-free', 'Sugar Free', 'dietary', 'Candy', 'emerald', 'No added refined sugar', 0, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-gluten-free', 'gluten-free', 'Gluten Free', 'dietary', 'Wheat', 'amber', 'Contains no gluten', 1, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-keto', 'keto', 'Keto', 'dietary', 'Flame', 'rose', 'Low-carb, high-fat friendly', 2, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-vegan', 'vegan', 'Vegan', 'dietary', 'Leaf', 'green', 'No animal products', 3, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-eggless', 'eggless', 'Eggless', 'dietary', 'Egg', 'yellow', 'Contains no eggs', 4, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-dairy-free', 'dairy-free', 'Dairy Free', 'dietary', 'MilkOff', 'sky', 'No dairy products', 5, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-nut-free', 'nut-free', 'Nut Free', 'dietary', 'Nut', 'orange', 'Processed in a nut-free facility', 6, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-organic', 'organic', 'Organic', 'dietary', 'Sprout', 'lime', 'Certified organic ingredients', 7, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-halal', 'halal', 'Halal', 'dietary', 'CheckCircle2', 'teal', 'Halal-certified', 8, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-jain-friendly', 'jain-friendly', 'Jain Friendly', 'dietary', 'Leaf', 'emerald', 'No root vegetables, compliant with Jain diet', 9, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-diabetic-friendly', 'diabetic-friendly', 'Diabetic Friendly', 'dietary', 'HeartPulse', 'blue', 'Low glycemic index, suitable for diabetics', 10, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-high-protein', 'high-protein', 'High Protein', 'dietary', 'Dumbbell', 'violet', 'Protein-enriched', 11, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-low-carb', 'low-carb', 'Low Carb', 'dietary', 'Flame', 'rose', 'Reduced carbohydrates', 12, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-no-preservatives', 'no-preservatives', 'No Preservatives', 'dietary', 'ShieldCheck', 'emerald', 'Free from artificial preservatives', 13, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-no-artificial-colors', 'no-artificial-colors', 'No Artificial Colors', 'dietary', 'Palette', 'emerald', 'No synthetic food coloring', 14, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-same-day-delivery', 'same-day-delivery', 'Same Day Delivery', 'service', 'Truck', 'blue', 'Delivered the same day', 15, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-midnight-delivery', 'midnight-delivery', 'Midnight Delivery', 'service', 'Moon', 'indigo', 'Midnight delivery available', 16, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-pickup-available', 'pickup-available', 'Pickup Available', 'service', 'Store', 'teal', 'Customer pickup option', 17, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-home-delivery', 'home-delivery', 'Home Delivery', 'service', 'Home', 'sky', 'Door-to-door delivery', 18, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-custom-orders', 'custom-orders', 'Custom Orders', 'service', 'Palette', 'violet', 'Bespoke/customized orders accepted', 19, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-corporate-orders', 'corporate-orders', 'Corporate Orders', 'service', 'Building2', 'slate', 'Bulk corporate catering', 20, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-bulk-orders', 'bulk-orders', 'Bulk Orders', 'service', 'Package', 'amber', 'Large quantity orders', 21, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-gift-wrapping', 'gift-wrapping', 'Gift Wrapping', 'service', 'Gift', 'pink', 'Gift wrapping available', 22, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-bestseller', 'bestseller', 'Bestseller', 'product_feature', 'Star', 'amber', 'Customer favorite', 23, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-premium', 'premium', 'Premium', 'product_feature', 'Crown', 'yellow', 'Premium quality tier', 24, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-handmade', 'handmade', 'Handmade', 'product_feature', 'Hand', 'rose', 'Crafted by hand', 25, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-fresh-daily', 'fresh-daily', 'Fresh Daily', 'product_feature', 'Sunrise', 'orange', 'Made fresh every day', 26, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-chef-recommended', 'chef-recommended', 'Chef Recommended', 'product_feature', 'ChefHat', 'violet', 'Recommended by our chefs', 27, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-seasonal', 'seasonal', 'Seasonal', 'product_feature', 'Calendar', 'teal', 'Limited seasonal offering', 28, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-limited-edition', 'limited-edition', 'Limited Edition', 'product_feature', 'Sparkles', 'fuchsia', 'Limited time only', 29, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-verified-vendor', 'verified-vendor', 'Verified Vendor', 'business', 'BadgeCheck', 'blue', 'Identity & business verified', 30, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-gst-registered', 'gst-registered', 'GST Registered', 'business', 'Receipt', 'slate', 'GST-registered business', 31, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-fssai-certified', 'fssai-certified', 'FSSAI Certified', 'business', 'ShieldCheck', 'green', 'Food safety certified (India)', 32, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-home-baker', 'home-baker', 'Home Baker', 'business', 'Home', 'amber', 'Home-based bakery', 33, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-commercial-kitchen', 'commercial-kitchen', 'Commercial Kitchen', 'business', 'Building', 'slate', 'Licensed commercial kitchen', 34, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-women-owned', 'women-owned', 'Women Owned', 'business', 'Heart', 'pink', 'Women-owned business', 35, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-family-business', 'family-business', 'Family Business', 'business', 'Users', 'teal', 'Family-run establishment', 36, TRUE, 'BOTH', NOW(), NOW()),
  ('attr-outdoor-events', 'outdoor-events', 'Outdoor Events', 'service', 'Trees', 'green', 'Outdoor event specialist', 37, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-luxury-events', 'luxury-events', 'Luxury Events', 'product_feature', 'Crown', 'yellow', 'High-end luxury events', 38, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-destination-wedding', 'destination-wedding', 'Destination Wedding', 'service', 'Plane', 'sky', 'Destination wedding planning', 39, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-budget-friendly', 'budget-friendly', 'Budget Friendly', 'product_feature', 'Wallet', 'emerald', 'Affordable pricing', 40, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-corporate-events', 'corporate-events', 'Corporate Events', 'service', 'Building2', 'slate', 'Corporate event specialist', 41, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-kids-friendly', 'kids-friendly', 'Kids Friendly', 'service', 'Baby', 'pink', 'Kid-friendly events', 42, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-indoor-venue', 'indoor-venue', 'Indoor Venue', 'service', 'Home', 'teal', 'Indoor venue available', 43, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-live-music', 'live-music', 'Live Music', 'service', 'Music', 'violet', 'Live music/performances', 44, TRUE, 'PIMPMYPARTY', NOW(), NOW()),
  ('attr-photography-included', 'photography-included', 'Photography Included', 'service', 'Camera', 'rose', 'Photography in package', 45, TRUE, 'PIMPMYPARTY', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "group" = EXCLUDED."group",
  "icon" = EXCLUDED."icon",
  "color" = EXCLUDED."color",
  "description" = EXCLUDED."description",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- Verify: SELECT "group", count(*) FROM "attributes" GROUP BY "group" ORDER BY "group";
