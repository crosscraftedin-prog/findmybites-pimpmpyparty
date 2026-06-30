-- ============================================================
-- Template Engine Verification Script
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================
-- This script checks which Template Engine tables exist in your
-- production database. It does NOT modify anything.
-- ============================================================

SELECT
  t.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
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

-- ── Also check for missing columns on existing tables ──────────────────────

-- Check Booking table for Phase 4 columns
SELECT 'Booking' as table_name, column_name,
  CASE WHEN column_name IS NOT NULL THEN '✅' ELSE '❌ MISSING' END as status
FROM (
  VALUES
    ('phone'), ('eventTime'), ('address'), ('notes'),
    ('referenceImage'), ('preferredContact'), ('productId'),
    ('aiSummary'), ('leadScore'), ('aiQualification'), ('conciergeEventId')
) AS v(column_name)
LEFT JOIN information_schema.columns c
  ON c.column_name = v.column_name
  AND c.table_name = 'Booking'
  AND c.table_schema = 'public';

-- Check reviews table for Phase 5 columns
SELECT 'reviews' as table_name, column_name,
  CASE WHEN column_name IS NOT NULL THEN '✅' ELSE '❌ MISSING' END as status
FROM (
  VALUES
    ('reviewerEmail'), ('photos'), ('videoUrl'), ('verified'),
    ('vendorReply'), ('vendorRepliedAt'), ('helpfulCount'), ('reportCount'), ('productId')
) AS v(column_name)
LEFT JOIN information_schema.columns c
  ON c.column_name = v.column_name
  AND c.table_name = 'reviews'
  AND c.table_schema = 'public';

-- Check Product table for Template Engine columns
SELECT 'Product' as table_name, column_name,
  CASE WHEN column_name IS NOT NULL THEN '✅' ELSE '❌ MISSING' END as status
FROM (
  VALUES
    ('badge'), ('templateSlug'), ('templateVersion')
) AS v(column_name)
LEFT JOIN information_schema.columns c
  ON c.column_name = v.column_name
  AND c.table_name = 'Product'
  AND c.table_schema = 'public';

-- ── Summary count ───────────────────────────────────────────────────────────
SELECT
  COUNT(*) FILTER (WHERE t.table_name IS NOT NULL) as existing_tables,
  COUNT(*) FILTER (WHERE t.table_name IS NULL) as missing_tables,
  COUNT(*) as total_expected
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
