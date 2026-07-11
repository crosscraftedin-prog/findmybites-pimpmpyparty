-- ═══════════════════════════════════════════════════════════════════════════
-- Global Attribute System — Tag Migration
-- ═══════════════════════════════════════════════════════════════════════════
-- Migrates existing data into the Global Attribute System:
--   1. Vendor.tags (JSON array of free-text strings) → vendor_attributes
--   2. Product dietary booleans (eggless/vegan/halal/glutenFree/sugarFree/vegetarian)
--      → product_attributes
--
-- NON-DESTRUCTIVE: Vendor.tags column is NOT modified. Non-matching tags
-- remain in Vendor.tags for backward compatibility.
--
-- IDEMPOTENT: uses ON CONFLICT to skip existing rows. Safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════════════════

-- Build a lookup CTE: normalized tag text → attribute id
WITH attr_lookup AS (
  SELECT id, slug, name FROM "attributes"
),

-- Expand Vendor.tags JSON array into one row per tag, normalize, match to attributes
vendor_tag_expansions AS (
  SELECT
    v.id AS "vendorId",
    LOWER(
      REGEXP_REPLACE(
        TRIM(tag_value::text),
        '[^a-z0-9 -]', '', 'g'
      )
    ) AS normalized_tag
  FROM vendor_listings v,
       jsonb_array_elements_text(v.tags::jsonb) AS tag_value
  WHERE v.tags IS NOT NULL
    AND v.tags != '[]'
    AND v.tags != 'null'
),
vendor_tag_matched AS (
  SELECT DISTINCT
    te."vendorId",
    a.id AS "attributeId"
  FROM vendor_tag_expansions te
  JOIN attr_lookup a ON
    -- normalize the tag the same way the app does: spaces → hyphens
    REPLACE(REPLACE(te.normalized_tag, ' ', '-'), '  ', '-') = a.slug
    OR te.normalized_tag = REPLACE(a.slug, '-', ' ')
)
-- Insert matched vendor attributes (skip existing)
INSERT INTO "vendor_attributes" ("id", "vendorId", "attributeId", "createdAt")
SELECT
  'va-' || v."vendorId" || '-' || v."attributeId" || '-' || md5(v."vendorId" || v."attributeId")::substr(1,8),
  v."vendorId",
  v."attributeId",
  NOW()
FROM vendor_tag_matched v
ON CONFLICT ("vendorId", "attributeId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Migrate Product dietary booleans → product_attributes
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO "product_attributes" ("id", "productId", "attributeId", "createdAt")
SELECT
  'pa-' || p."productId" || '-' || p."attributeId" || '-' || md5(p."productId" || p."attributeId")::substr(1,8),
  p."productId",
  p."attributeId",
  NOW()
FROM (
  SELECT "id" AS "productId", (SELECT id FROM "attributes" WHERE slug = 'eggless') AS "attributeId"
  FROM "Product" WHERE "eggless" = true
  UNION ALL
  SELECT "id" AS "productId", (SELECT id FROM "attributes" WHERE slug = 'vegan') AS "attributeId"
  FROM "Product" WHERE "vegan" = true
  UNION ALL
  SELECT "id" AS "productId", (SELECT id FROM "attributes" WHERE slug = 'halal') AS "attributeId"
  FROM "Product" WHERE "halal" = true
  UNION ALL
  SELECT "id" AS "productId", (SELECT id FROM "attributes" WHERE slug = 'gluten-free') AS "attributeId"
  FROM "Product" WHERE "glutenFree" = true
  UNION ALL
  SELECT "id" AS "productId", (SELECT id FROM "attributes" WHERE slug = 'sugar-free') AS "attributeId"
  FROM "Product" WHERE "sugarFree" = true
  UNION ALL
  SELECT "id" AS "productId", (SELECT id FROM "attributes" WHERE slug = 'vegetarian') AS "attributeId"
  FROM "Product" WHERE "vegetarian" = true
) p
WHERE p."attributeId" IS NOT NULL
ON CONFLICT ("productId", "attributeId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries (run manually to confirm):
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT count(*) AS vendor_attributes FROM "vendor_attributes";
-- SELECT count(*) AS product_attributes FROM "product_attributes";
-- SELECT a.slug, a.name, count(va.*) AS vendor_count
-- FROM "attributes" a
-- LEFT JOIN "vendor_attributes" va ON va."attributeId" = a.id
-- GROUP BY a.slug, a.name ORDER BY vendor_count DESC LIMIT 15;
