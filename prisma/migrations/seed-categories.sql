-- ============================================================
-- Categories + Subcategories Seed Data (v2 — fixed)
-- Only inserts subcategories for categories that exist in Category table
-- ============================================================

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', 'Bakers & Bakery', 'FINDMYBITES', 'Cakes, cupcakes, chocolates, desserts — all baked goods in one place.', 'Cake', '/vendors/cake-artist.png', 'from-orange-400 to-rose-500', 0, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'caterers', 'Caterers', 'FINDMYBITES', 'Full-service catering for weddings, corporate events, and gatherings.', 'UtensilsCrossed', '/vendors/catering.png', 'from-rose-400 to-red-500', 1, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', 'Chef & Staff', 'FINDMYBITES', 'Private chefs, pastry chefs, bartenders, waiters, and event crew.', 'ChefHat', '/vendors/private-chef.png', 'from-lime-400 to-emerald-500', 2, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', 'Food Trucks', 'FINDMYBITES', 'Mobile kitchens serving street food, BBQ, pizza, and global bites.', 'Truck', '/vendors/food-truck.png', 'from-yellow-400 to-amber-500', 3, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', 'Beverage Specialists', 'FINDMYBITES', 'Coffee, tea, mocktail, juice, smoothie, and bubble tea catering.', 'Coffee', '/vendors/catering.png', 'from-teal-400 to-cyan-500', 4, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', 'Specialty Food', 'FINDMYBITES', 'Organic, keto, vegan, gluten-free, halal, kosher, sugar-free, dairy-free.', 'UtensilsCrossed', '/vendors/catering.png', 'from-green-400 to-teal-500', 5, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', 'Event Planners', 'PIMPMYPARTY', 'End-to-end planning for weddings, milestones, and brand activations.', 'ClipboardList', '/vendors/event-planner.png', 'from-fuchsia-400 to-purple-500', 6, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'decorators', 'Decorators', 'PIMPMYPARTY', 'Balloon art, florals, tablescapes, and immersive themed decor.', 'Flower2', '/vendors/decorator.png', 'from-purple-400 to-pink-500', 7, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'photographers', 'Photographers', 'PIMPMYPARTY', 'Wedding, event, and corporate photography services.', 'Camera', '/vendors/photographer.png', 'from-pink-400 to-purple-500', 8, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'videographers', 'Videographers', 'PIMPMYPARTY', 'Cinematic video, films, and drone videography for events.', 'Video', '/vendors/photographer.png', 'from-indigo-400 to-purple-500', 9, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'djs', 'DJs', 'PIMPMYPARTY', 'DJs, live bands, and sound engineers to keep your party moving.', 'Music', '/vendors/dj.png', 'from-fuchsia-500 to-rose-500', 10, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', 'Entertainers', 'PIMPMYPARTY', 'Magicians, clowns, mascots, performers, and live acts for all ages.', 'Drama', '/vendors/entertainer.png', 'from-violet-400 to-fuchsia-500', 11, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'venues', 'Venues', 'PIMPMYPARTY', 'Banquet halls, rooftops, gardens, and unique event spaces worldwide.', 'Building2', '/vendors/venue.png', 'from-purple-500 to-indigo-500', 12, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'florists', 'Florists', 'PIMPMYPARTY', 'Wedding flowers, bouquets, centerpieces, and floral installations.', 'Flower2', '/vendors/decorator.png', 'from-rose-400 to-pink-500', 13, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', 'Rental Services', 'PIMPMYPARTY', 'Tents, furniture, tableware, and equipment rentals for events.', 'Package', '/vendors/venue.png', 'from-slate-400 to-gray-500', 14, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', 'Makeup Artists', 'PIMPMYPARTY', 'Bridal, party, and editorial makeup services.', 'Sparkles', '/vendors/entertainer.png', 'from-pink-500 to-rose-500', 15, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', 'Beauty Services', 'PIMPMYPARTY', 'Hair styling, mehndi, spa, and grooming services for events.', 'Sparkles', '/vendors/entertainer.png', 'from-rose-400 to-fuchsia-500', 16, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'transportation', 'Transportation', 'PIMPMYPARTY', 'Limousines, party buses, and guest transport for events.', 'Car', '/vendors/venue.png', 'from-blue-400 to-slate-500', 17, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', 'Invitation & Printing', 'PIMPMYPARTY', 'Custom invitations, cards, and printing for all occasions.', 'Mail', '/vendors/event-planner.png', 'from-amber-400 to-yellow-500', 18, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', 'Kids Party Services', 'PIMPMYPARTY', 'Bounce houses, mascots, games, and themed kids entertainment.', 'PartyPopper', '/vendors/entertainer.png', 'from-cyan-400 to-blue-500', 19, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', 'Audio Visual Services', 'PIMPMYPARTY', 'Sound systems, lighting, LED walls, and AV production.', 'Speaker', '/vendors/dj.png', 'from-slate-500 to-zinc-600', 20, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

INSERT INTO "Category" ("id", "slug", "label", "ecosystem", "description", "icon", "image", "accent", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', 'Party Supplies & Stores', 'PIMPMYPARTY', 'Balloons, decorations, tableware, party props, and celebration accessories.', 'PartyPopper', '/vendors/decorator.png', 'from-pink-400 to-rose-500', 21, true, now())
ON CONFLICT ("slug") DO UPDATE SET "label" = EXCLUDED."label", "ecosystem" = EXCLUDED."ecosystem", "description" = EXCLUDED."description", "icon" = EXCLUDED."icon", "image" = EXCLUDED."image", "accent" = EXCLUDED."accent", "sortOrder" = EXCLUDED."sortOrder", "active" = true;

-- Subcategories (only for categories that exist in Category table)
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-wedding-cakes', 'Wedding Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-birthday-cakes', 'Birthday Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-anniversary-cakes', 'Anniversary Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-baby-shower-cakes', 'Baby Shower Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-engagement-cakes', 'Engagement Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-corporate-cakes', 'Corporate Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-theme-cakes', 'Theme Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-fondant-cakes', 'Fondant Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-buttercream-cakes', 'Buttercream Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 8, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-custom-cakes', 'Custom Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 9, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-designer-cakes', 'Designer Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 10, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-vegan-cakes', 'Vegan Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 11, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-eggless-cakes', 'Eggless Cakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 12, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-wedding-cupcakes', 'Wedding Cupcakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 13, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-birthday-cupcakes', 'Birthday Cupcakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 14, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-mini-cupcakes', 'Mini Cupcakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 15, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-custom-cupcakes', 'Custom Cupcakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 16, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-handmade-chocolates', 'Handmade Chocolates', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 17, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-truffles', 'Truffles', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 18, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-chocolate-bouquets', 'Chocolate Bouquets', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 19, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-chocolate-boxes', 'Chocolate Boxes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 20, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-cheesecakes', 'Cheesecakes', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 21, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-dessert-cups', 'Dessert Cups', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 22, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-tiramisu', 'Tiramisu', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 23, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-mousse', 'Mousse', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 24, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-puddings', 'Puddings', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 25, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery-custom-vendor-entry', 'Custom Vendor Entry', (SELECT "id" FROM "Category" WHERE "slug" = 'bakers-bakery'), NULL, 26, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-live-counters', 'Live Counters', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-wedding-catering', 'Wedding Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-corporate-catering', 'Corporate Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-private-dining', 'Private Dining', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-bbq-grill', 'BBQ & Grill', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-buffet-catering', 'Buffet Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-canap-s-cocktails', 'Canapés & Cocktails', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-vegetarian-catering', 'Vegetarian Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-vegan-catering', 'Vegan Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 8, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-halal-catering', 'Halal Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 9, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'caterers-custom-vendor-entry', 'Custom Vendor Entry', (SELECT "id" FROM "Category" WHERE "slug" = 'caterers'), NULL, 10, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-private-chef', 'Private Chef', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-wedding-chef', 'Wedding Chef', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-corporate-chef', 'Corporate Chef', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-pastry-chef', 'Pastry Chef', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-bartender', 'Bartender', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-cocktail-maker', 'Cocktail Maker', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-mixologist', 'Mixologist', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-bar-staff', 'Bar Staff', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-waiters', 'Waiters', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 8, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-waitresses', 'Waitresses', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 9, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-hosts', 'Hosts', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 10, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-hostesses', 'Hostesses', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 11, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-serving-staff', 'Serving Staff', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 12, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-event-crew', 'Event Crew', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 13, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-kitchen-assistants', 'Kitchen Assistants', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 14, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-cleaners', 'Cleaners', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 15, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff-custom-vendor-entry', 'Custom Vendor Entry', (SELECT "id" FROM "Category" WHERE "slug" = 'chef-staff'), NULL, 16, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-burgers', 'Burgers', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-pizza', 'Pizza', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-bbq', 'BBQ', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-street-food', 'Street Food', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-desserts', 'Desserts', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-ice-cream', 'Ice Cream', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-coffee', 'Coffee', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks-vendor-types-what-they-sell', 'Vendor Types What They Sell', (SELECT "id" FROM "Category" WHERE "slug" = 'food-trucks'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-coffee-catering', 'Coffee Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-tea-catering', 'Tea Catering', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-mocktail-bar', 'Mocktail Bar', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-juice-bar', 'Juice Bar', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-smoothie-bar', 'Smoothie Bar', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-bubble-tea', 'Bubble Tea', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists-vendor-types-what-they-sell', 'Vendor Types What They Sell', (SELECT "id" FROM "Category" WHERE "slug" = 'beverage-specialists'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-organic', 'Organic', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-keto-low-carb', 'Keto & Low-Carb', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-vegan-plant-based', 'Vegan & Plant-Based', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-gluten-free', 'Gluten-Free', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-halal', 'Halal', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-kosher', 'Kosher', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-sugar-free', 'Sugar-Free', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-dairy-free', 'Dairy-Free', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food-custom-vendor-entry', 'Custom Vendor Entry', (SELECT "id" FROM "Category" WHERE "slug" = 'specialty-food'), NULL, 8, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-weddings', 'Weddings', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-corporate-events', 'Corporate Events', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-birthdays', 'Birthdays', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-brand-activations', 'Brand Activations', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-destination-events', 'Destination Events', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-festivals', 'Festivals', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'event-planners-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'event-planners'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-wedding-decor', 'Wedding Decor', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-balloon-decor', 'Balloon Decor', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-floral-decor', 'Floral Decor', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-stage-decor', 'Stage Decor', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-table-styling', 'Table Styling', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-lighting', 'Lighting', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-themed-decor', 'Themed Decor', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'decorators-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'decorators'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-wedding-photography', 'Wedding Photography', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-event-photography', 'Event Photography', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-drone-photography', 'Drone Photography', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-corporate-photography', 'Corporate Photography', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-pre-wedding-shoot', 'Pre-Wedding Shoot', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-product-photography', 'Product Photography', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'photographers-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'photographers'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-wedding-films', 'Wedding Films', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-event-coverage', 'Event Coverage', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-drone-videography', 'Drone Videography', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-promotional-videos', 'Promotional Videos', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-live-streaming', 'Live Streaming', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-documentary', 'Documentary', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'videographers-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'videographers'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-open-format', 'Open-Format', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-house-edm', 'House / EDM', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-bollywood', 'Bollywood', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-latin', 'Latin', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-afrobeats', 'Afrobeats', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-hip-hop', 'Hip-Hop', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-techno', 'Techno', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'djs-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'djs'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-magicians', 'Magicians', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-clowns-mascots', 'Clowns & Mascots', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-stilt-walkers', 'Stilt Walkers', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-fire-performers', 'Fire Performers', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-aerialists', 'Aerialists', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-live-bands', 'Live Bands', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-stand-up-comedy', 'Stand-up Comedy', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'entertainers-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'entertainers'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-banquet-halls', 'Banquet Halls', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-rooftops', 'Rooftops', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-gardens-outdoor', 'Gardens & Outdoor', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-beach-waterfront', 'Beach / Waterfront', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-hotels-resorts', 'Hotels & Resorts', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-industrial-loft', 'Industrial / Loft', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-farmhouses', 'Farmhouses', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'venues-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'venues'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'florists-wedding-flowers', 'Wedding Flowers', (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'florists-bridal-bouquets', 'Bridal Bouquets', (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'florists-centerpieces', 'Centerpieces', (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'florists-floral-installations', 'Floral Installations', (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'florists-event-florals', 'Event Florals', (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'florists-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'florists'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'rental-services-tents-canopies', 'Tents & Canopies', (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'rental-services-furniture-rental', 'Furniture Rental', (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'rental-services-tableware-linens', 'Tableware & Linens', (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'rental-services-stage-lighting', 'Stage & Lighting', (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'rental-services-power-generators', 'Power Generators', (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'rental-services-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'rental-services'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists-bridal-makeup', 'Bridal Makeup', (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists-party-makeup', 'Party Makeup', (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists-editorial-makeup', 'Editorial Makeup', (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists-hd-makeup', 'HD Makeup', (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists-airbrush-makeup', 'Airbrush Makeup', (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'makeup-artists'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services-hair-styling', 'Hair Styling', (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services-mehndi-henna', 'Mehndi / Henna', (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services-spa-massage', 'Spa & Massage', (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services-nail-art', 'Nail Art', (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services-grooming', 'Grooming', (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'beauty-services'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'transportation-limousines', 'Limousines', (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'transportation-party-buses', 'Party Buses', (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'transportation-guest-shuttles', 'Guest Shuttles', (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'transportation-vintage-cars', 'Vintage Cars', (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'transportation-luxury-sedans', 'Luxury Sedans', (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'transportation-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'transportation'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing-wedding-invitations', 'Wedding Invitations', (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing-birthday-cards', 'Birthday Cards', (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing-corporate-stationery', 'Corporate Stationery', (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing-digital-invites', 'Digital Invites', (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing-save-the-dates', 'Save the Dates', (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'invitation-printing'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services-bounce-houses', 'Bounce Houses', (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services-mascots-characters', 'Mascots & Characters', (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services-games-activities', 'Games & Activities', (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services-face-painting', 'Face Painting', (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services-themed-decor', 'Themed Decor', (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'kids-party-services'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services-sound-systems', 'Sound Systems', (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services-stage-lighting', 'Stage Lighting', (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services-led-walls', 'LED Walls', (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services-av-production', 'AV Production', (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services-live-streaming-setup', 'Live Streaming Setup', (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'audio-visual-services'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-balloons-helium', 'Balloons & Helium', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 0, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-cake-toppers', 'Cake Toppers', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 1, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-party-props', 'Party Props', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 2, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-disposable-tableware', 'Disposable Tableware', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 3, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-banners-confetti', 'Banners & Confetti', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 4, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-goodie-bags-gift-wrapping', 'Goodie Bags & Gift Wrapping', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 5, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-party-hats-accessories', 'Party Hats & Accessories', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 6, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-pi-atas-party-poppers', 'Piñatas & Party Poppers', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 7, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-custom-party-supplies', 'Custom Party Supplies', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 8, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Subcategory" ("id", "slug", "label", "categoryId", "description", "sortOrder", "active", "isPending", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies-other', 'Other', (SELECT "id" FROM "Category" WHERE "slug" = 'party-supplies'), NULL, 9, true, false, now())
ON CONFLICT ("slug") DO NOTHING;
-- Skipping subcategories for "cake-artists" (backward-compat alias, not a real category)
-- Skipping subcategories for "bakers" (backward-compat alias, not a real category)
-- Skipping subcategories for "cupcake-specialists" (backward-compat alias, not a real category)
-- Skipping subcategories for "chocolatiers" (backward-compat alias, not a real category)
-- Skipping subcategories for "dessert-makers" (backward-compat alias, not a real category)
-- Skipping subcategories for "catering" (backward-compat alias, not a real category)
-- Skipping subcategories for "private-chefs" (backward-compat alias, not a real category)
-- Skipping subcategories for "specialty-foods" (backward-compat alias, not a real category)

SELECT count(*) AS category_count FROM "Category";
SELECT count(*) AS subcategory_count FROM "Subcategory";
