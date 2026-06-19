-- Seed Category & Subcategory tables
-- Generated from src/lib/constants.ts
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Wipe existing (idempotent re-runs)
DELETE FROM "Subcategory";
DELETE FROM "Category";

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('cake-artists', 'cake-artists', 'Cake Artists', 'FINDMYBITES', 'Custom celebration cakes, wedding cakes, sculptural cakes.', 'Cake', '/vendors/cake-artist.png', 'from-orange-400 to-rose-500', 0, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('bakers', 'bakers', 'Bakers & Bakeries', 'FINDMYBITES', 'Artisan breads, pastries, and baked goods crafted fresh daily.', 'Croissant', '/vendors/baker.png', 'from-amber-400 to-orange-500', 1, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('cupcake-specialists', 'cupcake-specialists', 'Cupcake Specialists', 'FINDMYBITES', 'Gourmet cupcakes, mini desserts, and dessert boxes.', 'Cookie', '/vendors/desserts.png', 'from-pink-400 to-fuchsia-500', 2, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('chocolatiers', 'chocolatiers', 'Chocolatiers', 'FINDMYBITES', 'Handcrafted chocolates, truffles, and chocolate gifts.', 'Cookie', '/vendors/desserts.png', 'from-amber-600 to-orange-700', 3, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('dessert-makers', 'dessert-makers', 'Dessert Makers', 'FINDMYBITES', 'Macarons, puddings, ice cream, and sweet tables for every occasion.', 'Cookie', '/vendors/desserts.png', 'from-pink-400 to-fuchsia-500', 4, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('catering', 'catering', 'Caterers', 'FINDMYBITES', 'Full-service catering for weddings, corporate events, and gatherings.', 'UtensilsCrossed', '/vendors/catering.png', 'from-rose-400 to-red-500', 5, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('private-chefs', 'private-chefs', 'Private Chefs', 'FINDMYBITES', 'Personal chefs bringing fine dining to your home or venue.', 'ChefHat', '/vendors/private-chef.png', 'from-lime-400 to-emerald-500', 6, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('food-trucks', 'food-trucks', 'Food Trucks', 'FINDMYBITES', 'Mobile kitchens serving street food, BBQ, tacos, and global bites.', 'Truck', '/vendors/food-truck.png', 'from-yellow-400 to-amber-500', 7, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('beverage-specialists', 'beverage-specialists', 'Beverage Specialists', 'FINDMYBITES', 'Baristas, bartenders, juice bars, and beverage catering.', 'Coffee', '/vendors/catering.png', 'from-teal-400 to-cyan-500', 8, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('specialty-foods', 'specialty-foods', 'Specialty Foods', 'FINDMYBITES', 'Organic, vegan, gluten-free, and artisanal specialty foods.', 'UtensilsCrossed', '/vendors/catering.png', 'from-green-400 to-teal-500', 9, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('event-planners', 'event-planners', 'Event Planners', 'PIMPMYPARTY', 'End-to-end planning for weddings, milestones, and brand activations.', 'ClipboardList', '/vendors/event-planner.png', 'from-fuchsia-400 to-purple-500', 10, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('decorators', 'decorators', 'Decorators', 'PIMPMYPARTY', 'Balloon art, florals, tablescapes, and immersive themed decor.', 'Flower2', '/vendors/decorator.png', 'from-purple-400 to-pink-500', 11, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('photographers', 'photographers', 'Photographers', 'PIMPMYPARTY', 'Wedding, event, and corporate photography services.', 'Camera', '/vendors/photographer.png', 'from-pink-400 to-purple-500', 12, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('videographers', 'videographers', 'Videographers', 'PIMPMYPARTY', 'Cinematic video, films, and drone videography for events.', 'Video', '/vendors/photographer.png', 'from-indigo-400 to-purple-500', 13, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('djs', 'djs', 'DJs', 'PIMPMYPARTY', 'DJs, live bands, and sound engineers to keep your party moving.', 'Music', '/vendors/dj.png', 'from-fuchsia-500 to-rose-500', 14, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('entertainers', 'entertainers', 'Entertainers', 'PIMPMYPARTY', 'Magicians, clowns, mascots, performers, and live acts for all ages.', 'Drama', '/vendors/entertainer.png', 'from-violet-400 to-fuchsia-500', 15, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('venues', 'venues', 'Venues', 'PIMPMYPARTY', 'Banquet halls, rooftops, gardens, and unique event spaces worldwide.', 'Building2', '/vendors/venue.png', 'from-purple-500 to-indigo-500', 16, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('florists', 'florists', 'Florists', 'PIMPMYPARTY', 'Wedding flowers, bouquets, centerpieces, and floral installations.', 'Flower2', '/vendors/decorator.png', 'from-rose-400 to-pink-500', 17, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('rental-services', 'rental-services', 'Rental Services', 'PIMPMYPARTY', 'Tents, furniture, tableware, and equipment rentals for events.', 'Package', '/vendors/venue.png', 'from-slate-400 to-gray-500', 18, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('makeup-artists', 'makeup-artists', 'Makeup Artists', 'PIMPMYPARTY', 'Bridal, party, and editorial makeup services.', 'Sparkles', '/vendors/entertainer.png', 'from-pink-500 to-rose-500', 19, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('beauty-services', 'beauty-services', 'Beauty Services', 'PIMPMYPARTY', 'Hair styling, mehndi, spa, and grooming services for events.', 'Sparkles', '/vendors/entertainer.png', 'from-rose-400 to-fuchsia-500', 20, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('transportation', 'transportation', 'Transportation', 'PIMPMYPARTY', 'Limousines, party buses, and guest transport for events.', 'Car', '/vendors/venue.png', 'from-blue-400 to-slate-500', 21, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('invitation-printing', 'invitation-printing', 'Invitation & Printing', 'PIMPMYPARTY', 'Custom invitations, cards, and printing for all occasions.', 'Mail', '/vendors/event-planner.png', 'from-amber-400 to-yellow-500', 22, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('kids-party-services', 'kids-party-services', 'Kids Party Services', 'PIMPMYPARTY', 'Bounce houses, mascots, games, and themed kids entertainment.', 'PartyPopper', '/vendors/entertainer.png', 'from-cyan-400 to-blue-500', 23, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")
VALUES ('audio-visual-services', 'audio-visual-services', 'Audio Visual Services', 'PIMPMYPARTY', 'Sound systems, lighting, LED walls, and AV production.', 'Speaker', '/vendors/dj.png', 'from-slate-500 to-zinc-600', 24, true, NOW())
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;

INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-wedding-cakes', 'Wedding Cakes', 'cake-artists', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-birthday-cakes', 'Birthday Cakes', 'cake-artists', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-anniversary-cakes', 'Anniversary Cakes', 'cake-artists', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-baby-shower-cakes', 'Baby Shower Cakes', 'cake-artists', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-custom-cakes', 'Custom Cakes', 'cake-artists', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-designer-cakes', 'Designer Cakes', 'cake-artists', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-vegan-cakes', 'Vegan Cakes', 'cake-artists', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-eggless-cakes', 'Eggless Cakes', 'cake-artists', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cake-artists-other', 'Other', 'cake-artists', 8, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-sourdough', 'Sourdough', 'bakers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bread-loaves', 'Bread & Loaves', 'bakers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-pastries-viennoiserie', 'Pastries & Viennoiserie', 'bakers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-wedding-bread', 'Wedding Bread', 'bakers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-bagels', 'Bagels', 'bakers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-gluten-free', 'Gluten-free', 'bakers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'bakers-other', 'Other', 'bakers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cupcake-specialists-gourmet-cupcakes', 'Gourmet Cupcakes', 'cupcake-specialists', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cupcake-specialists-mini-desserts', 'Mini Desserts', 'cupcake-specialists', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cupcake-specialists-dessert-boxes', 'Dessert Boxes', 'cupcake-specialists', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cupcake-specialists-vegan-cupcakes', 'Vegan Cupcakes', 'cupcake-specialists', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cupcake-specialists-custom-cupcakes', 'Custom Cupcakes', 'cupcake-specialists', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'cupcake-specialists-other', 'Other', 'cupcake-specialists', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-truffles', 'Truffles', 'chocolatiers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-pralines', 'Pralines', 'chocolatiers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-chocolate-bars', 'Chocolate Bars', 'chocolatiers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-chocolate-gifts', 'Chocolate Gifts', 'chocolatiers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-sugar-free-chocolate', 'Sugar-Free Chocolate', 'chocolatiers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-artisan-chocolate', 'Artisan Chocolate', 'chocolatiers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'chocolatiers-other', 'Other', 'chocolatiers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-macarons', 'Macarons', 'dessert-makers', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-tiramisu-puddings', 'Tiramisu & Puddings', 'dessert-makers', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-ice-cream-gelato', 'Ice Cream & Gelato', 'dessert-makers', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-dessert-tables', 'Dessert Tables', 'dessert-makers', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-vegan-desserts', 'Vegan Desserts', 'dessert-makers', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-donuts', 'Donuts', 'dessert-makers', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'dessert-makers-other', 'Other', 'dessert-makers', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-wedding-catering', 'Wedding Catering', 'catering', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-corporate-catering', 'Corporate Catering', 'catering', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-private-dining', 'Private Dining', 'catering', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-buffet', 'Buffet', 'catering', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-bbq-grill', 'BBQ & Grill', 'catering', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-canap-s-cocktails', 'Canapés & Cocktails', 'catering', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-veg-catering', 'Veg Catering', 'catering', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'catering-other', 'Other', 'catering', 7, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-fine-dining', 'Fine Dining', 'private-chefs', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-tasting-menus', 'Tasting Menus', 'private-chefs', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-bbq-grill', 'BBQ & Grill', 'private-chefs', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-vegan-vegetarian', 'Vegan / Vegetarian', 'private-chefs', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-cuisine-specific', 'Cuisine-Specific', 'private-chefs', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-in-home-dinner-parties', 'In-home Dinner Parties', 'private-chefs', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'private-chefs-other', 'Other', 'private-chefs', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-tacos-mexican', 'Tacos & Mexican', 'food-trucks', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-bbq', 'BBQ', 'food-trucks', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-burgers', 'Burgers', 'food-trucks', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-asian-street-food', 'Asian Street Food', 'food-trucks', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-pizza', 'Pizza', 'food-trucks', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-dessert-truck', 'Dessert Truck', 'food-trucks', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'food-trucks-other', 'Other', 'food-trucks', 6, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-coffee-espresso-bar', 'Coffee & Espresso Bar', 'beverage-specialists', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-cocktail-bartending', 'Cocktail Bartending', 'beverage-specialists', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-juice-smoothie-bar', 'Juice & Smoothie Bar', 'beverage-specialists', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-wine-tasting', 'Wine Tasting', 'beverage-specialists', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-mocktail-bar', 'Mocktail Bar', 'beverage-specialists', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'beverage-specialists-other', 'Other', 'beverage-specialists', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-organic-farm-to-table', 'Organic & Farm-to-Table', 'specialty-foods', 0, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-vegan-plant-based', 'Vegan & Plant-Based', 'specialty-foods', 1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-gluten-free', 'Gluten-Free', 'specialty-foods', 2, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-keto-low-carb', 'Keto & Low-Carb', 'specialty-foods', 3, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-halal', 'Halal', 'specialty-foods', 4, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-kosher', 'Kosher', 'specialty-foods', 5, true, NOW())
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;
INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")
VALUES (gen_random_uuid()::text, 'specialty-foods-other', 'Other', 'specialty-foods', 6, true, NOW())
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

-- Done: 25 categories, 179 subcategories
