-- ============================================================
-- FindMyBites × PimpMyParty — Supabase Setup (Schema + Seed)
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "heroImage" TEXT NOT NULL,
    "avatarImage" TEXT NOT NULL,
    "gallery" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "responseTime" TEXT NOT NULL,
    "yearsActive" INTEGER NOT NULL DEFAULT 1,
    "completedBookings" INTEGER NOT NULL DEFAULT 0,
    "subcategory" TEXT,
    "state" TEXT,
    "address" TEXT,
    "zipCode" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "whatsapp" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "serviceRadiusKm" INTEGER,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_slug_key" ON "Vendor"("slug");
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "eventDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "eventCity" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "budget" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userEmail_fkey"
    FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- 3. INDEXES
CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_idx" ON "Vendor"("ecosystem");
CREATE INDEX IF NOT EXISTS "Vendor_category_idx" ON "Vendor"("category");
CREATE INDEX IF NOT EXISTS "Vendor_continent_idx" ON "Vendor"("continent");
CREATE INDEX IF NOT EXISTS "Vendor_featured_idx" ON "Vendor"("featured");
CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_category_idx" ON "Vendor"("ecosystem", "category");
CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_continent_idx" ON "Vendor"("ecosystem", "continent");
CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_featured_idx" ON "Vendor"("ecosystem", "featured");
CREATE INDEX IF NOT EXISTS "Review_vendorId_idx" ON "Review"("vendorId");
CREATE INDEX IF NOT EXISTS "Booking_vendorId_idx" ON "Booking"("vendorId");

-- 4. FULL-TEXT SEARCH (tsvector + GIN)
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(tags, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(country, '')), 'D')
  ) STORED;
CREATE INDEX IF NOT EXISTS "vendor_searchtsv_idx" ON "Vendor" USING GIN ("searchTsv");
CREATE INDEX IF NOT EXISTS "vendor_name_trgm_idx" ON "Vendor" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "vendor_city_trgm_idx" ON "Vendor" USING GIN (city gin_trgm_ops);

-- 5. SEED DATA (24 vendors + 50 reviews)
-- Clear existing data (safe to re-run)
DELETE FROM "Review"; DELETE FROM "Booking"; DELETE FROM "Vendor"; DELETE FROM "User";

-- Vendors
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_001', 'Maison Levain', 'maison-levain-paris', 'FINDMYBITES', 'bakers', 'Parisian sourdough & viennoiserie, baked on stone hearths since 1998.', 'Maison Levain is a family-run artisan bakery in the heart of Paris crafting naturally leavened sourdough, croissants, and seasonal patisserie. We supply weddings, hotels, and corporate breakfasts across Île-de-France with bread baked fresh each morning.', 'Paris', 'France', 'FR', 'Europe', 'EUR', '$$', 45, 4.9, 128, '/vendors/baker.png', '/vendors/baker.png', '["/vendors/baker.png"]', '["sourdough","croissants","wedding bread","corporate","gluten-friendly"]', TRUE, TRUE, 'under 1 hour', 26, 640, 'Sourdough', 'Île-de-France', '18 Rue des Martyrs, 9th arrondissement', '75009', 'maisonlevain', 'https://maisonlevain.fr', '33142856390', 48.8566, 2.3522, 30);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_002', 'Brooklyn Sourdough Co.', 'brooklyn-sourdough-co-new-york', 'FINDMYBITES', 'bakers', 'New York''s cult bakery for country loaves and seeded bagels.', 'Born in a Williamsburg storefront, Brooklyn Sourdough Co. ferments each loaf for 36 hours for an open, custardy crumb. We cater film sets, brunches, and brand pop-ups across NYC and the Tri-State area.', 'New York', 'United States', 'US', 'North America', 'USD', '$$', 60, 4.8, 96, '/vendors/baker.png', '/vendors/baker.png', '["/vendors/baker.png"]', '["sourdough","bagels","film sets","pop-ups"]', FALSE, TRUE, 'under 2 hours', 9, 312, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 40.7128, -74.006, 25);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_003', 'Saffron & Sage Catering', 'saffron-sage-catering-london', 'FINDMYBITES', 'catering', 'Modern British catering with a spice-route twist.', 'Saffron & Sage is a London-based catering house blending seasonal British produce with global spice-route flavours. From intimate dinners to 500-guest galas, our team designs menus, staffing, and full service.', 'London', 'United Kingdom', 'GB', 'Europe', 'GBP', '$$$', 85, 4.9, 214, '/vendors/catering.png', '/vendors/catering.png', '["/vendors/catering.png"]', '["fine dining","galas","vegan","canapes","full service"]', TRUE, TRUE, 'under 1 hour', 14, 1180, 'Wedding Catering', 'England', 'The Roundhouse, Chalk Farm Road, Camden', 'NW1 8EH', 'saffronandsageuk', 'https://saffronandsage.co.uk', '447700900123', 51.5074, -0.1278, 40);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_004', 'Harambe Feast Co.', 'harambe-feast-co-nairobi', 'FINDMYBITES', 'catering', 'Pan-African feasts and nyama choma for celebrations across East Africa.', 'Harambe Feast Co. brings the soul of East African cooking to weddings, corporate events, and community gatherings. Smoky nyama choma, fragrant pilau, and vibrant kachumbari — cooked on-site for an unforgettable experience.', 'Nairobi', 'Kenya', 'KE', 'Africa', 'USD', '$$', 35, 4.8, 87, '/vendors/catering.png', '/vendors/catering.png', '["/vendors/catering.png"]', '["nyama choma","pilau","weddings","on-site grill","halal"]', FALSE, TRUE, 'under 3 hours', 7, 240, NULL, NULL, NULL, NULL, NULL, NULL, NULL, -1.2921, 36.8219, 50);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_005', 'Dolce Vita Sweets', 'dolce-vita-sweets-rome', 'FINDMYBITES', 'desserts', 'Roman pasticceria crafting tiramisu, cannoli, and dessert tables.', 'Three generations of Roman pastry-making in every bite. Dolce Vita Sweets designs dessert tables, sweet favors, and signature tiramisu towers for weddings and brand launches across Italy and Europe.', 'Rome', 'Italy', 'IT', 'Europe', 'EUR', '$$', 50, 4.7, 142, '/vendors/desserts.png', '/vendors/desserts.png', '["/vendors/desserts.png"]', '["tiramisu","cannoli","dessert table","weddings","gelato bar"]', TRUE, TRUE, 'under 2 hours', 22, 540, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 41.9028, 12.4964, 30);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_006', 'Matcha & Co.', 'matcha-co-tokyo', 'FINDMYBITES', 'desserts', 'Kyoto-style matcha sweets, mochi, and ceremonial dessert bars.', 'Matcha & Co. sources ceremonial-grade matcha direct from Uji farmers and crafts minimalist Japanese desserts — mochi, warabi mochi, and interactive matcha dessert bars for events across Asia.', 'Tokyo', 'Japan', 'JP', 'Asia', 'JPY', '$$$', 12000, 4.9, 76, '/vendors/desserts.png', '/vendors/desserts.png', '["/vendors/desserts.png"]', '["matcha","mochi","dessert bar","vegan","corporate"]', FALSE, TRUE, 'under 4 hours', 6, 180, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 35.6762, 139.6503, 35);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_007', 'Velvet Canvas Cakes', 'velvet-canvas-cakes-los-angeles', 'FINDMYBITES', 'cake-artists', 'Sculptural celebration cakes that look like art and taste like home.', 'Velvet Canvas Cakes is a LA studio pushing the boundaries of cake design — hand-painted florals, gravity-defying structures, and sugar architecture. Each cake is a one-of-a-kind commission.', 'Los Angeles', 'United States', 'US', 'North America', 'USD', '$$$$', 450, 5, 168, '/vendors/cake-artist.png', '/vendors/cake-artist.png', '["/vendors/cake-artist.png"]', '["sculptural","painted florals","weddings","celebrity","custom"]', TRUE, TRUE, 'under 6 hours', 11, 430, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 34.0522, -118.2437, 60);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_008', 'Sugar Atelier', 'sugar-atelier-singapore', 'FINDMYBITES', 'cake-artists', 'Singapore''s atelier for modern minimal cakes and sugar florals.', 'Sugar Atelier designs clean, modern cakes with exquisite sugar florals and contemporary finishes. We ship across Southeast Asia and design for luxury weddings and brand collaborations.', 'Singapore', 'Singapore', 'SG', 'Asia', 'SGD', '$$$$', 680, 4.9, 92, '/vendors/cake-artist.png', '/vendors/cake-artist.png', '["/vendors/cake-artist.png"]', '["minimal","sugar florals","luxury","brand collabs"]', FALSE, TRUE, 'under 8 hours', 8, 210, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1.3521, 103.8198, 40);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_009', 'El Tigre Tacos', 'el-tigre-tacos-mexico-city', 'FINDMYBITES', 'food-trucks', 'Mexico City street tacos, al pastor spit, and mezcal on wheels.', 'El Tigre Tacos rolls up with a real al pastor trompo, fresh tortillas, and a mezcel bar. We cater street-food weddings, festivals, and corporate parties across Mexico and the southern US.', 'Mexico City', 'Mexico', 'MX', 'North America', 'USD', '$', 12, 4.8, 203, '/vendors/food-truck.png', '/vendors/food-truck.png', '["/vendors/food-truck.png"]', '["tacos","al pastor","mezcal","festivals","street food"]', TRUE, TRUE, 'under 2 hours', 10, 760, 'Tacos & Mexican', 'Ciudad de México', 'Av. Álvaro Obregón 64, Roma Norte, Cuauhtémoc', '06700', 'eltigretacos', 'https://eltigretacos.mx', '525512345678', 19.4326, -99.1332, 45);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_010', 'Curry Express Truck', 'curry-express-truck-mumbai', 'FINDMYBITES', 'food-trucks', 'Mumbai chaat, biryani, and live dosa station on the move.', 'Curry Express Truck brings the energy of Mumbai street food to your event — live dosa stations, chaat counters, and dum biryani cooked in sealed pots. Perfect for weddings and corporate days.', 'Mumbai', 'India', 'IN', 'Asia', 'INR', '$', 4500, 4.7, 156, '/vendors/food-truck.png', '/vendors/food-truck.png', '["/vendors/food-truck.png"]', '["chaat","dosa","biryani","weddings","vegetarian"]', FALSE, TRUE, 'under 3 hours', 8, 420, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 19.076, 72.8777, 50);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_011', 'Chef Omar Private Kitchen', 'chef-omar-private-kitchen-dubai', 'FINDMYBITES', 'private-chefs', 'Modern Levantine fine dining in your villa or yacht.', 'Chef Omar brings a Michelin-trained background to private dining across the Gulf. Tasting menus reimagining Levantine cuisine, served in homes, villas, and yachts from Dubai to the Maldives.', 'Dubai', 'United Arab Emirates', 'AE', 'Middle East', 'AED', '$$$$', 1200, 5, 64, '/vendors/private-chef.png', '/vendors/private-chef.png', '["/vendors/private-chef.png"]', '["tasting menu","levantine","yacht","villa","halal"]', TRUE, TRUE, 'under 5 hours', 9, 150, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25.2048, 55.2708, 80);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_012', 'Outback Fire Kitchen', 'outback-fire-kitchen-sydney', 'FINDMYBITES', 'private-chefs', 'Fire-cooked native Australian menus under the southern stars.', 'Outback Fire Kitchen cooks over native hardwood coals, blending Indigenous Australian ingredients with modern technique. Private dining, bush banquets, and outdoor weddings across Australia.', 'Sydney', 'Australia', 'AU', 'Oceania', 'AUD', '$$$', 280, 4.8, 58, '/vendors/private-chef.png', '/vendors/private-chef.png', '["/vendors/private-chef.png"]', '["fire cooking","native ingredients","outdoor","weddings"]', FALSE, TRUE, 'under 6 hours', 5, 95, NULL, NULL, NULL, NULL, NULL, NULL, NULL, -33.8688, 151.2093, 55);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_013', 'Soirée Studio', 'soire-studio-milan', 'PIMPMYPARTY', 'event-planners', 'Milan-based planners for design-led weddings and brand activations.', 'Soirée Studio plans and produces design-forward weddings, product launches, and brand activations across Europe. Full-service planning, design, vendor curation, and on-the-day production.', 'Milan', 'Italy', 'IT', 'Europe', 'EUR', '$$$$', 9500, 4.9, 118, '/vendors/event-planner.png', '/vendors/event-planner.png', '["/vendors/event-planner.png"]', '["weddings","brand launches","design-led","full-service","destination"]', TRUE, TRUE, 'under 4 hours', 12, 320, 'Weddings', 'Lombardy', 'Via Tortona 27, Navigli district', '20144', 'soiree.studio', 'https://soireestudio.it', '393331234567', 45.4642, 9.19, 100);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_014', 'Blossom Events', 'blossom-events-toronto', 'PIMPMYPARTY', 'event-planners', 'Toronto planners for South Asian weddings and multicultural celebrations.', 'Blossom Events specializes in large-scale multicultural and South Asian weddings across North America — multi-day celebrations, baraat logistics, and seamless fusion events.', 'Toronto', 'Canada', 'CA', 'North America', 'CAD', '$$$', 8500, 4.8, 94, '/vendors/event-planner.png', '/vendors/event-planner.png', '["/vendors/event-planner.png"]', '["south asian","multi-day","baraat","fusion","weddings"]', FALSE, TRUE, 'under 3 hours', 9, 210, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 43.6532, -79.3832, 120);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_015', 'Balloon & Bloom', 'balloon-bloom-so-paulo', 'PIMPMYPARTY', 'decorators', 'Immersive balloon installations and floral walls in São Paulo.', 'Balloon & Bloom creates show-stopping organic balloon arches, floral walls, and full event styling. From baby showers to corporate galas, we transform any space with colour and scale.', 'São Paulo', 'Brazil', 'BR', 'South America', 'BRL', '$$', 1800, 4.9, 132, '/vendors/decorator.png', '/vendors/decorator.png', '["/vendors/decorator.png"]', '["balloons","floral walls","styling","baby shower","galas"]', TRUE, TRUE, 'under 2 hours', 7, 380, NULL, NULL, NULL, NULL, NULL, NULL, NULL, -23.5505, -46.6333, 60);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_016', 'Petals & Props Dubai', 'petals-props-dubai-dubai', 'PIMPMYPARTY', 'decorators', 'Luxury floral design and bespoke props for Gulf celebrations.', 'Petals & Props Dubai designs extravagant floral installations, ceiling florals, and custom props for weddings, royal celebrations, and brand events across the GCC.', 'Dubai', 'United Arab Emirates', 'AE', 'Middle East', 'AED', '$$$$', 25000, 4.9, 71, '/vendors/decorator.png', '/vendors/decorator.png', '["/vendors/decorator.png"]', '["luxury florals","ceiling installations","custom props","royal","weddings"]', TRUE, TRUE, 'under 5 hours', 10, 160, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25.2048, 55.2708, 150);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_017', 'Wonder Circus Co.', 'wonder-circus-co-berlin', 'PIMPMYPARTY', 'entertainers', 'Berlin''s roving circus acts, stilt walkers, and fire performers.', 'Wonder Circus Co. brings theatrical variety entertainment — aerialists, stilt walkers, fire performers, and living statues — to festivals, brand events, and private parties across Europe.', 'Berlin', 'Germany', 'DE', 'Europe', 'EUR', '$$', 600, 4.8, 89, '/vendors/entertainer.png', '/vendors/entertainer.png', '["/vendors/entertainer.png"]', '["aerialists","stilt walkers","fire","festivals","living statues"]', FALSE, TRUE, 'under 3 hours', 8, 260, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 52.52, 13.405, 70);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_018', 'Lagos Live Acts', 'lagos-live-acts-lagos', 'PIMPMYPARTY', 'entertainers', 'Afrobeats live bands, hype MCs, and cultural dance troupes.', 'Lagos Live Acts delivers high-energy Afrobeats bands, talking drummers, and cultural dance troupes for weddings, owambe parties, and corporate events across West Africa.', 'Lagos', 'Nigeria', 'NG', 'Africa', 'NGN', '$$', 850000, 4.9, 76, '/vendors/entertainer.png', '/vendors/entertainer.png', '["/vendors/entertainer.png"]', '["afrobeats","owambe","talking drum","dance troupes","weddings"]', TRUE, TRUE, 'under 4 hours', 6, 190, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6.5244, 3.3792, 60);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_019', 'Neon Pulse DJs', 'neon-pulse-djs-amsterdam', 'PIMPMYPARTY', 'djs', 'Amsterdam open-format DJs with custom light & visual shows.', 'Neon Pulse DJs are open-format specialists blending house, afro, latin, and classics. Full sound, lighting, and LED visual setups for clubs, weddings, and corporate events across Europe.', 'Amsterdam', 'Netherlands', 'NL', 'Europe', 'EUR', '$$$', 1400, 4.9, 112, '/vendors/dj.png', '/vendors/dj.png', '["/vendors/dj.png"]', '["open-format","LED visuals","weddings","clubs","corporate"]', TRUE, TRUE, 'under 2 hours', 9, 540, 'Open-Format', 'North Holland', 'Westerpark Studios, Haarlemmerweg 8', '1014 BE', 'neonpulsedjs', 'https://neonpulse.nl', '31612345678', 52.3676, 4.9041, 80);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_020', 'Bollywood Beats', 'bollywood-beats-delhi', 'PIMPMYPARTY', 'djs', 'Delhi''s Bollywood & Punjabi DJ crew for high-energy celebrations.', 'Bollywood Beats delivers the soundtrack to Indian celebrations — Bollywood classics, Punjabi bangers, and fusion sets with dhol players and live percussion for weddings and sangeets.', 'Delhi', 'India', 'IN', 'Asia', 'INR', '$$', 65000, 4.8, 98, '/vendors/dj.png', '/vendors/dj.png', '["/vendors/dj.png"]', '["bollywood","punjabi","dhol","sangeet","weddings"]', FALSE, TRUE, 'under 3 hours', 7, 310, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28.6139, 77.209, 70);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_021', 'Lumière Lens', 'lumire-lens-cape-town', 'PIMPMYPARTY', 'photographers', 'Cape Town wedding & editorial photography with cinematic film.', 'Lumière Lens captures weddings and brand stories with a cinematic eye — blending photo, Super 8 film, and drone across South Africa and destination weddings worldwide.', 'Cape Town', 'South Africa', 'ZA', 'Africa', 'ZAR', '$$$', 28000, 4.9, 84, '/vendors/photographer.png', '/vendors/photographer.png', '["/vendors/photographer.png"]', '["weddings","editorial","super 8 film","drone","destination"]', TRUE, TRUE, 'under 6 hours', 10, 220, 'Weddings', 'Western Cape', 'Studio 5, The Old Biscuit Mill, Woodstock', '7925', 'lumiere.lens', 'https://lumierelens.co.za', '27821234567', -33.9249, 18.4241, 100);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_022', 'Frame & Story', 'frame-story-melbourne', 'PIMPMYPARTY', 'photographers', 'Melbourne documentary wedding photography & Same-day edits.', 'Frame & Story shoots authentic, documentary-style weddings with a same-day-edit film option. Modern storytelling for couples who want real moments, not posed portraits.', 'Melbourne', 'Australia', 'AU', 'Oceania', 'AUD', '$$', 4200, 4.8, 67, '/vendors/photographer.png', '/vendors/photographer.png', '["/vendors/photographer.png"]', '["documentary","same-day edit","weddings","couples"]', FALSE, TRUE, 'under 5 hours', 6, 140, NULL, NULL, NULL, NULL, NULL, NULL, NULL, -37.8136, 144.9631, 80);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_023', 'Skyline Rooftop Hall', 'skyline-rooftop-hall-new-york', 'PIMPMYPARTY', 'venues', 'Manhattan rooftop venue with skyline views for 300 guests.', 'Skyline Rooftop Hall is a 6,000 sq ft open-air rooftop in Midtown Manhattan with panoramic skyline views, retractable glass, and in-house production. Ideal for weddings, galas, and launches.', 'New York', 'United States', 'US', 'North America', 'USD', '$$$$', 18000, 4.8, 145, '/vendors/venue.png', '/vendors/venue.png', '["/vendors/venue.png"]', '["rooftop","skyline","galas","weddings","in-house production"]', TRUE, TRUE, 'under 4 hours', 8, 410, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 40.7549, -73.984, 0);
INSERT INTO "Vendor" ("id", "name", "slug", "ecosystem", "category", "tagline", "description", "city", "country", "countryCode", "continent", "currency", "priceRange", "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery", "tags", "featured", "verified", "responseTime", "yearsActive", "completedBookings", "subcategory", "state", "address", "zipCode", "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm") VALUES ('vendor_024', 'Mediterranean Cliffs Venue', 'mediterranean-cliffs-venue-lisbon', 'PIMPMYPARTY', 'venues', 'Lisbon clifftop venue with ocean terraces for destination weddings.', 'Mediterranean Cliffs Venue is a restored clifftop estate outside Lisbon with cascading ocean terraces, an olive grove ceremony space, and a 200-guest banquet hall for destination weddings.', 'Lisbon', 'Portugal', 'PT', 'Europe', 'EUR', '$$$', 14000, 4.9, 88, '/vendors/venue.png', '/vendors/venue.png', '["/vendors/venue.png"]', '["clifftop","destination","ocean view","olive grove","weddings"]', FALSE, TRUE, 'under 6 hours', 11, 230, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 38.7223, -9.1393, 0);

-- Reviews
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_001', 'vendor_001', 'Camille R.', 'CR', 5, 'The sourdough for our wedding was unreal. Guests are still talking about the bread table.', '2024-06-15', NOW() - INTERVAL '1 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_002', 'vendor_001', 'Olivier P.', 'OP', 5, 'Corporate breakfast for 80 — punctual, warm, delicious croissants. Will rebook.', '2024-09-02', NOW() - INTERVAL '2 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_003', 'vendor_001', 'Sophie M.', 'SM', 4, 'Lovely bread, slightly late delivery but worth the wait.', '2024-03-21', NOW() - INTERVAL '3 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_004', 'vendor_002', 'Dana K.', 'DK', 5, 'Catered our film crew for a week. The seeded bagels disappeared by 9am every day.', '2024-07-10', NOW() - INTERVAL '4 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_005', 'vendor_002', 'Marcus T.', 'MT', 4, 'Great bread, the crumb is everything. Wish they offered more pastry variety.', '2024-05-18', NOW() - INTERVAL '5 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_006', 'vendor_003', 'Eleanor W.', 'EW', 5, 'Catered our charity gala for 400. Flawless service and the lamb was perfect.', '2024-10-05', NOW() - INTERVAL '6 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_007', 'vendor_003', 'James B.', 'JB', 5, 'Vegan menu was a revelation. Even the meat-eaters wanted seconds.', '2024-08-22', NOW() - INTERVAL '7 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_008', 'vendor_003', 'Priya S.', 'PS', 4, 'Beautiful food, premium pricing but you get what you pay for.', '2024-04-11', NOW() - INTERVAL '8 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_009', 'vendor_004', 'Wanjiru N.', 'WN', 5, 'Our wedding feast was legendary. The team cooked live and guests loved it.', '2024-06-29', NOW() - INTERVAL '9 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_010', 'vendor_004', 'David O.', 'DO', 5, 'Corporate event for 200. Generous portions, incredible flavour.', '2024-02-14', NOW() - INTERVAL '10 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_011', 'vendor_005', 'Giulia F.', 'GF', 5, 'The tiramisu tower was a centerpiece. Nonna approved!', '2024-09-14', NOW() - INTERVAL '11 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_012', 'vendor_005', 'Marco D.', 'MD', 4, 'Cannoli were crisp and creamy. Delivery ran a touch late.', '2024-01-30', NOW() - INTERVAL '12 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_013', 'vendor_006', 'Yuki T.', 'YT', 5, 'The matcha bar at our product launch was a hit. Beautiful and delicious.', '2024-07-25', NOW() - INTERVAL '13 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_014', 'vendor_006', 'Haruka N.', 'HN', 5, 'Mochi so soft it melts. Will book again for our wedding.', '2024-05-03', NOW() - INTERVAL '14 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_015', 'vendor_007', 'Alicia G.', 'AG', 5, 'Our wedding cake was a sculptural masterpiece. People gasped when it came out.', '2024-10-12', NOW() - INTERVAL '15 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_016', 'vendor_007', 'Vanessa R.', 'VR', 5, 'Worth every penny. The hand-painted flowers were unreal.', '2024-03-08', NOW() - INTERVAL '16 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_017', 'vendor_008', 'Mei Ling C.', 'MC', 5, 'Elegant, modern, and the sugar peonies were indistinguishable from real ones.', '2024-08-19', NOW() - INTERVAL '17 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_018', 'vendor_008', 'Aaron L.', 'AL', 4, 'Stunning design. Lead time is long so book early.', '2024-02-02', NOW() - INTERVAL '18 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_019', 'vendor_009', 'Carlos M.', 'CM', 5, 'The al pastor trompo at our wedding was the highlight. Line was 50 deep.', '2024-09-28', NOW() - INTERVAL '19 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_020', 'vendor_009', 'Bianca V.', 'BV', 5, 'Best tacos outside a taquería. Mezcal pairing was a nice touch.', '2024-04-20', NOW() - INTERVAL '20 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_021', 'vendor_010', 'Rohan P.', 'RP', 5, 'Live dosa station stole the show at our sangeet. Crowd loved it.', '2024-11-02', NOW() - INTERVAL '21 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_022', 'vendor_010', 'Anjali K.', 'AK', 4, 'Flavours of Mumbai in the heart of the city. Generous portions.', '2024-06-08', NOW() - INTERVAL '22 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_023', 'vendor_011', 'Layla A.', 'LA', 5, 'A 9-course tasting menu on our yacht. Best meal of our lives.', '2024-08-30', NOW() - INTERVAL '23 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_024', 'vendor_011', 'Faisal M.', 'FM', 5, 'Chef Omar reimagined dishes from my childhood. Deeply moving and delicious.', '2024-05-17', NOW() - INTERVAL '24 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_025', 'vendor_012', 'Chloe H.', 'CH', 5, 'Bush banquet under the stars was magical. The kangaroo was cooked perfectly.', '2024-10-01', NOW() - INTERVAL '25 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_026', 'vendor_012', 'Tom W.', 'TW', 4, 'Unique flavours and a great story behind each dish.', '2024-03-25', NOW() - INTERVAL '26 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_027', 'vendor_013', 'Francesca B.', 'FB', 5, 'They planned our Lake Como wedding flawlessly. Every detail was intentional.', '2024-07-20', NOW() - INTERVAL '27 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_028', 'vendor_013', 'Luca R.', 'LR', 5, 'Brand launch for 600 guests. On brief, on budget, on time.', '2024-09-09', NOW() - INTERVAL '28 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_029', 'vendor_014', 'Simran D.', 'SD', 5, '3-day wedding, zero stress. They handled the baraat like pros.', '2024-08-11', NOW() - INTERVAL '29 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_030', 'vendor_014', 'Arjun P.', 'AP', 4, 'Great coordination across multiple venues. Highly recommend.', '2024-05-25', NOW() - INTERVAL '30 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_031', 'vendor_015', 'Beatriz S.', 'BS', 5, 'Our baby shower balloon arch was a dream. Photos went viral.', '2024-06-30', NOW() - INTERVAL '31 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_032', 'vendor_015', 'Rafael C.', 'RC', 5, 'Corporate gala styling was world-class. Huge impact.', '2024-10-18', NOW() - INTERVAL '32 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_033', 'vendor_016', 'Noor A.', 'NA', 5, 'The ceiling floral installation took our breath away. Pure luxury.', '2024-09-21', NOW() - INTERVAL '33 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_034', 'vendor_016', 'Khalid R.', 'KR', 5, 'Custom props were built to perfection. Professional team.', '2024-04-14', NOW() - INTERVAL '34 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_035', 'vendor_017', 'Hannah W.', 'HW', 5, 'Fire performers at our festival were jaw-dropping. Crowd went wild.', '2024-07-13', NOW() - INTERVAL '35 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_036', 'vendor_017', 'Felix S.', 'FS', 4, 'Stilt walkers were a hit with the kids. Great energy.', '2024-05-04', NOW() - INTERVAL '36 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_037', 'vendor_018', 'Chioma E.', 'CE', 5, 'Our owambe was the party of the year. The band kept everyone dancing till dawn.', '2024-08-17', NOW() - INTERVAL '37 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_038', 'vendor_018', 'Tunde A.', 'TA', 5, 'Talking drummers brought the tradition alive. Incredible.', '2024-03-29', NOW() - INTERVAL '38 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_039', 'vendor_019', 'Sofie J.', 'SJ', 5, 'Our wedding dance floor never emptied. The LED wall was stunning.', '2024-09-07', NOW() - INTERVAL '39 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_040', 'vendor_019', 'Daan V.', 'DV', 5, 'Corporate party for 800. Read the crowd perfectly all night.', '2024-12-20', NOW() - INTERVAL '40 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_041', 'vendor_020', 'Neha G.', 'NG', 5, 'Sangeet night was electric. Dhol player took it to another level.', '2024-11-09', NOW() - INTERVAL '41 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_042', 'vendor_020', 'Rahul V.', 'RV', 4, 'Great mixes, kept the floor packed. Would book again.', '2024-02-26', NOW() - INTERVAL '42 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_043', 'vendor_021', 'Thandi M.', 'TM', 5, 'Our Winelands wedding photos are cinematic masterpieces. Super 8 film is pure magic.', '2024-04-06', NOW() - INTERVAL '43 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_044', 'vendor_021', 'Johan B.', 'JB', 5, 'Drone shots of the venue were breathtaking. True artist.', '2024-10-26', NOW() - INTERVAL '44 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_045', 'vendor_022', 'Olivia F.', 'OF', 5, 'Same-day edit at our reception made everyone cry. Real moments captured.', '2024-03-16', NOW() - INTERVAL '45 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_046', 'vendor_022', 'Liam K.', 'LK', 4, 'Documentary style suited us perfectly. Unobtrusive and warm.', '2024-07-01', NOW() - INTERVAL '46 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_047', 'vendor_023', 'Grace L.', 'GL', 5, 'Sunset over the skyline during our vows. Unforgettable venue.', '2024-09-15', NOW() - INTERVAL '47 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_048', 'vendor_023', 'Daniel W.', 'DW', 4, 'Stunning space, premium pricing. Production team is top-notch.', '2024-05-22', NOW() - INTERVAL '48 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_049', 'vendor_024', 'Isabela C.', 'IC', 5, 'Getting married among the olive trees with the ocean below was surreal.', '2024-06-12', NOW() - INTERVAL '49 hours');
INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES ('review_050', 'vendor_024', 'Pedro M.', 'PM', 5, 'Venue of dreams. The team made our destination wedding effortless.', '2024-08-03', NOW() - INTERVAL '50 hours');

-- ✅ Done! Your Supabase database now has all tables + 24 vendors + 50 reviews.
-- Next: add DATABASE_URL to Vercel env vars + redeploy.
-- ============================================================
-- FindMyBites × PimpMyParty — Phase 2-5 Migration (Non-Destructive)
-- ============================================================
-- This migration adds ALL missing tables and columns for:
--   - Template Engine (listing_templates, template_fields, template_mappings, etc.)
--   - Universal Filter Engine (filter_groups, filter_values, etc.)
--   - Vendor Analytics (vendor_analytics)
--   - Customer Follow + Wishlist (vendor_follows, customer_wishlist)
--   - Phase 4: Smart Enquiry (quotes, concierge_events, enhanced Booking)
--   - Phase 5: Messaging + Notifications + Availability + Enhanced Reviews
--
-- SAFE TO RUN MULTIPLE TIMES — all statements use IF NOT EXISTS.
-- Does NOT drop or recreate existing tables.
-- Does NOT modify existing data.
-- ============================================================

-- ── 1. EXTENSIONS ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── 2. NEW TABLES (Template Engine) ─────────────────────────────────────────

-- ListingTemplate
CREATE TABLE IF NOT EXISTS "listing_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ecosystem" TEXT NOT NULL DEFAULT 'BOTH',
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sections" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentTemplateId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "wizard" TEXT NOT NULL DEFAULT '[]',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiConfig" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "listing_templates_slug_key" ON "listing_templates"("slug");

-- TemplateVersionSnapshot
CREATE TABLE IF NOT EXISTS "template_version_snapshots" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL DEFAULT '{}',
    "createdBy" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_version_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "template_version_snapshots_templateId_version_key" UNIQUE ("templateId", "version")
);
CREATE INDEX IF NOT EXISTS "template_version_snapshots_templateId_idx" ON "template_version_snapshots"("templateId");

-- TemplateField
CREATE TABLE IF NOT EXISTS "template_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "section" TEXT NOT NULL DEFAULT 'Basic Information',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "placeholder" TEXT,
    "helpText" TEXT,
    "unit" TEXT,
    "span" INTEGER NOT NULL DEFAULT 1,
    "filterGroupName" TEXT,
    "staticOptions" TEXT,
    "condition" TEXT,
    "subFields" TEXT,
    "toggleOptions" TEXT,
    "maxImages" INTEGER,
    "maxFileSize" INTEGER,
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "step" DOUBLE PRECISION,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "pattern" TEXT,
    "patternHint" TEXT,
    "repeatable" BOOLEAN NOT NULL DEFAULT false,
    "minRepeats" INTEGER,
    "maxRepeats" INTEGER,
    "repeatLabel" TEXT,
    "repeatFields" TEXT,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "seoIndexed" BOOLEAN NOT NULL DEFAULT false,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "globalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "template_fields_templateId_idx" ON "template_fields"("templateId");
CREATE INDEX IF NOT EXISTS "template_fields_section_idx" ON "template_fields"("section");
CREATE INDEX IF NOT EXISTS "template_fields_searchable_idx" ON "template_fields"("searchable");
CREATE INDEX IF NOT EXISTS "template_fields_seoIndexed_idx" ON "template_fields"("seoIndexed");
CREATE INDEX IF NOT EXISTS "template_fields_templateId_section_sortOrder_idx" ON "template_fields"("templateId", "section", "sortOrder");

-- TemplateMapping
CREATE TABLE IF NOT EXISTS "template_mappings" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_mappings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "template_mappings_categoryId_subcategory_key" UNIQUE ("categoryId", "subcategory")
);
CREATE INDEX IF NOT EXISTS "template_mappings_categoryId_idx" ON "template_mappings"("categoryId");
CREATE INDEX IF NOT EXISTS "template_mappings_templateId_idx" ON "template_mappings"("templateId");

-- TemplateAuditLog
CREATE TABLE IF NOT EXISTS "template_audit_logs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL DEFAULT 'template',
    "entityId" TEXT,
    "fieldName" TEXT,
    "changeSummary" TEXT,
    "changeData" TEXT NOT NULL DEFAULT '{}',
    "adminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "template_audit_logs_templateId_idx" ON "template_audit_logs"("templateId");
CREATE INDEX IF NOT EXISTS "template_audit_logs_action_idx" ON "template_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "template_audit_logs_createdAt_idx" ON "template_audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "template_audit_logs_templateId_createdAt_idx" ON "template_audit_logs"("templateId", "createdAt");

-- ── 3. NEW TABLES (Universal Filter Engine) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "filter_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'multi',
    "unit" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filter_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "filter_groups_name_key" ON "filter_groups"("name");

CREATE TABLE IF NOT EXISTS "filter_values" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filter_values_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "filter_values_groupId_value_key" UNIQUE ("groupId", "value")
);
CREATE INDEX IF NOT EXISTS "filter_values_groupId_idx" ON "filter_values"("groupId");

CREATE TABLE IF NOT EXISTS "category_filters" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "filterGroupId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_filters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "category_filters_categoryId_filterGroupId_key" UNIQUE ("categoryId", "filterGroupId")
);
CREATE INDEX IF NOT EXISTS "category_filters_categoryId_idx" ON "category_filters"("categoryId");

CREATE TABLE IF NOT EXISTS "vendor_filter_values" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "filterValueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_filter_values_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_filter_values_vendorId_filterValueId_key" UNIQUE ("vendorId", "filterValueId")
);
CREATE INDEX IF NOT EXISTS "vendor_filter_values_vendorId_idx" ON "vendor_filter_values"("vendorId");

-- ── 4. NEW TABLES (Categories + Subcategories + Pricing + Josh AI) ──────────

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ecosystem" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "accent" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

CREATE TABLE IF NOT EXISTS "Subcategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isPending" BOOLEAN NOT NULL DEFAULT false,
    "addedByVendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_slug_key" ON "Subcategory"("slug");
CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

CREATE TABLE IF NOT EXISTS "pricing" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryLabel" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "proMonthly" INTEGER NOT NULL,
    "proYearlyTotal" INTEGER NOT NULL,
    "businessMonthly" INTEGER NOT NULL,
    "businessYearlyTotal" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_countryCode_key" ON "pricing"("countryCode");

CREATE TABLE IF NOT EXISTS "josh_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'customer',
    "vendorId" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "conversationSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "josh_conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "josh_conversations_userId_idx" ON "josh_conversations"("userId");
CREATE INDEX IF NOT EXISTS "josh_conversations_vendorId_idx" ON "josh_conversations"("vendorId");

-- ── 5. NEW TABLES (Analytics + Follow + Wishlist) ───────────────────────────

CREATE TABLE IF NOT EXISTS "vendor_analytics" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "visitorHash" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_analytics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "vendor_analytics_vendorId_idx" ON "vendor_analytics"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_analytics_eventType_idx" ON "vendor_analytics"("eventType");
CREATE INDEX IF NOT EXISTS "vendor_analytics_createdAt_idx" ON "vendor_analytics"("createdAt");
CREATE INDEX IF NOT EXISTS "vendor_analytics_vendorId_eventType_createdAt_idx" ON "vendor_analytics"("vendorId", "eventType", "createdAt");

CREATE TABLE IF NOT EXISTS "vendor_follows" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_follows_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_follows_vendorId_userId_key" UNIQUE ("vendorId", "userId")
);
CREATE INDEX IF NOT EXISTS "vendor_follows_vendorId_idx" ON "vendor_follows"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_follows_userId_idx" ON "vendor_follows"("userId");

CREATE TABLE IF NOT EXISTS "customer_wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_wishlist_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_wishlist_userId_entityType_entityId_key" UNIQUE ("userId", "entityType", "entityId")
);
CREATE INDEX IF NOT EXISTS "customer_wishlist_userId_idx" ON "customer_wishlist"("userId");
CREATE INDEX IF NOT EXISTS "customer_wishlist_entityType_idx" ON "customer_wishlist"("entityType");
CREATE INDEX IF NOT EXISTS "customer_wishlist_vendorId_idx" ON "customer_wishlist"("vendorId");

-- ── 6. NEW TABLES (Phase 4: Quotes + Concierge) ─────────────────────────────

CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "lineItems" TEXT NOT NULL DEFAULT '[]',
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "depositType" TEXT NOT NULL DEFAULT 'percentage',
    "depositValue" INTEGER NOT NULL DEFAULT 50,
    "aiNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customerResponse" TEXT,
    "customerNotes" TEXT,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "depositPaidAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "quotes_bookingId_idx" ON "quotes"("bookingId");
CREATE INDEX IF NOT EXISTS "quotes_vendorId_idx" ON "quotes"("vendorId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");

CREATE TABLE IF NOT EXISTS "concierge_events" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "eventType" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "eventCity" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "budget" TEXT NOT NULL,
    "notes" TEXT,
    "eventManager" TEXT,
    "assignedVendors" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'new',
    "managementFeeType" TEXT NOT NULL DEFAULT 'percentage',
    "managementFeeValue" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concierge_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "concierge_events_status_idx" ON "concierge_events"("status");
CREATE INDEX IF NOT EXISTS "concierge_events_eventManager_idx" ON "concierge_events"("eventManager");
CREATE INDEX IF NOT EXISTS "concierge_events_createdAt_idx" ON "concierge_events"("createdAt");

-- ── 7. NEW TABLES (Phase 5: Messaging + Notifications + Availability) ───────

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "participant1Type" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Type" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "vendorId" TEXT,
    "productId" TEXT,
    "bookingId" TEXT,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount1" INTEGER NOT NULL DEFAULT 0,
    "unreadCount2" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversations_participant1Type_participant1Id_participant2Type_participant2Id_key" UNIQUE ("participant1Type", "participant1Id", "participant2Type", "participant2Id")
);
CREATE INDEX IF NOT EXISTS "conversations_participant1Type_participant1Id_idx" ON "conversations"("participant1Type", "participant1Id");
CREATE INDEX IF NOT EXISTS "conversations_participant2Type_participant2Id_idx" ON "conversations"("participant2Type", "participant2Id");
CREATE INDEX IF NOT EXISTS "conversations_vendorId_idx" ON "conversations"("vendorId");
CREATE INDEX IF NOT EXISTS "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderAvatar" TEXT,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "quoteId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX IF NOT EXISTS "messages_senderType_senderId_idx" ON "messages"("senderType", "senderId");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "vendorId" TEXT,
    "productId" TEXT,
    "bookingId" TEXT,
    "quoteId" TEXT,
    "conversationId" TEXT,
    "actionUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "notifications_recipientType_recipientId_read_idx" ON "notifications"("recipientType", "recipientId", "read");
CREATE INDEX IF NOT EXISTS "notifications_recipientType_recipientId_createdAt_idx" ON "notifications"("recipientType", "recipientId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

CREATE TABLE IF NOT EXISTS "vendor_availability" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "timeSlots" TEXT,
    "note" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_availability_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vendor_availability_vendorId_date_key" UNIQUE ("vendorId", "date")
);
CREATE INDEX IF NOT EXISTS "vendor_availability_vendorId_date_idx" ON "vendor_availability"("vendorId", "date");
CREATE INDEX IF NOT EXISTS "vendor_availability_status_idx" ON "vendor_availability"("status");

CREATE TABLE IF NOT EXISTS "review_votes" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_votes_reviewId_userId_key" UNIQUE ("reviewId", "userId")
);
CREATE INDEX IF NOT EXISTS "review_votes_reviewId_idx" ON "review_votes"("reviewId");

-- ── 8. ALTER EXISTING TABLES (Add missing columns — non-destructive) ─────────

-- Booking: Phase 4 columns
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "eventTime" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "referenceImage" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "leadScore" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "aiQualification" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "conciergeEventId" TEXT;
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Booking_email_idx" ON "Booking"("email");
CREATE INDEX IF NOT EXISTS "Booking_conciergeEventId_idx" ON "Booking"("conciergeEventId");

-- Review: Phase 5 columns
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerEmail" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "photos" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorReply" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorRepliedAt" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "productId" TEXT;
CREATE INDEX IF NOT EXISTS "reviews_reviewerEmail_idx" ON "reviews"("reviewerEmail");
CREATE INDEX IF NOT EXISTS "reviews_verified_idx" ON "reviews"("verified");

-- Product: Phase 2.5 + Template Engine columns
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badge" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateSlug" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateVersion" INTEGER;
CREATE INDEX IF NOT EXISTS "Product_templateSlug_idx" ON "Product"("templateSlug");

-- vendor_listings: Phase 2.5 columns
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "snapchat" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "fssaiNumber" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "settingsLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "ownership_status" TEXT DEFAULT 'unclaimed';

-- Template Engine inheritance self-reference FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'listing_templates_parentTemplateId_fkey'
    AND table_name = 'listing_templates'
  ) THEN
    ALTER TABLE "listing_templates"
    ADD CONSTRAINT "listing_templates_parentTemplateId_fkey"
    FOREIGN KEY ("parentTemplateId") REFERENCES "listing_templates"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Template FK constraints (added separately to avoid ordering issues)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'template_version_snapshots_templateId_fkey'
    AND table_name = 'template_version_snapshots'
  ) THEN
    ALTER TABLE "template_version_snapshots"
    ADD CONSTRAINT "template_version_snapshots_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'template_fields_templateId_fkey'
    AND table_name = 'template_fields'
  ) THEN
    ALTER TABLE "template_fields"
    ADD CONSTRAINT "template_fields_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'template_mappings_templateId_fkey'
    AND table_name = 'template_mappings'
  ) THEN
    ALTER TABLE "template_mappings"
    ADD CONSTRAINT "template_mappings_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'template_audit_logs_templateId_fkey'
    AND table_name = 'template_audit_logs'
  ) THEN
    ALTER TABLE "template_audit_logs"
    ADD CONSTRAINT "template_audit_logs_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  -- Filter Engine FKs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'filter_values_groupId_fkey'
    AND table_name = 'filter_values'
  ) THEN
    ALTER TABLE "filter_values"
    ADD CONSTRAINT "filter_values_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'category_filters_filterGroupId_fkey'
    AND table_name = 'category_filters'
  ) THEN
    ALTER TABLE "category_filters"
    ADD CONSTRAINT "category_filters_filterGroupId_fkey"
    FOREIGN KEY ("filterGroupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendor_filter_values_filterValueId_fkey'
    AND table_name = 'vendor_filter_values'
  ) THEN
    ALTER TABLE "vendor_filter_values"
    ADD CONSTRAINT "vendor_filter_values_filterValueId_fkey"
    FOREIGN KEY ("filterValueId") REFERENCES "filter_values"("id") ON DELETE CASCADE;
  END IF;

  -- Availability FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendor_availability_vendorId_fkey'
    AND table_name = 'vendor_availability'
  ) THEN
    ALTER TABLE "vendor_availability"
    ADD CONSTRAINT "vendor_availability_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;

  -- Review votes FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_votes_reviewId_fkey'
    AND table_name = 'review_votes'
  ) THEN
    ALTER TABLE "review_votes"
    ADD CONSTRAINT "review_votes_reviewId_fkey"
    FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE;
  END IF;

  -- Messages FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_conversationId_fkey'
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE "messages"
    ADD CONSTRAINT "messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;
  END IF;

  -- Quotes FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quotes_bookingId_fkey'
    AND table_name = 'quotes'
  ) THEN
    ALTER TABLE "quotes"
    ADD CONSTRAINT "quotes_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ── 9. VERIFICATION ─────────────────────────────────────────────────────────
-- After running this migration, verify all 5 Template Engine tables exist:
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN (
--   'listing_templates', 'template_fields', 'template_mappings',
--   'template_version_snapshots', 'template_audit_logs'
-- ) ORDER BY table_name;
--
-- Expected: 5 rows returned
--
-- To verify ALL new tables (23 total):
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN (
--   'listing_templates', 'template_fields', 'template_mappings',
--   'template_version_snapshots', 'template_audit_logs',
--   'filter_groups', 'filter_values', 'category_filters', 'vendor_filter_values',
--   'vendor_analytics', 'vendor_follows', 'customer_wishlist',
--   'quotes', 'concierge_events', 'conversations', 'messages',
--   'notifications', 'vendor_availability', 'review_votes',
--   'pricing', 'josh_conversations', 'Category', 'Subcategory'
-- ) ORDER BY table_name;
--
-- Expected: 23 rows returned

-- ── END OF MIGRATION ────────────────────────────────────────────────────────
