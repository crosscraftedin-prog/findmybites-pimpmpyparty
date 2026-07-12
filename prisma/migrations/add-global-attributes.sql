-- ═══════════════════════════════════════════════════════════════════════════
-- Global Attribute System — Migration
-- ═══════════════════════════════════════════════════════════════════════════
-- Adds three new tables for a reusable, cross-category attribute engine:
--   attributes         — canonical attribute definitions (Sugar Free, Keto, etc.)
--   vendor_attributes  — M2M join: vendor ↔ attribute (vendor specialties)
--   product_attributes — M2M join: product ↔ attribute (product badges)
--
-- This migration is ADDITIVE — it does not modify or delete any existing
-- tables, columns, or data. The existing FilterGroup/FilterValue system and
-- Vendor.tags JSON column remain untouched for backward compatibility.
--
-- PostgresSQL target (production). All tables use TEXT primary keys (cuid).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── attributes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "attributes" (
  "id"          TEXT PRIMARY KEY,
  "slug"        TEXT UNIQUE NOT NULL,
  "name"        TEXT NOT NULL,
  "group"       TEXT NOT NULL,            -- dietary | service | product_feature | business
  "icon"        TEXT,                     -- lucide icon name or emoji
  "color"       TEXT,                     -- tailwind color token: emerald | amber | sky | ...
  "description" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "ecosystem"   TEXT NOT NULL DEFAULT 'BOTH',  -- FINDMYBITES | PIMPMYPARTY | BOTH
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup: list active attributes within a group, ordered
CREATE INDEX IF NOT EXISTS "attributes_group_active_sort_idx"
  ON "attributes" ("group", "active", "sortOrder");

-- Fast lookup: filter by ecosystem (FindMyBites vs PimpMyParty)
CREATE INDEX IF NOT EXISTS "attributes_ecosystem_active_idx"
  ON "attributes" ("ecosystem", "active");

-- ── vendor_attributes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "vendor_attributes" (
  "id"          TEXT PRIMARY KEY,
  "vendorId"    TEXT NOT NULL,            -- references vendor_listings.id (loose, no FK)
  "attributeId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("attributeId") REFERENCES "attributes" ("id") ON DELETE CASCADE,

  CONSTRAINT "vendor_attributes_vendorId_attributeId_key" UNIQUE ("vendorId", "attributeId")
);

CREATE INDEX IF NOT EXISTS "vendor_attributes_vendorId_idx"
  ON "vendor_attributes" ("vendorId");

-- Critical for filtering: "find all vendors with attribute X"
CREATE INDEX IF NOT EXISTS "vendor_attributes_attributeId_idx"
  ON "vendor_attributes" ("attributeId");

-- ── product_attributes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id"          TEXT PRIMARY KEY,
  "productId"   TEXT NOT NULL,            -- references "Product".id (loose, no FK)
  "attributeId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("attributeId") REFERENCES "attributes" ("id") ON DELETE CASCADE,

  CONSTRAINT "product_attributes_productId_attributeId_key" UNIQUE ("productId", "attributeId")
);

CREATE INDEX IF NOT EXISTS "product_attributes_productId_idx"
  ON "product_attributes" ("productId");

CREATE INDEX IF NOT EXISTS "product_attributes_attributeId_idx"
  ON "product_attributes" ("attributeId");

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries (run manually to confirm):
--   SELECT count(*) FROM "attributes";            -- should be > 0 after seed
--   SELECT count(*) FROM "vendor_attributes";     -- should be 0 (no migrations yet)
--   SELECT count(*) FROM "product_attributes";    -- should be 0
-- ═══════════════════════════════════════════════════════════════════════════
