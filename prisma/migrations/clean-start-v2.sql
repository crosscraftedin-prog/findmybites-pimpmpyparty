-- ============================================================
-- CLEAN START Migration v2 — Fix table name mismatches
-- ============================================================
-- The original supabase-setup.sql created tables as:
--   "User", "Vendor", "Review", "Booking"
--
-- But the Prisma schema expects (via @@map):
--   "User", "vendor_listings", "reviews", "Booking"
--
-- This migration:
--   1. Renames "Vendor" → "vendor_listings" and "Review" → "reviews"
--   2. Drops all 23 broken partially-created tables (they are EMPTY)
--   3. Creates all 23 new tables fresh with ALL columns
--   4. Adds FK constraints (AFTER renaming)
--
-- EXISTING TABLES (User, Vendor/Review/Booking, Product) keep their data.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 0a: RENAME EXISTING TABLES TO MATCH PRISMA @@map NAMES
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Rename "Vendor" to "vendor_listings" if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Vendor' AND table_schema = 'public') THEN
    ALTER TABLE "Vendor" RENAME TO "vendor_listings";
  END IF;

  -- Rename "Review" to "reviews" if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Review' AND table_schema = 'public') THEN
    ALTER TABLE "Review" RENAME TO "reviews";
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 0b: DROP ALL BROKEN PARTIALLY-CREATED TABLES (CASCADE)
-- These tables are EMPTY — no data is lost.
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS "review_votes" CASCADE;
DROP TABLE IF EXISTS "vendor_availability" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "concierge_events" CASCADE;
DROP TABLE IF EXISTS "quotes" CASCADE;
DROP TABLE IF EXISTS "customer_wishlist" CASCADE;
DROP TABLE IF EXISTS "vendor_follows" CASCADE;
DROP TABLE IF EXISTS "vendor_analytics" CASCADE;
DROP TABLE IF EXISTS "josh_conversations" CASCADE;
DROP TABLE IF EXISTS "pricing" CASCADE;
DROP TABLE IF EXISTS "Subcategory" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "vendor_filter_values" CASCADE;
DROP TABLE IF EXISTS "category_filters" CASCADE;
DROP TABLE IF EXISTS "filter_values" CASCADE;
DROP TABLE IF EXISTS "filter_groups" CASCADE;
DROP TABLE IF EXISTS "template_audit_logs" CASCADE;
DROP TABLE IF EXISTS "template_mappings" CASCADE;
DROP TABLE IF EXISTS "template_fields" CASCADE;
DROP TABLE IF EXISTS "template_version_snapshots" CASCADE;
DROP TABLE IF EXISTS "listing_templates" CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: CREATE ALL TABLES (fresh, with ALL columns)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE "listing_templates" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '', "ecosystem" TEXT NOT NULL DEFAULT 'BOTH',
    "icon" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "sections" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1, "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentTemplateId" TEXT, "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "wizard" TEXT NOT NULL DEFAULT '[]', "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiConfig" TEXT NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listing_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "listing_templates_slug_key" ON "listing_templates"("slug");

CREATE TABLE "template_version_snapshots" (
    "id" TEXT NOT NULL, "templateId" TEXT NOT NULL, "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL DEFAULT '{}', "createdBy" TEXT, "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_version_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "template_version_snapshots_templateId_version_key" ON "template_version_snapshots"("templateId", "version");
CREATE INDEX "template_version_snapshots_templateId_idx" ON "template_version_snapshots"("templateId");

CREATE TABLE "template_fields" (
    "id" TEXT NOT NULL, "templateId" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text', "section" TEXT NOT NULL DEFAULT 'Basic Information',
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "required" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true, "placeholder" TEXT, "helpText" TEXT, "unit" TEXT,
    "span" INTEGER NOT NULL DEFAULT 1, "filterGroupName" TEXT, "staticOptions" TEXT,
    "condition" TEXT, "subFields" TEXT, "toggleOptions" TEXT, "maxImages" INTEGER,
    "maxFileSize" INTEGER, "minValue" INTEGER, "maxValue" INTEGER, "step" DOUBLE PRECISION,
    "minLength" INTEGER, "maxLength" INTEGER, "pattern" TEXT, "patternHint" TEXT,
    "repeatable" BOOLEAN NOT NULL DEFAULT false, "minRepeats" INTEGER, "maxRepeats" INTEGER,
    "repeatLabel" TEXT, "repeatFields" TEXT, "searchable" BOOLEAN NOT NULL DEFAULT false,
    "seoIndexed" BOOLEAN NOT NULL DEFAULT false, "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "globalRef" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "template_fields_templateId_idx" ON "template_fields"("templateId");
CREATE INDEX "template_fields_section_idx" ON "template_fields"("section");
CREATE INDEX "template_fields_searchable_idx" ON "template_fields"("searchable");
CREATE INDEX "template_fields_seoIndexed_idx" ON "template_fields"("seoIndexed");
CREATE INDEX "template_fields_templateId_section_sortOrder_idx" ON "template_fields"("templateId", "section", "sortOrder");

CREATE TABLE "template_mappings" (
    "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "subcategory" TEXT,
    "templateId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_mappings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "template_mappings_categoryId_subcategory_key" ON "template_mappings"("categoryId", "subcategory");
CREATE INDEX "template_mappings_categoryId_idx" ON "template_mappings"("categoryId");
CREATE INDEX "template_mappings_templateId_idx" ON "template_mappings"("templateId");

CREATE TABLE "template_audit_logs" (
    "id" TEXT NOT NULL, "templateId" TEXT NOT NULL, "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL DEFAULT 'template', "entityId" TEXT, "fieldName" TEXT,
    "changeSummary" TEXT, "changeData" TEXT NOT NULL DEFAULT '{}', "adminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "template_audit_logs_templateId_idx" ON "template_audit_logs"("templateId");
CREATE INDEX "template_audit_logs_action_idx" ON "template_audit_logs"("action");
CREATE INDEX "template_audit_logs_createdAt_idx" ON "template_audit_logs"("createdAt");
CREATE INDEX "template_audit_logs_templateId_createdAt_idx" ON "template_audit_logs"("templateId", "createdAt");

CREATE TABLE "filter_groups" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'multi',
    "unit" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "filter_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "filter_groups_name_key" ON "filter_groups"("name");

CREATE TABLE "filter_values" (
    "id" TEXT NOT NULL, "groupId" TEXT NOT NULL, "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "filter_values_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "filter_values_groupId_value_key" ON "filter_values"("groupId", "value");
CREATE INDEX "filter_values_groupId_idx" ON "filter_values"("groupId");

CREATE TABLE "category_filters" (
    "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "filterGroupId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_filters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "category_filters_categoryId_filterGroupId_key" ON "category_filters"("categoryId", "filterGroupId");
CREATE INDEX "category_filters_categoryId_idx" ON "category_filters"("categoryId");

CREATE TABLE "vendor_filter_values" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "filterValueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_filter_values_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_filter_values_vendorId_filterValueId_key" ON "vendor_filter_values"("vendorId", "filterValueId");
CREATE INDEX "vendor_filter_values_vendorId_idx" ON "vendor_filter_values"("vendorId");

CREATE TABLE "Category" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "label" TEXT NOT NULL, "ecosystem" TEXT NOT NULL,
    "description" TEXT, "icon" TEXT, "image" TEXT, "accent" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "label" TEXT NOT NULL, "categoryId" TEXT NOT NULL,
    "description" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    "isPending" BOOLEAN NOT NULL DEFAULT false, "addedByVendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subcategory_slug_key" ON "Subcategory"("slug");
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

CREATE TABLE "pricing" (
    "id" TEXT NOT NULL, "countryCode" TEXT NOT NULL, "countryLabel" TEXT NOT NULL,
    "symbol" TEXT NOT NULL, "proMonthly" INTEGER NOT NULL, "proYearlyTotal" INTEGER NOT NULL,
    "businessMonthly" INTEGER NOT NULL, "businessYearlyTotal" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '', "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pricing_countryCode_key" ON "pricing"("countryCode");

CREATE TABLE "josh_conversations" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "userEmail" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'customer', "vendorId" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]', "conversationSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "josh_conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "josh_conversations_userId_idx" ON "josh_conversations"("userId");
CREATE INDEX "josh_conversations_vendorId_idx" ON "josh_conversations"("vendorId");

CREATE TABLE "vendor_analytics" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
    "productId" TEXT, "visitorHash" TEXT, "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_analytics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_analytics_vendorId_idx" ON "vendor_analytics"("vendorId");
CREATE INDEX "vendor_analytics_eventType_idx" ON "vendor_analytics"("eventType");
CREATE INDEX "vendor_analytics_createdAt_idx" ON "vendor_analytics"("createdAt");
CREATE INDEX "vendor_analytics_vendorId_eventType_createdAt_idx" ON "vendor_analytics"("vendorId", "eventType", "createdAt");

CREATE TABLE "vendor_follows" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "userEmail" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_follows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_follows_vendorId_userId_key" ON "vendor_follows"("vendorId", "userId");
CREATE INDEX "vendor_follows_vendorId_idx" ON "vendor_follows"("vendorId");
CREATE INDEX "vendor_follows_userId_idx" ON "vendor_follows"("userId");

CREATE TABLE "customer_wishlist" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "userEmail" TEXT,
    "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_wishlist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_wishlist_userId_entityType_entityId_key" ON "customer_wishlist"("userId", "entityType", "entityId");
CREATE INDEX "customer_wishlist_userId_idx" ON "customer_wishlist"("userId");
CREATE INDEX "customer_wishlist_entityType_idx" ON "customer_wishlist"("entityType");
CREATE INDEX "customer_wishlist_vendorId_idx" ON "customer_wishlist"("vendorId");

CREATE TABLE "quotes" (
    "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "vendorId" TEXT NOT NULL,
    "lineItems" TEXT NOT NULL DEFAULT '[]', "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD', "depositType" TEXT NOT NULL DEFAULT 'percentage',
    "depositValue" INTEGER NOT NULL DEFAULT 50, "aiNotes" TEXT, "status" TEXT NOT NULL DEFAULT 'draft',
    "customerResponse" TEXT, "customerNotes" TEXT, "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT, "depositPaidAt" TIMESTAMP(3), "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "quotes_bookingId_idx" ON "quotes"("bookingId");
CREATE INDEX "quotes_vendorId_idx" ON "quotes"("vendorId");
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

CREATE TABLE "concierge_events" (
    "id" TEXT NOT NULL, "customerName" TEXT NOT NULL, "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT, "eventType" TEXT NOT NULL, "eventDate" TEXT NOT NULL,
    "eventCity" TEXT NOT NULL, "guests" INTEGER NOT NULL, "budget" TEXT NOT NULL,
    "notes" TEXT, "eventManager" TEXT, "assignedVendors" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'new', "managementFeeType" TEXT NOT NULL DEFAULT 'percentage',
    "managementFeeValue" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "concierge_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "concierge_events_status_idx" ON "concierge_events"("status");
CREATE INDEX "concierge_events_eventManager_idx" ON "concierge_events"("eventManager");
CREATE INDEX "concierge_events_createdAt_idx" ON "concierge_events"("createdAt");

CREATE TABLE "conversations" (
    "id" TEXT NOT NULL, "participant1Type" TEXT NOT NULL, "participant1Id" TEXT NOT NULL,
    "participant2Type" TEXT NOT NULL, "participant2Id" TEXT NOT NULL,
    "vendorId" TEXT, "productId" TEXT, "bookingId" TEXT, "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3), "unreadCount1" INTEGER NOT NULL DEFAULT 0,
    "unreadCount2" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conversations_participant1Type_participant1Id_participant2Type_participant2Id_key" ON "conversations"("participant1Type", "participant1Id", "participant2Type", "participant2Id");
CREATE INDEX "conversations_participant1Type_participant1Id_idx" ON "conversations"("participant1Type", "participant1Id");
CREATE INDEX "conversations_participant2Type_participant2Id_idx" ON "conversations"("participant2Type", "participant2Id");
CREATE INDEX "conversations_vendorId_idx" ON "conversations"("vendorId");
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

CREATE TABLE "messages" (
    "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "senderType" TEXT NOT NULL,
    "senderId" TEXT NOT NULL, "senderName" TEXT NOT NULL, "senderAvatar" TEXT,
    "content" TEXT NOT NULL, "attachments" TEXT, "quoteId" TEXT, "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX "messages_senderType_senderId_idx" ON "messages"("senderType", "senderId");
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL, "recipientType" TEXT NOT NULL, "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
    "vendorId" TEXT, "productId" TEXT, "bookingId" TEXT, "quoteId" TEXT,
    "conversationId" TEXT, "actionUrl" TEXT, "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_recipientType_recipientId_read_idx" ON "notifications"("recipientType", "recipientId", "read");
CREATE INDEX "notifications_recipientType_recipientId_createdAt_idx" ON "notifications"("recipientType", "recipientId", "createdAt");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

CREATE TABLE "vendor_availability" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available', "timeSlots" TEXT, "note" TEXT,
    "bookingId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_availability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_availability_vendorId_date_key" ON "vendor_availability"("vendorId", "date");
CREATE INDEX "vendor_availability_vendorId_date_idx" ON "vendor_availability"("vendorId", "date");
CREATE INDEX "vendor_availability_status_idx" ON "vendor_availability"("status");

CREATE TABLE "review_votes" (
    "id" TEXT NOT NULL, "reviewId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "review_votes_reviewId_userId_key" ON "review_votes"("reviewId", "userId");
CREATE INDEX "review_votes_reviewId_idx" ON "review_votes"("reviewId");

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2: ADD FOREIGN KEY CONSTRAINTS (using DO blocks for safety)
-- References renamed tables: "reviews" and "vendor_listings"
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Template Engine FKs (no external dependencies)
  ALTER TABLE "listing_templates" ADD CONSTRAINT "listing_templates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "listing_templates"("id") ON DELETE SET NULL;
  ALTER TABLE "template_version_snapshots" ADD CONSTRAINT "template_version_snapshots_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  ALTER TABLE "template_mappings" ADD CONSTRAINT "template_mappings_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  ALTER TABLE "template_audit_logs" ADD CONSTRAINT "template_audit_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;

  -- Filter Engine FKs
  ALTER TABLE "filter_values" ADD CONSTRAINT "filter_values_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_filterGroupId_fkey" FOREIGN KEY ("filterGroupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  ALTER TABLE "vendor_filter_values" ADD CONSTRAINT "vendor_filter_values_filterValueId_fkey" FOREIGN KEY ("filterValueId") REFERENCES "filter_values"("id") ON DELETE CASCADE;

  -- Subcategory FK
  ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;

  -- Messages FK
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;

  -- Phase 4+5 FKs — reference renamed tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Booking' AND table_schema = 'public') THEN
    ALTER TABLE "quotes" ADD CONSTRAINT "quotes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_listings' AND table_schema = 'public') THEN
    ALTER TABLE "vendor_availability" ADD CONSTRAINT "vendor_availability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') THEN
    ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If FK fails (e.g. table doesn't exist), skip it — app works without DB-level FKs
  RAISE NOTICE 'Skipping some FK constraints: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: ALTER EXISTING TABLES (Booking, reviews, Product, vendor_listings)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Booking columns
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
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
  CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
  CREATE INDEX IF NOT EXISTS "Booking_email_idx" ON "Booking"("email");
  CREATE INDEX IF NOT EXISTS "Booking_conciergeEventId_idx" ON "Booking"("conciergeEventId");
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping Booking indexes: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- reviews columns (table was renamed from "Review" to "reviews")
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping reviews columns: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Product columns
  ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badge" TEXT;
  ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateSlug" TEXT;
  ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateVersion" INTEGER;
  CREATE INDEX IF NOT EXISTS "Product_templateSlug_idx" ON "Product"("templateSlug");
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping Product columns: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- vendor_listings columns (table was renamed from "Vendor" to "vendor_listings")
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping vendor_listings columns: %', SQLERRM;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — All 23 tables created, existing tables renamed + enhanced
-- ═══════════════════════════════════════════════════════════════════════════
