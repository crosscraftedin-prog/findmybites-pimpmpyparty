/**
 * Generates a single SQL file (schema + seed data) that can be pasted into
 * the Supabase SQL Editor. Run: bun run scripts/gen-sql.ts > supabase-setup.sql
 */
import { vendors } from "../prisma/seed-data";

function sqlEscape(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (Array.isArray(v)) return sqlEscape(JSON.stringify(v));
  return sqlEscape(String(v));
}

// vendor slugs (mirrors the seed logic)
function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

console.log("-- ============================================================");
console.log("-- FindMyBites × PimpMyParty — Supabase Setup (Schema + Seed)");
console.log("-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run");
console.log("-- ============================================================");
console.log("");

// --- Schema ---
console.log("-- 1. EXTENSIONS");
console.log("CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";");
console.log("");

console.log("-- 2. TABLES");
console.log(`CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);`);
console.log(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);

console.log(`CREATE TABLE IF NOT EXISTS "Vendor" (
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
);`);
console.log(`CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_slug_key" ON "Vendor"("slug");`);

console.log(`CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "eventDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);`);

console.log(`CREATE TABLE IF NOT EXISTS "Booking" (
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
);`);

// foreign keys — use DO $$ blocks because ADD CONSTRAINT IF NOT EXISTS is
// only supported on Postgres 16+; Supabase runs PG 15.
console.log(`DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
console.log(`DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
console.log(`DO $$ BEGIN
  ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userEmail_fkey"
    FOREIGN KEY ("userEmail") REFERENCES "User"("email") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

// indexes (basic + composite for scaling)
const indexes = [
  `CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_idx" ON "Vendor"("ecosystem");`,
  `CREATE INDEX IF NOT EXISTS "Vendor_category_idx" ON "Vendor"("category");`,
  `CREATE INDEX IF NOT EXISTS "Vendor_continent_idx" ON "Vendor"("continent");`,
  `CREATE INDEX IF NOT EXISTS "Vendor_featured_idx" ON "Vendor"("featured");`,
  `CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_category_idx" ON "Vendor"("ecosystem", "category");`,
  `CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_continent_idx" ON "Vendor"("ecosystem", "continent");`,
  `CREATE INDEX IF NOT EXISTS "Vendor_ecosystem_featured_idx" ON "Vendor"("ecosystem", "featured");`,
  `CREATE INDEX IF NOT EXISTS "Review_vendorId_idx" ON "Review"("vendorId");`,
  `CREATE INDEX IF NOT EXISTS "Booking_vendorId_idx" ON "Booking"("vendorId");`,
];
console.log("-- 3. INDEXES");
indexes.forEach((i) => console.log(i));
console.log("");

// full-text search: generated tsvector column + GIN index
console.log("-- 4. FULL-TEXT SEARCH (tsvector + GIN)");
console.log(`ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(tags, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(country, '')), 'D')
  ) STORED;`);
console.log(`CREATE INDEX IF NOT EXISTS "vendor_searchtsv_idx" ON "Vendor" USING GIN ("searchTsv");`);
console.log(`CREATE INDEX IF NOT EXISTS "vendor_name_trgm_idx" ON "Vendor" USING GIN (name gin_trgm_ops);`);
console.log(`CREATE INDEX IF NOT EXISTS "vendor_city_trgm_idx" ON "Vendor" USING GIN (city gin_trgm_ops);`);
console.log("");

// --- Seed data ---
console.log("-- 5. SEED DATA (24 vendors + 50 reviews)");
console.log("-- Clear existing data (safe to re-run)");
console.log(`DELETE FROM "Review"; DELETE FROM "Booking"; DELETE FROM "Vendor"; DELETE FROM "User";`);
console.log("");

// Generate vendor INSERTs
const vendorColumns = [
  "id", "name", "slug", "ecosystem", "category", "tagline", "description",
  "city", "country", "countryCode", "continent", "currency", "priceRange",
  "basePrice", "rating", "reviewCount", "heroImage", "avatarImage", "gallery",
  "tags", "featured", "verified", "responseTime", "yearsActive",
  "completedBookings", "subcategory", "state", "address", "zipCode",
  "instagram", "website", "whatsapp", "latitude", "longitude", "serviceRadiusKm"
];

console.log("-- Vendors");
vendors.forEach((v, i) => {
  const slug = slugify(`${v.name}-${v.city}`);
  const id = `vendor_${String(i + 1).padStart(3, "0")}`;
  const gallery = JSON.stringify([v.heroImage]);
  const tags = JSON.stringify(v.tags);
  const values = [
    sqlValue(id), sqlValue(v.name), sqlValue(slug), sqlValue(v.ecosystem),
    sqlValue(v.category), sqlValue(v.tagline), sqlValue(v.description),
    sqlValue(v.city), sqlValue(v.country), sqlValue(v.countryCode),
    sqlValue(v.continent), sqlValue(v.currency), sqlValue(v.priceRange),
    sqlValue(v.basePrice), sqlValue(v.rating), sqlValue(v.reviewCount),
    sqlValue(v.heroImage), sqlValue(v.heroImage), sqlValue(gallery),
    sqlValue(tags), sqlValue(v.featured), sqlValue(true),
    sqlValue(v.responseTime), sqlValue(v.yearsActive),
    sqlValue(v.completedBookings),
    sqlValue(v.subcategory ?? null), sqlValue(v.state ?? null),
    sqlValue(v.address ?? null), sqlValue(v.zipCode ?? null),
    sqlValue(v.instagram ?? null), sqlValue(v.website ?? null),
    sqlValue(v.whatsapp ?? null),
    sqlValue(v.latitude ?? null), sqlValue(v.longitude ?? null),
    sqlValue(v.serviceRadiusKm ?? null),
  ];
  console.log(`INSERT INTO "Vendor" (${vendorColumns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`);
});
console.log("");

// Generate review INSERTs
console.log("-- Reviews");
let reviewIdx = 0;
vendors.forEach((v, i) => {
  const vendorId = `vendor_${String(i + 1).padStart(3, "0")}`;
  v.reviews.forEach((r) => {
    reviewIdx++;
    const reviewId = `review_${String(reviewIdx).padStart(3, "0")}`;
    console.log(`INSERT INTO "Review" ("id", "vendorId", "author", "avatar", "rating", "comment", "eventDate", "createdAt") VALUES (${sqlValue(reviewId)}, ${sqlValue(vendorId)}, ${sqlValue(r.author)}, ${sqlValue(r.avatar)}, ${sqlValue(r.rating)}, ${sqlValue(r.comment)}, ${sqlValue(r.eventDate)}, NOW() - INTERVAL '${reviewIdx} hours');`);
  });
});
console.log("");

console.log("-- ✅ Done! Your Supabase database now has all tables + 24 vendors + 50 reviews.");
console.log("-- Next: add DATABASE_URL to Vercel env vars + redeploy.");
