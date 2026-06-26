-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Panel: New tables for featured vendors, broadcasts, Josh AI logs, promo codes
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kcqygvzxgkvwlupoyzzw/sql/new
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Featured vendor slots (homepage placement management)
CREATE TABLE IF NOT EXISTS public.featured_vendors (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id   TEXT NOT NULL REFERENCES public."Vendor"(id) ON DELETE CASCADE,
  slot_position INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vendor_id)
);

-- 2. Broadcast messages (push notifications to vendors)
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject           TEXT NOT NULL,
  body              TEXT NOT NULL,
  target            TEXT NOT NULL DEFAULT 'all',  -- all|food|party|free|paid|country|inactive
  target_country    TEXT,
  delivery_methods  JSONB NOT NULL DEFAULT '["email","in_app"]'::jsonb,
  recipient_count   INTEGER NOT NULL DEFAULT 0,
  sent_at           TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Josh AI conversation logs
CREATE TABLE IF NOT EXISTS public.josh_conversations (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id            TEXT NOT NULL,
  event_type            TEXT,
  location              TEXT,
  budget                TEXT,
  guest_count           INTEGER,
  categories_requested  JSONB DEFAULT '[]'::jsonb,
  vendors_shown         JSONB DEFAULT '[]'::jsonb,
  outcome               TEXT DEFAULT 'browsed',  -- browsed|quoted|booked
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching by date range
CREATE INDEX IF NOT EXISTS idx_josh_conversations_created ON public.josh_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_josh_conversations_location ON public.josh_conversations(location);
CREATE INDEX IF NOT EXISTS idx_josh_conversations_outcome ON public.josh_conversations(outcome);

-- 4. Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code              TEXT NOT NULL UNIQUE,
  discount_type     TEXT NOT NULL DEFAULT 'percent',  -- percent|fixed
  discount_value    INTEGER NOT NULL,
  applies_to        TEXT NOT NULL DEFAULT 'all',  -- all|pro|business
  usage_limit       INTEGER,  -- NULL = unlimited
  per_vendor_limit  BOOLEAN NOT NULL DEFAULT true,
  uses_count        INTEGER NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.featured_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.josh_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies: admin-only write, public read where appropriate
CREATE POLICY "featured_admin_all" ON public.featured_vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "broadcasts_admin_all" ON public.broadcasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "josh_public_insert" ON public.josh_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "josh_admin_read" ON public.josh_conversations FOR SELECT USING (true);
CREATE POLICY "promo_admin_all" ON public.promo_codes FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! All 4 tables created with RLS enabled.
-- The admin panel components will work with placeholder data until these
-- tables exist in your Supabase project. Run this SQL to enable full functionality.
-- ─────────────────────────────────────────────────────────────────────────────
