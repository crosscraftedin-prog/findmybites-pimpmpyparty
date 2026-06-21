-- Seed Category & Subcategory tables
-- Generated from src/lib/constants.ts
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Wipe existing (idempotent re-runs)
DELETE FROM "Subcategory";
DELETE FROM "Category";

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('bakers-bakery', 'bakers-bakery', 'Bakers & Bakery', 'FINDMYBITES', 'Cakes, cupcakes, chocolates, desserts — all baked goods in one place.', 'Cake', '/vendors/cake-artist.png', 'from-orange-400 to-rose-500', 0, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('caterers', 'caterers', 'Caterers', 'FINDMYBITES', 'Full-service catering for weddings, corporate events, and gatherings.', 'UtensilsCrossed', '/vendors/catering.png', 'from-rose-400 to-red-500', 1, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('chef-staff', 'chef-staff', 'Chef & Staff', 'FINDMYBITES', 'Private chefs, pastry chefs, bartenders, waiters, and event crew.', 'ChefHat', '/vendors/private-chef.png', 'from-lime-400 to-emerald-500', 2, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('food-trucks', 'food-trucks', 'Food Trucks', 'FINDMYBITES', 'Mobile kitchens serving street food, BBQ, pizza, and global bites.', 'Truck', '/vendors/food-truck.png', 'from-yellow-400 to-amber-500', 3, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('beverage-specialists', 'beverage-specialists', 'Beverage Specialists', 'FINDMYBITES', 'Coffee, tea, mocktail, juice, smoothie, and bubble tea catering.', 'Coffee', '/vendors/catering.png', 'from-teal-400 to-cyan-500', 4, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('specialty-food', 'specialty-food', 'Specialty Food', 'FINDMYBITES', 'Organic, keto, vegan, gluten-free, halal, kosher, sugar-free, dairy-free.', 'UtensilsCrossed', '/vendors/catering.png', 'from-green-400 to-teal-500', 5, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('event-planners', 'event-planners', 'Event Planners', 'PIMPMYPARTY', 'End-to-end planning for weddings, milestones, and brand activations.', 'ClipboardList', '/vendors/event-planner.png', 'from-fuchsia-400 to-purple-500', 6, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('decorators', 'decorators', 'Decorators', 'PIMPMYPARTY', 'Balloon art, florals, tablescapes, and immersive themed decor.', 'Flower2', '/vendors/decorator.png', 'from-purple-400 to-pink-500', 7, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('photographers', 'photographers', 'Photographers', 'PIMPMYPARTY', 'Wedding, event, and corporate photography services.', 'Camera', '/vendors/photographer.png', 'from-pink-400 to-purple-500', 8, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('videographers', 'videographers', 'Videographers', 'PIMPMYPARTY', 'Cinematic video, films, and drone videography for events.', 'Video', '/vendors/photographer.png', 'from-indigo-400 to-purple-500', 9, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('djs', 'djs', 'DJs', 'PIMPMYPARTY', 'DJs, live bands, and sound engineers to keep your party moving.', 'Music', '/vendors/dj.png', 'from-fuchsia-500 to-rose-500', 10, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('entertainers', 'entertainers', 'Entertainers', 'PIMPMYPARTY', 'Magicians, clowns, mascots, performers, and live acts for all ages.', 'Drama', '/vendors/entertainer.png', 'from-violet-400 to-fuchsia-500', 11, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('venues', 'venues', 'Venues', 'PIMPMYPARTY', 'Banquet halls, rooftops, gardens, and unique event spaces worldwide.', 'Building2', '/vendors/venue.png', 'from-purple-500 to-indigo-500', 12, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('florists', 'florists', 'Florists', 'PIMPMYPARTY', 'Wedding flowers, bouquets, centerpieces, and floral installations.', 'Flower2', '/vendors/decorator.png', 'from-rose-400 to-pink-500', 13, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('rental-services', 'rental-services', 'Rental Services', 'PIMPMYPARTY', 'Tents, furniture, tableware, and equipment rentals for events.', 'Package', '/vendors/venue.png', 'from-slate-400 to-gray-500', 14, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('makeup-artists', 'makeup-artists', 'Makeup Artists', 'PIMPMYPARTY', 'Bridal, party, and editorial makeup services.', 'Sparkles', '/vendors/entertainer.png', 'from-pink-500 to-rose-500', 15, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('beauty-services', 'beauty-services', 'Beauty Services', 'PIMPMYPARTY', 'Hair styling, mehndi, spa, and grooming services for events.', 'Sparkles', '/vendors/entertainer.png', 'from-rose-400 to-fuchsia-500', 16, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('transportation', 'transportation', 'Transportation', 'PIMPMYPARTY', 'Limousines, party buses, and guest transport for events.', 'Car', '/vendors/venue.png', 'from-blue-400 to-slate-500', 17, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('invitation-printing', 'invitation-printing', 'Invitation & Printing', 'PIMPMYPARTY', 'Custom invitations, cards, and printing for all occasions.', 'Mail', '/vendors/event-planner.png', 'from-amber-400 to-yellow-500', 18, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('kids-party-services', 'kids-party-services', 'Kids Party Services', 'PIMPMYPARTY', 'Bounce houses, mascots, games, and themed kids entertainment.', 'PartyPopper', '/vendors/entertainer.png', 'from-cyan-400 to-blue-500', 19, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('audio-visual-services', 'audio-visual-services', 'Audio Visual Services', 'PIMPMYPARTY', 'Sound systems, lighting, LED walls, and AV production.', 'Speaker', '/vendors/dj.png', 'from-slate-500 to-zinc-600', 20, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-wedding-cakes', 'Wedding Cakes', 'bakers-bakery', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-birthday-cakes', 'Birthday Cakes', 'bakers-bakery', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-anniversary-cakes', 'Anniversary Cakes', 'bakers-bakery', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-baby-shower-cakes', 'Baby Shower Cakes', 'bakers-bakery', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-engagement-cakes', 'Engagement Cakes', 'bakers-bakery', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-corporate-cakes', 'Corporate Cakes', 'bakers-bakery', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-theme-cakes', 'Theme Cakes', 'bakers-bakery', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-fondant-cakes', 'Fondant Cakes', 'bakers-bakery', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-buttercream-cakes', 'Buttercream Cakes', 'bakers-bakery', 8, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-custom-cakes', 'Custom Cakes', 'bakers-bakery', 9, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-designer-cakes', 'Designer Cakes', 'bakers-bakery', 10, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-vegan-cakes', 'Vegan Cakes', 'bakers-bakery', 11, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-eggless-cakes', 'Eggless Cakes', 'bakers-bakery', 12, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-wedding-cupcakes', 'Wedding Cupcakes', 'bakers-bakery', 13, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-birthday-cupcakes', 'Birthday Cupcakes', 'bakers-bakery', 14, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-mini-cupcakes', 'Mini Cupcakes', 'bakers-bakery', 15, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-custom-cupcakes', 'Custom Cupcakes', 'bakers-bakery', 16, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-handmade-chocolates', 'Handmade Chocolates', 'bakers-bakery', 17, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-truffles', 'Truffles', 'bakers-bakery', 18, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-chocolate-bouquets', 'Chocolate Bouquets', 'bakers-bakery', 19, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-chocolate-boxes', 'Chocolate Boxes', 'bakers-bakery', 20, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-cheesecakes', 'Cheesecakes', 'bakers-bakery', 21, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-dessert-cups', 'Dessert Cups', 'bakers-bakery', 22, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-tiramisu', 'Tiramisu', 'bakers-bakery', 23, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-mousse', 'Mousse', 'bakers-bakery', 24, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-puddings', 'Puddings', 'bakers-bakery', 25, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bakery-custom-vendor-entry', 'Custom Vendor Entry', 'bakers-bakery', 26, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-live-counters', 'Live Counters', 'caterers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-wedding-catering', 'Wedding Catering', 'caterers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-corporate-catering', 'Corporate Catering', 'caterers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-private-dining', 'Private Dining', 'caterers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-bbq-grill', 'BBQ & Grill', 'caterers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-buffet-catering', 'Buffet Catering', 'caterers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-canap-s-cocktails', 'Canapés & Cocktails', 'caterers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-vegetarian-catering', 'Vegetarian Catering', 'caterers', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-vegan-catering', 'Vegan Catering', 'caterers', 8, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-halal-catering', 'Halal Catering', 'caterers', 9, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'caterers-custom-vendor-entry', 'Custom Vendor Entry', 'caterers', 10, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-private-chef', 'Private Chef', 'chef-staff', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-wedding-chef', 'Wedding Chef', 'chef-staff', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-corporate-chef', 'Corporate Chef', 'chef-staff', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-pastry-chef', 'Pastry Chef', 'chef-staff', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-bartender', 'Bartender', 'chef-staff', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-cocktail-maker', 'Cocktail Maker', 'chef-staff', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-mixologist', 'Mixologist', 'chef-staff', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-bar-staff', 'Bar Staff', 'chef-staff', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-waiters', 'Waiters', 'chef-staff', 8, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-waitresses', 'Waitresses', 'chef-staff', 9, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-hosts', 'Hosts', 'chef-staff', 10, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-hostesses', 'Hostesses', 'chef-staff', 11, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-serving-staff', 'Serving Staff', 'chef-staff', 12, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-event-crew', 'Event Crew', 'chef-staff', 13, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-kitchen-assistants', 'Kitchen Assistants', 'chef-staff', 14, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-cleaners', 'Cleaners', 'chef-staff', 15, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chef-staff-custom-vendor-entry', 'Custom Vendor Entry', 'chef-staff', 16, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-burgers', 'Burgers', 'food-trucks', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-pizza', 'Pizza', 'food-trucks', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-bbq', 'BBQ', 'food-trucks', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-street-food', 'Street Food', 'food-trucks', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-desserts', 'Desserts', 'food-trucks', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-ice-cream', 'Ice Cream', 'food-trucks', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-coffee', 'Coffee', 'food-trucks', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-vendor-types-what-they-sell', 'Vendor Types What They Sell', 'food-trucks', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-coffee-catering', 'Coffee Catering', 'beverage-specialists', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-tea-catering', 'Tea Catering', 'beverage-specialists', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-mocktail-bar', 'Mocktail Bar', 'beverage-specialists', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-juice-bar', 'Juice Bar', 'beverage-specialists', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-smoothie-bar', 'Smoothie Bar', 'beverage-specialists', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-bubble-tea', 'Bubble Tea', 'beverage-specialists', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-vendor-types-what-they-sell', 'Vendor Types What They Sell', 'beverage-specialists', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-organic', 'Organic', 'specialty-food', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-keto-low-carb', 'Keto & Low-Carb', 'specialty-food', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-vegan-plant-based', 'Vegan & Plant-Based', 'specialty-food', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-gluten-free', 'Gluten-Free', 'specialty-food', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-halal', 'Halal', 'specialty-food', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-kosher', 'Kosher', 'specialty-food', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-sugar-free', 'Sugar-Free', 'specialty-food', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-dairy-free', 'Dairy-Free', 'specialty-food', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-food-custom-vendor-entry', 'Custom Vendor Entry', 'specialty-food', 8, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-weddings', 'Weddings', 'event-planners', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-corporate-events', 'Corporate Events', 'event-planners', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-birthdays', 'Birthdays', 'event-planners', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-brand-activations', 'Brand Activations', 'event-planners', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-destination-events', 'Destination Events', 'event-planners', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-festivals', 'Festivals', 'event-planners', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'event-planners-other', 'Other', 'event-planners', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-wedding-decor', 'Wedding Decor', 'decorators', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-balloon-decor', 'Balloon Decor', 'decorators', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-floral-decor', 'Floral Decor', 'decorators', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-stage-decor', 'Stage Decor', 'decorators', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-table-styling', 'Table Styling', 'decorators', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-lighting', 'Lighting', 'decorators', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-themed-decor', 'Themed Decor', 'decorators', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'decorators-other', 'Other', 'decorators', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-wedding-photography', 'Wedding Photography', 'photographers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-event-photography', 'Event Photography', 'photographers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-drone-photography', 'Drone Photography', 'photographers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-corporate-photography', 'Corporate Photography', 'photographers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-pre-wedding-shoot', 'Pre-Wedding Shoot', 'photographers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-product-photography', 'Product Photography', 'photographers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'photographers-other', 'Other', 'photographers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-wedding-films', 'Wedding Films', 'videographers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-event-coverage', 'Event Coverage', 'videographers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-drone-videography', 'Drone Videography', 'videographers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-promotional-videos', 'Promotional Videos', 'videographers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-live-streaming', 'Live Streaming', 'videographers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-documentary', 'Documentary', 'videographers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'videographers-other', 'Other', 'videographers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-open-format', 'Open-Format', 'djs', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-house-edm', 'House / EDM', 'djs', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-bollywood', 'Bollywood', 'djs', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-latin', 'Latin', 'djs', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-afrobeats', 'Afrobeats', 'djs', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-hip-hop', 'Hip-Hop', 'djs', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-techno', 'Techno', 'djs', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'djs-other', 'Other', 'djs', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-magicians', 'Magicians', 'entertainers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-clowns-mascots', 'Clowns & Mascots', 'entertainers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-stilt-walkers', 'Stilt Walkers', 'entertainers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-fire-performers', 'Fire Performers', 'entertainers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-aerialists', 'Aerialists', 'entertainers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-live-bands', 'Live Bands', 'entertainers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-stand-up-comedy', 'Stand-up Comedy', 'entertainers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'entertainers-other', 'Other', 'entertainers', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-banquet-halls', 'Banquet Halls', 'venues', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-rooftops', 'Rooftops', 'venues', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-gardens-outdoor', 'Gardens & Outdoor', 'venues', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-beach-waterfront', 'Beach / Waterfront', 'venues', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-hotels-resorts', 'Hotels & Resorts', 'venues', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-industrial-loft', 'Industrial / Loft', 'venues', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-farmhouses', 'Farmhouses', 'venues', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'venues-other', 'Other', 'venues', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'florists-wedding-flowers', 'Wedding Flowers', 'florists', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'florists-bridal-bouquets', 'Bridal Bouquets', 'florists', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'florists-centerpieces', 'Centerpieces', 'florists', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'florists-floral-installations', 'Floral Installations', 'florists', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'florists-event-florals', 'Event Florals', 'florists', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'florists-other', 'Other', 'florists', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'rental-services-tents-canopies', 'Tents & Canopies', 'rental-services', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'rental-services-furniture-rental', 'Furniture Rental', 'rental-services', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'rental-services-tableware-linens', 'Tableware & Linens', 'rental-services', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'rental-services-stage-lighting', 'Stage & Lighting', 'rental-services', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'rental-services-power-generators', 'Power Generators', 'rental-services', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'rental-services-other', 'Other', 'rental-services', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'makeup-artists-bridal-makeup', 'Bridal Makeup', 'makeup-artists', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'makeup-artists-party-makeup', 'Party Makeup', 'makeup-artists', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'makeup-artists-editorial-makeup', 'Editorial Makeup', 'makeup-artists', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'makeup-artists-hd-makeup', 'HD Makeup', 'makeup-artists', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'makeup-artists-airbrush-makeup', 'Airbrush Makeup', 'makeup-artists', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'makeup-artists-other', 'Other', 'makeup-artists', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beauty-services-hair-styling', 'Hair Styling', 'beauty-services', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beauty-services-mehndi-henna', 'Mehndi / Henna', 'beauty-services', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beauty-services-spa-massage', 'Spa & Massage', 'beauty-services', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beauty-services-nail-art', 'Nail Art', 'beauty-services', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beauty-services-grooming', 'Grooming', 'beauty-services', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beauty-services-other', 'Other', 'beauty-services', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'transportation-limousines', 'Limousines', 'transportation', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'transportation-party-buses', 'Party Buses', 'transportation', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'transportation-guest-shuttles', 'Guest Shuttles', 'transportation', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'transportation-vintage-cars', 'Vintage Cars', 'transportation', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'transportation-luxury-sedans', 'Luxury Sedans', 'transportation', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'transportation-other', 'Other', 'transportation', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'invitation-printing-wedding-invitations', 'Wedding Invitations', 'invitation-printing', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'invitation-printing-birthday-cards', 'Birthday Cards', 'invitation-printing', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'invitation-printing-corporate-stationery', 'Corporate Stationery', 'invitation-printing', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'invitation-printing-digital-invites', 'Digital Invites', 'invitation-printing', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'invitation-printing-save-the-dates', 'Save the Dates', 'invitation-printing', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'invitation-printing-other', 'Other', 'invitation-printing', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'kids-party-services-bounce-houses', 'Bounce Houses', 'kids-party-services', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'kids-party-services-mascots-characters', 'Mascots & Characters', 'kids-party-services', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'kids-party-services-games-activities', 'Games & Activities', 'kids-party-services', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'kids-party-services-face-painting', 'Face Painting', 'kids-party-services', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'kids-party-services-themed-decor', 'Themed Decor', 'kids-party-services', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'kids-party-services-other', 'Other', 'kids-party-services', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'audio-visual-services-sound-systems', 'Sound Systems', 'audio-visual-services', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'audio-visual-services-stage-lighting', 'Stage Lighting', 'audio-visual-services', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'audio-visual-services-led-walls', 'LED Walls', 'audio-visual-services', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'audio-visual-services-av-production', 'AV Production', 'audio-visual-services', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'audio-visual-services-live-streaming-setup', 'Live Streaming Setup', 'audio-visual-services', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'audio-visual-services-other', 'Other', 'audio-visual-services', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;

-- Done: 21 categories, 218 subcategories
