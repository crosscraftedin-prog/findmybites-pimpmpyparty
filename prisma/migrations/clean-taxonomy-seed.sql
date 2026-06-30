-- ============================================================
-- CLEAN TAXONOMY SEED — Non-destructive UPSERT
-- ============================================================
-- This script:
--   1. Deletes placeholder subcategories ("Custom Vendor Entry",
--      "Vendor Types What They Sell")
--   2. Upserts correct category labels (non-destructive)
--   3. Upserts clean subcategories (non-destructive — skips existing)
--
-- SAFE TO RUN MULTIPLE TIMES — uses UPSERT and DELETE WHERE.
-- Does NOT delete admin-created categories or subcategories.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: DELETE PLACEHOLDER SUBCATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM "Subcategory"
WHERE "label" IN ('Custom Vendor Entry', 'Vendor Types What They Sell')
AND "isPending" = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: UPSERT CATEGORIES (non-destructive — only updates label/description)
-- ═══════════════════════════════════════════════════════════════════════════

-- FindMyBites (6 categories)
INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES
  (gen_random_uuid(), 'bakers-bakery', 'Home Bakers & Bakery', 'FINDMYBITES', 'Home bakers, bakeries, cake artists, cupcake specialists, chocolatiers, and dessert makers.', 'Cake', '/vendors/cake-artist.png', 'from-orange-400 to-rose-500', 0, true, now()),
  (gen_random_uuid(), 'caterers', 'Caterers', 'FINDMYBITES', 'Full-service catering for weddings, corporate events, and gatherings.', 'UtensilsCrossed', '/vendors/catering.png', 'from-rose-400 to-red-500', 1, true, now()),
  (gen_random_uuid(), 'chef-staff', 'Chef & Staff', 'FINDMYBITES', 'Private chefs, pastry chefs, bartenders, waiters, and event crew.', 'ChefHat', '/vendors/private-chef.png', 'from-lime-400 to-emerald-500', 2, true, now()),
  (gen_random_uuid(), 'food-trucks', 'Food Trucks', 'FINDMYBITES', 'Mobile kitchens serving street food, BBQ, pizza, and global bites.', 'Truck', '/vendors/food-truck.png', 'from-yellow-400 to-amber-500', 3, true, now()),
  (gen_random_uuid(), 'beverage-specialists', 'Beverage Specialists', 'FINDMYBITES', 'Coffee, tea, mocktail, juice, smoothie, and bubble tea catering.', 'Coffee', '/vendors/catering.png', 'from-teal-400 to-cyan-500', 4, true, now()),
  (gen_random_uuid(), 'specialty-food', 'Specialty Food', 'FINDMYBITES', 'Organic, keto, vegan, gluten-free, halal, kosher, sugar-free, dairy-free.', 'UtensilsCrossed', '/vendors/catering.png', 'from-green-400 to-teal-500', 5, true, now())
ON CONFLICT ("slug") DO UPDATE SET
  "label" = EXCLUDED."label",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "image" = EXCLUDED."image",
  "accent" = EXCLUDED."accent",
  "sortOrder" = EXCLUDED."sortOrder",
  "active" = true;

-- PimpMyParty (16 categories)
INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES
  (gen_random_uuid(), 'event-planners', 'Event Planners', 'PIMPMYPARTY', 'End-to-end planning for weddings, milestones, and brand activations.', 'ClipboardList', '/vendors/event-planner.png', 'from-fuchsia-400 to-purple-500', 0, true, now()),
  (gen_random_uuid(), 'decorators', 'Decorators', 'PIMPMYPARTY', 'Balloon art, florals, tablescapes, and immersive themed decor.', 'Flower2', '/vendors/decorator.png', 'from-purple-400 to-pink-500', 1, true, now()),
  (gen_random_uuid(), 'photographers', 'Photographers', 'PIMPMYPARTY', 'Wedding, event, and corporate photography services.', 'Camera', '/vendors/photographer.png', 'from-pink-400 to-purple-500', 2, true, now()),
  (gen_random_uuid(), 'videographers', 'Videographers', 'PIMPMYPARTY', 'Cinematic video, films, and drone videography for events.', 'Video', '/vendors/photographer.png', 'from-indigo-400 to-purple-500', 3, true, now()),
  (gen_random_uuid(), 'djs', 'DJs', 'PIMPMYPARTY', 'DJs, live bands, and sound engineers to keep your party moving.', 'Music', '/vendors/dj.png', 'from-fuchsia-500 to-rose-500', 4, true, now()),
  (gen_random_uuid(), 'entertainers', 'Entertainers', 'PIMPMYPARTY', 'Magicians, clowns, mascots, performers, and live acts for all ages.', 'Drama', '/vendors/entertainer.png', 'from-violet-400 to-fuchsia-500', 5, true, now()),
  (gen_random_uuid(), 'venues', 'Venues', 'PIMPMYPARTY', 'Banquet halls, rooftops, gardens, and unique event spaces worldwide.', 'Building2', '/vendors/venue.png', 'from-purple-500 to-indigo-500', 6, true, now()),
  (gen_random_uuid(), 'florists', 'Florists', 'PIMPMYPARTY', 'Wedding flowers, bouquets, centerpieces, and floral installations.', 'Flower2', '/vendors/decorator.png', 'from-rose-400 to-pink-500', 7, true, now()),
  (gen_random_uuid(), 'rental-services', 'Rental Services', 'PIMPMYPARTY', 'Tents, furniture, tableware, and equipment rentals for events.', 'Package', '/vendors/venue.png', 'from-slate-400 to-gray-500', 8, true, now()),
  (gen_random_uuid(), 'makeup-artists', 'Makeup Artists', 'PIMPMYPARTY', 'Bridal, party, and editorial makeup services.', 'Sparkles', '/vendors/entertainer.png', 'from-pink-500 to-rose-500', 9, true, now()),
  (gen_random_uuid(), 'beauty-services', 'Beauty Services', 'PIMPMYPARTY', 'Hair styling, mehndi, spa, and grooming services for events.', 'Sparkles', '/vendors/entertainer.png', 'from-rose-400 to-fuchsia-500', 10, true, now()),
  (gen_random_uuid(), 'transportation', 'Transportation', 'PIMPMYPARTY', 'Limousines, party buses, and guest transport for events.', 'Car', '/vendors/venue.png', 'from-blue-400 to-slate-500', 11, true, now()),
  (gen_random_uuid(), 'invitation-printing', 'Invitation & Printing', 'PIMPMYPARTY', 'Custom invitations, cards, and printing for all occasions.', 'Mail', '/vendors/event-planner.png', 'from-amber-400 to-yellow-500', 12, true, now()),
  (gen_random_uuid(), 'kids-party-services', 'Kids Party Services', 'PIMPMYPARTY', 'Bounce houses, mascots, games, and themed kids entertainment.', 'PartyPopper', '/vendors/entertainer.png', 'from-cyan-400 to-blue-500', 13, true, now()),
  (gen_random_uuid(), 'audio-visual-services', 'Audio Visual & Lighting', 'PIMPMYPARTY', 'Sound systems, lighting, LED walls, and AV production.', 'Speaker', '/vendors/dj.png', 'from-slate-500 to-zinc-600', 14, true, now()),
  (gen_random_uuid(), 'party-supplies', 'Party Supplies & Stores', 'PIMPMYPARTY', 'Balloons, decorations, tableware, party props, and celebration accessories.', 'PartyPopper', '/vendors/decorator.png', 'from-pink-400 to-rose-500', 15, true, now())
ON CONFLICT ("slug") DO UPDATE SET
  "label" = EXCLUDED."label",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "image" = EXCLUDED."image",
  "accent" = EXCLUDED."accent",
  "sortOrder" = EXCLUDED."sortOrder",
  "active" = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: UPSERT SUBCATEGORIES (non-destructive — ON CONFLICT DO NOTHING)
-- Only inserts subcategories that don't already exist (by slug).
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper function to generate slug
-- We use a pattern: <category-slug>-<subcategory-slugified>

-- bakers-bakery subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), rn, true, false, now()
FROM (VALUES
  ('bakers-bakery-wedding-cakes', 'Wedding Cakes', 0),
  ('bakers-bakery-birthday-cakes', 'Birthday Cakes', 1),
  ('bakers-bakery-anniversary-cakes', 'Anniversary Cakes', 2),
  ('bakers-bakery-baby-shower-cakes', 'Baby Shower Cakes', 3),
  ('bakers-bakery-engagement-cakes', 'Engagement Cakes', 4),
  ('bakers-bakery-corporate-cakes', 'Corporate Cakes', 5),
  ('bakers-bakery-theme-cakes', 'Theme Cakes', 6),
  ('bakers-bakery-fondant-cakes', 'Fondant Cakes', 7),
  ('bakers-bakery-buttercream-cakes', 'Buttercream Cakes', 8),
  ('bakers-bakery-custom-cakes', 'Custom Cakes', 9),
  ('bakers-bakery-designer-cakes', 'Designer Cakes', 10),
  ('bakers-bakery-vegan-cakes', 'Vegan Cakes', 11),
  ('bakers-bakery-eggless-cakes', 'Eggless Cakes', 12),
  ('bakers-bakery-wedding-cupcakes', 'Wedding Cupcakes', 13),
  ('bakers-bakery-birthday-cupcakes', 'Birthday Cupcakes', 14),
  ('bakers-bakery-mini-cupcakes', 'Mini Cupcakes', 15),
  ('bakers-bakery-custom-cupcakes', 'Custom Cupcakes', 16),
  ('bakers-bakery-handmade-chocolates', 'Handmade Chocolates', 17),
  ('bakers-bakery-truffles', 'Truffles', 18),
  ('bakers-bakery-chocolate-bouquets', 'Chocolate Bouquets', 19),
  ('bakers-bakery-chocolate-boxes', 'Chocolate Boxes', 20),
  ('bakers-bakery-cheesecakes', 'Cheesecakes', 21),
  ('bakers-bakery-dessert-cups', 'Dessert Cups', 22),
  ('bakers-bakery-tiramisu', 'Tiramisu', 23),
  ('bakers-bakery-mousse', 'Mousse', 24),
  ('bakers-bakery-puddings', 'Puddings', 25),
  ('bakers-bakery-brownies', 'Brownies', 26),
  ('bakers-bakery-cookies', 'Cookies', 27),
  ('bakers-bakery-bread-bakery', 'Bread & Bakery', 28)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- caterers subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), rn, true, false, now()
FROM (VALUES
  ('caterers-live-counters', 'Live Counters', 0),
  ('caterers-wedding-catering', 'Wedding Catering', 1),
  ('caterers-corporate-catering', 'Corporate Catering', 2),
  ('caterers-private-dining', 'Private Dining', 3),
  ('caterers-bbq-grill', 'BBQ & Grill', 4),
  ('caterers-buffet-catering', 'Buffet Catering', 5),
  ('caterers-canapes-cocktails', 'Canapés & Cocktails', 6),
  ('caterers-vegetarian-catering', 'Vegetarian Catering', 7),
  ('caterers-vegan-catering', 'Vegan Catering', 8),
  ('caterers-halal-catering', 'Halal Catering', 9)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- chef-staff subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), rn, true, false, now()
FROM (VALUES
  ('chef-staff-private-chef', 'Private Chef', 0),
  ('chef-staff-wedding-chef', 'Wedding Chef', 1),
  ('chef-staff-corporate-chef', 'Corporate Chef', 2),
  ('chef-staff-pastry-chef', 'Pastry Chef', 3),
  ('chef-staff-bartender', 'Bartender', 4),
  ('chef-staff-cocktail-maker', 'Cocktail Maker', 5),
  ('chef-staff-mixologist', 'Mixologist', 6),
  ('chef-staff-bar-staff', 'Bar Staff', 7),
  ('chef-staff-waiters', 'Waiters', 8),
  ('chef-staff-waitresses', 'Waitresses', 9),
  ('chef-staff-hosts', 'Hosts', 10),
  ('chef-staff-hostesses', 'Hostesses', 11),
  ('chef-staff-serving-staff', 'Serving Staff', 12),
  ('chef-staff-event-crew', 'Event Crew', 13),
  ('chef-staff-kitchen-assistants', 'Kitchen Assistants', 14),
  ('chef-staff-cleaners', 'Cleaners', 15)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- food-trucks subcategories (removed "Vendor Types What They Sell")
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), rn, true, false, now()
FROM (VALUES
  ('food-trucks-burgers', 'Burgers', 0),
  ('food-trucks-pizza', 'Pizza', 1),
  ('food-trucks-bbq', 'BBQ', 2),
  ('food-trucks-street-food', 'Street Food', 3),
  ('food-trucks-desserts', 'Desserts', 4),
  ('food-trucks-ice-cream', 'Ice Cream', 5),
  ('food-trucks-coffee', 'Coffee', 6)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- beverage-specialists subcategories (removed "Vendor Types What They Sell")
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), rn, true, false, now()
FROM (VALUES
  ('beverage-specialists-coffee-catering', 'Coffee Catering', 0),
  ('beverage-specialists-tea-catering', 'Tea Catering', 1),
  ('beverage-specialists-mocktail-bar', 'Mocktail Bar', 2),
  ('beverage-specialists-juice-bar', 'Juice Bar', 3),
  ('beverage-specialists-smoothie-bar', 'Smoothie Bar', 4),
  ('beverage-specialists-bubble-tea', 'Bubble Tea', 5)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- specialty-food subcategories (removed "Custom Vendor Entry")
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), rn, true, false, now()
FROM (VALUES
  ('specialty-food-organic', 'Organic', 0),
  ('specialty-food-keto-low-carb', 'Keto & Low-Carb', 1),
  ('specialty-food-vegan-plant-based', 'Vegan & Plant-Based', 2),
  ('specialty-food-gluten-free', 'Gluten-Free', 3),
  ('specialty-food-halal', 'Halal', 4),
  ('specialty-food-kosher', 'Kosher', 5),
  ('specialty-food-sugar-free', 'Sugar-Free', 6),
  ('specialty-food-dairy-free', 'Dairy-Free', 7)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- event-planners subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), rn, true, false, now()
FROM (VALUES
  ('event-planners-weddings', 'Weddings', 0),
  ('event-planners-corporate-events', 'Corporate Events', 1),
  ('event-planners-birthdays', 'Birthdays', 2),
  ('event-planners-brand-activations', 'Brand Activations', 3),
  ('event-planners-destination-events', 'Destination Events', 4),
  ('event-planners-festivals', 'Festivals', 5)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- decorators subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), rn, true, false, now()
FROM (VALUES
  ('decorators-wedding-decor', 'Wedding Decor', 0),
  ('decorators-balloon-decor', 'Balloon Decor', 1),
  ('decorators-floral-decor', 'Floral Decor', 2),
  ('decorators-stage-decor', 'Stage Decor', 3),
  ('decorators-table-styling', 'Table Styling', 4),
  ('decorators-lighting', 'Lighting', 5),
  ('decorators-themed-decor', 'Themed Decor', 6)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- photographers subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), rn, true, false, now()
FROM (VALUES
  ('photographers-wedding-photography', 'Wedding Photography', 0),
  ('photographers-event-photography', 'Event Photography', 1),
  ('photographers-drone-photography', 'Drone Photography', 2),
  ('photographers-corporate-photography', 'Corporate Photography', 3),
  ('photographers-pre-wedding-shoot', 'Pre-Wedding Shoot', 4),
  ('photographers-product-photography', 'Product Photography', 5)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- videographers subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), rn, true, false, now()
FROM (VALUES
  ('videographers-wedding-films', 'Wedding Films', 0),
  ('videographers-event-coverage', 'Event Coverage', 1),
  ('videographers-drone-videography', 'Drone Videography', 2),
  ('videographers-promotional-videos', 'Promotional Videos', 3),
  ('videographers-live-streaming', 'Live Streaming', 4),
  ('videographers-documentary', 'Documentary', 5)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- djs subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), rn, true, false, now()
FROM (VALUES
  ('djs-open-format', 'Open-Format', 0),
  ('djs-house-edm', 'House / EDM', 1),
  ('djs-bollywood', 'Bollywood', 2),
  ('djs-latin', 'Latin', 3),
  ('djs-afrobeats', 'Afrobeats', 4),
  ('djs-hip-hop', 'Hip-Hop', 5),
  ('djs-techno', 'Techno', 6)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- entertainers subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), rn, true, false, now()
FROM (VALUES
  ('entertainers-magicians', 'Magicians', 0),
  ('entertainers-clowns-mascots', 'Clowns & Mascots', 1),
  ('entertainers-stilt-walkers', 'Stilt Walkers', 2),
  ('entertainers-fire-performers', 'Fire Performers', 3),
  ('entertainers-aerialists', 'Aerialists', 4),
  ('entertainers-live-bands', 'Live Bands', 5),
  ('entertainers-stand-up-comedy', 'Stand-up Comedy', 6)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- venues subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), rn, true, false, now()
FROM (VALUES
  ('venues-banquet-halls', 'Banquet Halls', 0),
  ('venues-rooftops', 'Rooftops', 1),
  ('venues-gardens-outdoor', 'Gardens & Outdoor', 2),
  ('venues-beach-waterfront', 'Beach / Waterfront', 3),
  ('venues-hotels-resorts', 'Hotels & Resorts', 4),
  ('venues-industrial-loft', 'Industrial / Loft', 5),
  ('venues-farmhouses', 'Farmhouses', 6)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- florists subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), rn, true, false, now()
FROM (VALUES
  ('florists-wedding-flowers', 'Wedding Flowers', 0),
  ('florists-bridal-bouquets', 'Bridal Bouquets', 1),
  ('florists-centerpieces', 'Centerpieces', 2),
  ('florists-floral-installations', 'Floral Installations', 3),
  ('florists-event-florals', 'Event Florals', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- rental-services subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), rn, true, false, now()
FROM (VALUES
  ('rental-services-tents-canopies', 'Tents & Canopies', 0),
  ('rental-services-furniture-rental', 'Furniture Rental', 1),
  ('rental-services-tableware-linens', 'Tableware & Linens', 2),
  ('rental-services-stage-lighting', 'Stage & Lighting', 3),
  ('rental-services-power-generators', 'Power Generators', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- makeup-artists subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), rn, true, false, now()
FROM (VALUES
  ('makeup-artists-bridal-makeup', 'Bridal Makeup', 0),
  ('makeup-artists-party-makeup', 'Party Makeup', 1),
  ('makeup-artists-editorial-makeup', 'Editorial Makeup', 2),
  ('makeup-artists-hd-makeup', 'HD Makeup', 3),
  ('makeup-artists-airbrush-makeup', 'Airbrush Makeup', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- beauty-services subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), rn, true, false, now()
FROM (VALUES
  ('beauty-services-hair-styling', 'Hair Styling', 0),
  ('beauty-services-mehndi-henna', 'Mehndi / Henna', 1),
  ('beauty-services-spa-massage', 'Spa & Massage', 2),
  ('beauty-services-nail-art', 'Nail Art', 3),
  ('beauty-services-grooming', 'Grooming', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- transportation subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), rn, true, false, now()
FROM (VALUES
  ('transportation-limousines', 'Limousines', 0),
  ('transportation-party-buses', 'Party Buses', 1),
  ('transportation-guest-shuttles', 'Guest Shuttles', 2),
  ('transportation-vintage-cars', 'Vintage Cars', 3),
  ('transportation-luxury-sedans', 'Luxury Sedans', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- invitation-printing subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), rn, true, false, now()
FROM (VALUES
  ('invitation-printing-wedding-invitations', 'Wedding Invitations', 0),
  ('invitation-printing-birthday-cards', 'Birthday Cards', 1),
  ('invitation-printing-corporate-stationery', 'Corporate Stationery', 2),
  ('invitation-printing-digital-invites', 'Digital Invites', 3),
  ('invitation-printing-save-the-dates', 'Save the Dates', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- kids-party-services subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), rn, true, false, now()
FROM (VALUES
  ('kids-party-services-bounce-houses', 'Bounce Houses', 0),
  ('kids-party-services-mascots-characters', 'Mascots & Characters', 1),
  ('kids-party-services-games-activities', 'Games & Activities', 2),
  ('kids-party-services-face-painting', 'Face Painting', 3),
  ('kids-party-services-themed-decor', 'Themed Decor', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- audio-visual-services subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), rn, true, false, now()
FROM (VALUES
  ('audio-visual-services-sound-systems', 'Sound Systems', 0),
  ('audio-visual-services-stage-lighting', 'Stage Lighting', 1),
  ('audio-visual-services-led-walls', 'LED Walls', 2),
  ('audio-visual-services-av-production', 'AV Production', 3),
  ('audio-visual-services-live-streaming-setup', 'Live Streaming Setup', 4)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- party-supplies subcategories
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "sortOrder", "active", "isPending", "createdAt")
SELECT gen_random_uuid(), slug, label, (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), rn, true, false, now()
FROM (VALUES
  ('party-supplies-balloons-helium', 'Balloons & Helium', 0),
  ('party-supplies-cake-toppers', 'Cake Toppers', 1),
  ('party-supplies-party-props', 'Party Props', 2),
  ('party-supplies-disposable-tableware', 'Disposable Tableware', 3),
  ('party-supplies-banners-confetti', 'Banners & Confetti', 4),
  ('party-supplies-goodie-bags-gift-wrapping', 'Goodie Bags & Gift Wrapping', 5),
  ('party-supplies-party-hats-accessories', 'Party Hats & Accessories', 6),
  ('party-supplies-pinatas-party-poppers', 'Piñatas & Party Poppers', 7),
  ('party-supplies-custom-party-supplies', 'Custom Party Supplies', 8)
) AS t(slug, label, rn)
ON CONFLICT ("slug") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '=== CATEGORIES ===' as section;
SELECT slug, label, ecosystem FROM "Category" ORDER BY ecosystem, "sortOrder";

SELECT '=== SUBCATEGORY COUNT ===' as section;
SELECT c.slug as category, c.label, count(s.id) as subcategory_count
FROM "Category" c
LEFT JOIN "Subcategory" s ON s."categoryId" = c.id AND s.active = true
GROUP BY c.slug, c.label
ORDER BY c.ecosystem, c."sortOrder";

SELECT '=== PLACEHOLDER CHECK ===' as section;
SELECT count(*) as placeholder_count FROM "Subcategory"
WHERE "label" IN ('Custom Vendor Entry', 'Vendor Types What They Sell');
-- Expected: 0
