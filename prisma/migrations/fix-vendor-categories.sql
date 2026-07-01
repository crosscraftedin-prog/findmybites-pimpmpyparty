-- ============================================================
-- MIGRATION: Fix vendor category values to use DB slugs
-- ============================================================
-- PROBLEM: Vendors store a mix of:
--   - Old slugs (bar-services, home-bakers)
--   - Capitalized labels (Catering, Photography, Food Truck)
--   - Display names (Decorator & Stylist, Event Planner, Kids Entertainment)
--
-- This migration normalizes ALL of them to the correct DB category slugs.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Show BEFORE state
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'BEFORE MIGRATION' as status;
SELECT category, count(*) as vendor_count FROM "vendor_listings" GROUP BY category ORDER BY vendor_count DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Migrate ALL old slugs + labels to DB slugs
-- ═══════════════════════════════════════════════════════════════════════════

-- FindMyBites categories
UPDATE "vendor_listings" SET "category" = 'bakers-bakery'
WHERE "category" IN (
  'cake-artists', 'bakers', 'cupcake-specialists', 'chocolatiers', 'dessert-makers',
  'home-bakers', 'home-bakery', 'Home Bakers', 'Home Bakery',
  'Bakers & Bakery', 'Bakers and Bakery', 'Baker', 'Bakery',
  'Cake Artist', 'Cake Artists', 'cake artist', 'cake artists',
  'Cupcake Specialist', 'Cupcake Specialists',
  'Chocolatier', 'Chocolatiers',
  'Dessert Maker', 'Dessert Makers', 'Desserts', 'dessert-makers'
);

UPDATE "vendor_listings" SET "category" = 'caterers'
WHERE "category" IN (
  'catering', 'Catering', 'Caterer', 'Caterers',
  'Catering Service', 'Catering Services',
  'Food Catering', 'Event Catering'
);

UPDATE "vendor_listings" SET "category" = 'chef-staff'
WHERE "category" IN (
  'private-chefs', 'Private Chef', 'Private Chefs',
  'Chef', 'Chefs', 'Chef & Staff', 'Chef and Staff',
  'Bartender', 'Bartenders', 'Waiter', 'Waiters',
  'Event Staff', 'Serving Staff'
);

UPDATE "vendor_listings" SET "category" = 'food-trucks'
WHERE "category" IN (
  'food-truck', 'Food Truck', 'Food Trucks', 'food trucks',
  'Food Truck Service', 'Mobile Kitchen'
);

UPDATE "vendor_listings" SET "category" = 'beverage-specialists'
WHERE "category" IN (
  'beverage-specialist', 'Beverage Specialist', 'Beverage Specialists',
  'Coffee', 'Coffee Catering', 'Tea Catering', 'Juice Bar',
  'Mocktail Bar', 'Smoothie Bar', 'Bubble Tea'
);

UPDATE "vendor_listings" SET "category" = 'specialty-food'
WHERE "category" IN (
  'specialty-foods', 'Specialty Food', 'Specialty Foods',
  'Organic Food', 'Vegan Food', 'Gluten-Free', 'Halal Food', 'Kosher Food'
);

-- PimpMyParty categories
UPDATE "vendor_listings" SET "category" = 'event-planners'
WHERE "category" IN (
  'Event Planner', 'Event Planners', 'event planner', 'event planners',
  'Event Planning', 'Wedding Planner', 'Party Planner'
);

UPDATE "vendor_listings" SET "category" = 'decorators'
WHERE "category" IN (
  'decorator', 'Decorator', 'Decorators', 'decorator & stylist',
  'Decorator & Stylist', 'Decor', 'Decoration', 'Decorations',
  'Balloon Decor', 'Floral Decor', 'Wedding Decor', 'Event Decor',
  'Interior Decorator', 'Party Decor'
);

UPDATE "vendor_listings" SET "category" = 'photographers'
WHERE "category" IN (
  'photography', 'Photography', 'Photographer', 'Photographers',
  'Wedding Photography', 'Event Photography', 'Photo', 'Photos',
  'Photography Service', 'Camera'
);

UPDATE "vendor_listings" SET "category" = 'videographers'
WHERE "category" IN (
  'videography', 'Videography', 'Videographer', 'Videographers',
  'Video', 'Video Service', 'Wedding Video', 'Event Video',
  'Drone Videography', 'Drone Video'
);

UPDATE "vendor_listings" SET "category" = 'djs'
WHERE "category" IN (
  'dj', 'DJ', 'DJs', 'djs', 'DJ Service', 'Disc Jockey',
  'Music', 'Music Service', 'Sound System'
);

UPDATE "vendor_listings" SET "category" = 'entertainers'
WHERE "category" IN (
  'entertainer', 'Entertainer', 'Entertainers', 'entertainers',
  'Magician', 'Clown', 'Mascot', 'Stilt Walker', 'Fire Performer',
  'Aerialist', 'Live Band', 'Stand-up Comedy', 'Performer', 'Performers',
  'Kids Entertainment', 'Party Entertainment', 'Children Entertainment'
);

UPDATE "vendor_listings" SET "category" = 'venues'
WHERE "category" IN (
  'venue', 'Venue', 'Venues', 'Banquet Hall', 'Banquet Halls',
  'Wedding Venue', 'Event Venue', 'Party Venue',
  'Rooftop', 'Garden', 'Farmhouse', 'Hotel', 'Resort'
);

UPDATE "vendor_listings" SET "category" = 'florists'
WHERE "category" IN (
  'florist', 'Florist', 'Florists', 'florists',
  'Floral', 'Flowers', 'Flower Shop', 'Floral Design',
  'Floral Designer', 'Wedding Flowers', 'Bouquet'
);

UPDATE "vendor_listings" SET "category" = 'rental-services'
WHERE "category" IN (
  'rental', 'Rental', 'Rentals', 'Rental Service', 'Rental Services',
  'Furniture Rental', 'Stage Rental', 'Photo Booth Rental',
  'Equipment Rental', 'Tent Rental', 'Tableware Rental'
);

UPDATE "vendor_listings" SET "category" = 'makeup-artists'
WHERE "category" IN (
  'makeup', 'Makeup', 'Makeup Artist', 'Makeup Artists',
  'Bridal Makeup', 'Party Makeup', 'HD Makeup', 'Airbrush Makeup'
);

UPDATE "vendor_listings" SET "category" = 'beauty-services'
WHERE "category" IN (
  'beauty', 'Beauty', 'Beauty Service', 'Beauty Services',
  'Hair Styling', 'Hair Stylist', 'Mehndi', 'Henna',
  'Spa', 'Nail Art', 'Grooming'
);

UPDATE "vendor_listings" SET "category" = 'transportation'
WHERE "category" IN (
  'transport', 'Transport', 'Transportation', 'transportation',
  'Wedding Car', 'Limousine', 'Limo', 'Party Bus',
  'Guest Transport', 'Vintage Car', 'Luxury Transport'
);

UPDATE "vendor_listings" SET "category" = 'invitation-printing'
WHERE "category" IN (
  'printing', 'Printing', 'Invitation', 'Invitations',
  'Invitation Card', 'Wedding Invitations', 'Birthday Cards',
  'Digital Invites', 'Banners', 'Signage', 'Stickers'
);

UPDATE "vendor_listings" SET "category" = 'kids-party-services'
WHERE "category" IN (
  'kids-party', 'Kids Party', 'Kids Party Service', 'Kids Party Services',
  'Kids Entertainment', 'Bounce House', 'Face Painting',
  'Kids Activities', 'Children Party', 'Kids Activities'
);

UPDATE "vendor_listings" SET "category" = 'audio-visual-services'
WHERE "category" IN (
  'audio-visual', 'Audio Visual', 'Audio Visual Services',
  'bar-services', 'Bar Services', 'Sound System', 'Lighting',
  'LED Wall', 'AV Production', 'AV', 'Sound', 'Stage Lighting',
  'Live Streaming', 'Lighting & AV', 'PA System'
);

UPDATE "vendor_listings" SET "category" = 'party-supplies'
WHERE "category" IN (
  'party-supply', 'Party Supply', 'Party Supplies', 'party-supplies',
  'Party Store', 'Party Shop', 'Party Props',
  'Balloons', 'Helium', 'Confetti', 'Party Accessories'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Show AFTER state — verify all categories match DB slugs
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'AFTER MIGRATION' as status;
SELECT v.category as vendor_category, count(*) as vendor_count,
  CASE WHEN c.slug IS NOT NULL THEN '✅ MATCHES DB' ELSE '❌ NO MATCH — check manually' END as db_status
FROM "vendor_listings" v
LEFT JOIN "Category" c ON c.slug = v.category
GROUP BY v.category, c.slug
ORDER BY vendor_count DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Show 10 sample vendors AFTER migration
-- ═══════════════════════════════════════════════════════════════════════════

SELECT name, category, subcategory, ecosystem
FROM "vendor_listings"
ORDER BY "createdAt" DESC
LIMIT 10;
