-- ============================================================
-- Category Table Enhancement — Add SEO + Featured columns
-- ============================================================
-- Adds: seoTitle, seoDescription, featured
-- Seeds: icon, image, accent (from the old constants.ts values)
--
-- After this migration, the Category table is the SINGLE SOURCE OF TRUTH
-- for ALL category metadata. constants.ts no longer needs icons/images/accents.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: ADD NEW COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: SEED icon, image, accent FOR ALL CATEGORIES
-- (These were previously in constants.ts — now they live in the DB)
-- ═══════════════════════════════════════════════════════════════════════════

-- FindMyBites
UPDATE "Category" SET
  "icon" = 'Cake', "image" = '/vendors/cake-artist.png', "accent" = 'from-orange-400 to-rose-500',
  "seoTitle" = 'Home Bakers & Bakery — Custom Cakes, Cupcakes & Desserts',
  "seoDescription" = 'Find home bakers, bakeries, cake artists, and dessert makers near you. Custom wedding cakes, birthday cakes, cupcakes, chocolates, and more.'
WHERE "slug" = 'bakers-bakery';

UPDATE "Category" SET
  "icon" = 'UtensilsCrossed', "image" = '/vendors/catering.png', "accent" = 'from-rose-400 to-red-500',
  "seoTitle" = 'Caterers — Wedding & Event Catering Services',
  "seoDescription" = 'Find professional caterers for weddings, corporate events, and private parties. Full-service catering, live counters, buffet, and specialty cuisine.'
WHERE "slug" = 'caterers';

UPDATE "Category" SET
  "icon" = 'ChefHat', "image" = '/vendors/private-chef.png', "accent" = 'from-lime-400 to-emerald-500',
  "seoTitle" = 'Chef & Staff — Private Chefs, Bartenders & Event Crew',
  "seoDescription" = 'Hire private chefs, pastry chefs, bartenders, mixologists, waiters, and event staff for your next celebration.'
WHERE "slug" = 'chef-staff';

UPDATE "Category" SET
  "icon" = 'Truck', "image" = '/vendors/food-truck.png', "accent" = 'from-yellow-400 to-amber-500',
  "seoTitle" = 'Food Trucks — Street Food & Mobile Catering',
  "seoDescription" = 'Book food trucks serving burgers, pizza, BBQ, street food, desserts, and coffee for your event.'
WHERE "slug" = 'food-trucks';

UPDATE "Category" SET
  "icon" = 'Coffee', "image" = '/vendors/catering.png', "accent" = 'from-teal-400 to-cyan-500',
  "seoTitle" = 'Beverage Specialists — Coffee, Mocktails & Juice Bars',
  "seoDescription" = 'Find coffee catering, tea catering, mocktail bars, juice bars, smoothie bars, and bubble tea services.'
WHERE "slug" = 'beverage-specialists';

UPDATE "Category" SET
  "icon" = 'UtensilsCrossed', "image" = '/vendors/catering.png', "accent" = 'from-green-400 to-teal-500',
  "seoTitle" = 'Specialty Food — Organic, Vegan, Gluten-Free & Halal',
  "seoDescription" = 'Discover specialty food vendors: organic, keto, vegan, gluten-free, halal, kosher, sugar-free, and dairy-free options.'
WHERE "slug" = 'specialty-food';

-- PimpMyParty
UPDATE "Category" SET
  "icon" = 'ClipboardList', "image" = '/vendors/event-planner.png', "accent" = 'from-fuchsia-400 to-purple-500',
  "seoTitle" = 'Event Planners — Wedding & Party Planning Services',
  "seoDescription" = 'Find professional event planners for weddings, corporate events, birthdays, brand activations, and destination events.'
WHERE "slug" = 'event-planners';

UPDATE "Category" SET
  "icon" = 'Flower2', "image" = '/vendors/decorator.png', "accent" = 'from-purple-400 to-pink-500',
  "seoTitle" = 'Decorators — Balloon, Floral & Themed Event Decor',
  "seoDescription" = 'Book decorators for wedding decor, balloon art, floral arrangements, stage decor, table styling, and themed events.'
WHERE "slug" = 'decorators';

UPDATE "Category" SET
  "icon" = 'Camera', "image" = '/vendors/photographer.png', "accent" = 'from-pink-400 to-purple-500',
  "seoTitle" = 'Photographers — Wedding & Event Photography',
  "seoDescription" = 'Find wedding photographers, event photographers, drone photography, corporate photography, and pre-wedding shoot specialists.'
WHERE "slug" = 'photographers';

UPDATE "Category" SET
  "icon" = 'Video', "image" = '/vendors/photographer.png', "accent" = 'from-indigo-400 to-purple-500',
  "seoTitle" = 'Videographers — Wedding Films & Event Video',
  "seoDescription" = 'Book videographers for wedding films, event coverage, drone videography, promotional videos, and live streaming.'
WHERE "slug" = 'videographers';

UPDATE "Category" SET
  "icon" = 'Music', "image" = '/vendors/dj.png', "accent" = 'from-fuchsia-500 to-rose-500',
  "seoTitle" = 'DJs — Wedding & Party DJ Services',
  "seoDescription" = 'Find DJs for weddings, parties, and corporate events. Open-format, house, EDM, Bollywood, Latin, afrobeats, hip-hop, and techno.'
WHERE "slug" = 'djs';

UPDATE "Category" SET
  "icon" = 'Drama', "image" = '/vendors/entertainer.png', "accent" = 'from-violet-400 to-fuchsia-500',
  "seoTitle" = 'Entertainers — Magicians, Mascots & Live Performers',
  "seoDescription" = 'Book magicians, clowns, mascots, stilt walkers, fire performers, aerialists, live bands, and stand-up comedy for your event.'
WHERE "slug" = 'entertainers';

UPDATE "Category" SET
  "icon" = 'Building2', "image" = '/vendors/venue.png', "accent" = 'from-purple-500 to-indigo-500',
  "seoTitle" = 'Venues — Banquet Halls, Rooftops & Event Spaces',
  "seoDescription" = 'Find banquet halls, rooftops, gardens, beach venues, hotels, resorts, industrial lofts, and farmhouses for your event.'
WHERE "slug" = 'venues';

UPDATE "Category" SET
  "icon" = 'Flower2', "image" = '/vendors/decorator.png', "accent" = 'from-rose-400 to-pink-500',
  "seoTitle" = 'Florists — Wedding Flowers & Floral Design',
  "seoDescription" = 'Find florists for wedding flowers, bridal bouquets, centerpieces, floral installations, and event florals.'
WHERE "slug" = 'florists';

UPDATE "Category" SET
  "icon" = 'Package', "image" = '/vendors/venue.png', "accent" = 'from-slate-400 to-gray-500',
  "seoTitle" = 'Rental Services — Furniture, Stage & Equipment Rentals',
  "seoDescription" = 'Book rental services for tents, furniture, tableware, stage, lighting, power generators, and event equipment.'
WHERE "slug" = 'rental-services';

UPDATE "Category" SET
  "icon" = 'Sparkles', "image" = '/vendors/entertainer.png', "accent" = 'from-pink-500 to-rose-500',
  "seoTitle" = 'Makeup Artists — Bridal & Party Makeup Services',
  "seoDescription" = 'Find makeup artists for bridal makeup, party makeup, editorial makeup, HD makeup, and airbrush makeup.'
WHERE "slug" = 'makeup-artists';

UPDATE "Category" SET
  "icon" = 'Sparkles', "image" = '/vendors/entertainer.png', "accent" = 'from-rose-400 to-fuchsia-500',
  "seoTitle" = 'Beauty Services — Hair, Mehndi & Spa Services',
  "seoDescription" = 'Book beauty services for hair styling, mehndi/henna, spa and massage, nail art, and grooming.'
WHERE "slug" = 'beauty-services';

UPDATE "Category" SET
  "icon" = 'Car', "image" = '/vendors/venue.png', "accent" = 'from-blue-400 to-slate-500',
  "seoTitle" = 'Transportation — Wedding Cars & Luxury Transport',
  "seoDescription" = 'Find limousines, party buses, guest shuttles, vintage cars, and luxury sedans for your event.'
WHERE "slug" = 'transportation';

UPDATE "Category" SET
  "icon" = 'Mail', "image" = '/vendors/event-planner.png', "accent" = 'from-amber-400 to-yellow-500',
  "seoTitle" = 'Invitation & Printing — Custom Invitations & Cards',
  "seoDescription" = 'Find invitation designers and printing services for wedding invitations, birthday cards, corporate stationery, and digital invites.'
WHERE "slug" = 'invitation-printing';

UPDATE "Category" SET
  "icon" = 'PartyPopper', "image" = '/vendors/entertainer.png', "accent" = 'from-cyan-400 to-blue-500',
  "seoTitle" = 'Kids Party Services — Bounce Houses, Mascots & Games',
  "seoDescription" = 'Book kids party services: bounce houses, mascots and characters, games and activities, face painting, and themed decor.'
WHERE "slug" = 'kids-party-services';

UPDATE "Category" SET
  "icon" = 'Speaker', "image" = '/vendors/dj.png', "accent" = 'from-slate-500 to-zinc-600',
  "seoTitle" = 'Audio Visual & Lighting — Sound, Stage & AV Production',
  "seoDescription" = 'Find audio visual services: sound systems, stage lighting, LED walls, AV production, and live streaming setup.'
WHERE "slug" = 'audio-visual-services';

UPDATE "Category" SET
  "icon" = 'PartyPopper', "image" = '/vendors/decorator.png', "accent" = 'from-pink-400 to-rose-500',
  "seoTitle" = 'Party Supplies & Stores — Balloons, Decor & Accessories',
  "seoDescription" = 'Find party supplies: balloons and helium, cake toppers, party props, disposable tableware, banners, confetti, and goodie bags.'
WHERE "slug" = 'party-supplies';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: VERIFY
-- ═══════════════════════════════════════════════════════════════════════════

SELECT slug, label, icon, "seoTitle" IS NOT NULL as has_seo, "seoDescription" IS NOT NULL as has_seo_desc
FROM "Category"
ORDER BY ecosystem, "sortOrder";
