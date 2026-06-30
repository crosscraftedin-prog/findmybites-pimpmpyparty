-- ============================================================
-- Template Engine Verification Script (Fixed)
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================
-- This script checks which Template Engine tables exist in your
-- production database. It does NOT modify anything.
-- ============================================================

-- ── 1. Check which tables exist ─────────────────────────────────────────────
SELECT
  v.expected_table AS table_name,
  CASE WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
FROM (
  VALUES
    ('listing_templates'),
    ('template_fields'),
    ('template_mappings'),
    ('template_version_snapshots'),
    ('template_audit_logs'),
    ('filter_groups'),
    ('filter_values'),
    ('category_filters'),
    ('vendor_filter_values'),
    ('vendor_analytics'),
    ('vendor_follows'),
    ('customer_wishlist'),
    ('quotes'),
    ('concierge_events'),
    ('conversations'),
    ('messages'),
    ('notifications'),
    ('vendor_availability'),
    ('review_votes'),
    ('pricing'),
    ('josh_conversations'),
    ('Category'),
    ('Subcategory')
) AS v(expected_table)
LEFT JOIN information_schema.tables t
  ON t.table_name = v.expected_table
  AND t.table_schema = 'public'
ORDER BY v.expected_table;

-- ── 2. Check Booking table columns ──────────────────────────────────────────
SELECT 'Booking' AS table_name, v.col AS column_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✅' ELSE '❌ MISSING' END AS status
FROM (
  VALUES
    ('phone'), ('eventTime'), ('address'), ('notes'),
    ('referenceImage'), ('preferredContact'), ('productId'),
    ('aiSummary'), ('leadScore'), ('aiQualification'), ('conciergeEventId')
) AS v(col)
LEFT JOIN information_schema.columns c
  ON c.column_name = v.col
  AND c.table_name = 'Booking'
  AND c.table_schema = 'public';

-- ── 3. Check reviews table columns ──────────────────────────────────────────
SELECT 'reviews' AS table_name, v.col AS column_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✅' ELSE '❌ MISSING' END AS status
FROM (
  VALUES
    ('reviewerEmail'), ('photos'), ('videoUrl'), ('verified'),
    ('vendorReply'), ('vendorRepliedAt'), ('helpfulCount'), ('reportCount'), ('productId')
) AS v(col)
LEFT JOIN information_schema.columns c
  ON c.column_name = v.col
  AND c.table_name = 'reviews'
  AND c.table_schema = 'public';

-- ── 4. Check Product table columns ──────────────────────────────────────────
SELECT 'Product' AS table_name, v.col AS column_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✅' ELSE '❌ MISSING' END AS status
FROM (
  VALUES
    ('badge'), ('templateSlug'), ('templateVersion')
) AS v(col)
LEFT JOIN information_schema.columns c
  ON c.column_name = v.col
  AND c.table_name = 'Product'
  AND c.table_schema = 'public';

-- ── 5. Summary count ────────────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE t.table_name IS NOT NULL) AS existing_tables,
  COUNT(*) FILTER (WHERE t.table_name IS NULL) AS missing_tables,
  COUNT(*) AS total_expected
FROM (
  VALUES
    ('listing_templates'), ('template_fields'), ('template_mappings'),
    ('template_version_snapshots'), ('template_audit_logs'),
    ('filter_groups'), ('filter_values'), ('category_filters'), ('vendor_filter_values'),
    ('vendor_analytics'), ('vendor_follows'), ('customer_wishlist'),
    ('quotes'), ('concierge_events'), ('conversations'), ('messages'),
    ('notifications'), ('vendor_availability'), ('review_votes'),
    ('pricing'), ('josh_conversations'), ('Category'), ('Subcategory')
) AS v(expected_table)
LEFT JOIN information_schema.tables t
  ON t.table_name = v.expected_table
  AND t.table_schema = 'public';
