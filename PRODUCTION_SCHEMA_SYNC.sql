-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCTION SCHEMA SYNC — Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
-- This script creates ALL new tables and columns added during the development
-- session that are missing from the production Supabase database.
-- It is IDEMPOTENT — safe to run multiple times (uses IF NOT EXISTS).
--
-- ROOT CAUSE of /api/vendor/me 500:
-- The Prisma client was regenerated with new schema fields (prepTime,
-- bookingNotice, status, etc.) but the production Supabase database was
-- never updated. When the Prisma client queries the Vendor table, it
-- requests columns that don't exist → Prisma throws P2022 (column does
-- not exist) → 500 Internal Server Error → dashboard infinite loading.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. NEW VENDOR COLUMNS ──────────────────────────────────────────────────
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "prepTime" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "bookingNotice" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "salesRevenue" INTEGER DEFAULT 0;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "maxOrdersPerDay" INTEGER;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "availabilityMode" TEXT DEFAULT 'always';
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "availableDays" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "availabilityStart" TIMESTAMPTZ;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "availabilityEnd" TIMESTAMPTZ;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "preparationTimeCategory" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "preparationTimeCustom" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "bookingNoticeHours" INTEGER;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "serviceAreaType" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "serviceCities" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "forceHidden" BOOLEAN DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "seasonLabel" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMPTZ;

-- ── 2. NEW PRODUCT COLUMNS ─────────────────────────────────────────────────
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "salesRevenue" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "maxOrdersPerDay" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availabilityMode" TEXT DEFAULT 'always';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availableDays" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availabilityStart" TIMESTAMPTZ;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "availabilityEnd" TIMESTAMPTZ;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "preparationTimeCategory" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "preparationTimeCustom" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bookingNoticeHours" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "serviceAreaType" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "serviceCities" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "forceHidden" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seasonLabel" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "orderCount" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastViewedAt" TIMESTAMPTZ;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "whatsappClicks" INTEGER DEFAULT 0;

-- ── 3. NEW TABLES ──────────────────────────────────────────────────────────

-- Growth Scores
CREATE TABLE IF NOT EXISTS "growth_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "score" INTEGER DEFAULT 0,
    "stars" INTEGER DEFAULT 0,
    "breakdown" TEXT,
    "weakAreas" TEXT,
    "computedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_scores_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "growth_scores_vendorId_computedAt_idx" ON "growth_scores"("vendorId", "computedAt");

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "discountPercent" INTEGER,
    "discountAmount" INTEGER,
    "currency" TEXT DEFAULT 'INR',
    "headline" TEXT,
    "description" TEXT,
    "terms" TEXT,
    "startsAt" TIMESTAMPTZ,
    "endsAt" TIMESTAMPTZ,
    "status" TEXT DEFAULT 'draft',
    "views" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "redemptions" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    CONSTRAINT "marketing_campaigns_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "marketing_campaigns_vendorId_idx" ON "marketing_campaigns"("vendorId");
CREATE INDEX IF NOT EXISTS "marketing_campaigns_status_startsAt_idx" ON "marketing_campaigns"("status", "startsAt");

-- Email Campaigns
CREATE TABLE IF NOT EXISTS "email_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "body" TEXT NOT NULL,
    "recipientCount" INTEGER DEFAULT 0,
    "sentAt" TIMESTAMPTZ,
    "openedCount" INTEGER DEFAULT 0,
    "clickedCount" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'draft',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    CONSTRAINT "email_campaigns_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE
);

-- Review Requests
CREATE TABLE IF NOT EXISTS "review_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "customerName" TEXT,
    "customerContact" TEXT,
    "token" TEXT NOT NULL UNIQUE,
    "status" TEXT DEFAULT 'sent',
    "sentAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    CONSTRAINT "review_requests_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE
);

-- Referrals
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerVendorId" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "inviteeVendorId" TEXT,
    "code" TEXT NOT NULL UNIQUE,
    "status" TEXT DEFAULT 'sent',
    "creditsEarned" INTEGER DEFAULT 0,
    "commissionEarned" INTEGER DEFAULT 0,
    "sentAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMPTZ,
    "rewardedAt" TIMESTAMPTZ,
    CONSTRAINT "referrals_referrerVendorId_fkey" FOREIGN KEY ("referrerVendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE,
    CONSTRAINT "referrals_inviteeVendorId_fkey" FOREIGN KEY ("inviteeVendorId") REFERENCES "vendor_listings"("id") ON DELETE SET NULL
);

-- AI Generation Logs
CREATE TABLE IF NOT EXISTS "ai_generation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT,
    "feature" TEXT NOT NULL,
    "tokens" INTEGER DEFAULT 0,
    "success" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ai_generation_logs_vendorId_idx" ON "ai_generation_logs"("vendorId");
CREATE INDEX IF NOT EXISTS "ai_generation_logs_feature_idx" ON "ai_generation_logs"("feature");

-- Vendor Analytics Daily
CREATE TABLE IF NOT EXISTS "vendor_analytics_daily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "profileViews" INTEGER DEFAULT 0,
    "productViews" INTEGER DEFAULT 0,
    "enquiries" INTEGER DEFAULT 0,
    "bookings" INTEGER DEFAULT 0,
    "revenue" INTEGER DEFAULT 0,
    "follows" INTEGER DEFAULT 0,
    "wishlistAdds" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    CONSTRAINT "vendor_analytics_daily_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE,
    CONSTRAINT "vendor_analytics_daily_vendorId_dateKey_key" UNIQUE ("vendorId", "dateKey")
);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");

-- Support Tickets
CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL UNIQUE,
    "vendorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT DEFAULT 'medium',
    "status" TEXT DEFAULT 'open',
    "businessName" TEXT,
    "vendorEmail" TEXT,
    "vendorPhone" TEXT,
    "browserInfo" TEXT,
    "dashboardUrl" TEXT,
    "assignedTo" TEXT,
    "assignedToEmail" TEXT,
    "internalNotes" TEXT,
    "lastVendorMessageAt" TIMESTAMPTZ,
    "lastAdminMessageAt" TIMESTAMPTZ,
    "vendorUnreadCount" INTEGER DEFAULT 0,
    "adminUnreadCount" INTEGER DEFAULT 0,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "resolvedAt" TIMESTAMPTZ,
    "closedAt" TIMESTAMPTZ,
    CONSTRAINT "support_tickets_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_tickets_vendorId_idx" ON "support_tickets"("vendorId");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");

-- Support Messages
CREATE TABLE IF NOT EXISTS "support_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderAvatar" TEXT,
    "body" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_messages_ticketId_idx" ON "support_messages"("ticketId");

-- Product Blocked Dates
CREATE TABLE IF NOT EXISTS "product_blocked_dates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "blockType" TEXT DEFAULT 'manual',
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    CONSTRAINT "product_blocked_dates_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "product_blocked_dates_productId_idx" ON "product_blocked_dates"("productId");

-- Product Analytics Daily
CREATE TABLE IF NOT EXISTS "product_analytics_daily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "views" INTEGER DEFAULT 0,
    "enquiries" INTEGER DEFAULT 0,
    "bookings" INTEGER DEFAULT 0,
    "revenue" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    CONSTRAINT "product_analytics_daily_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
    CONSTRAINT "product_analytics_daily_productId_dateKey_key" UNIQUE ("productId", "dateKey")
);

-- ── 4. NEW INDEXES on Vendor ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "vendor_listings_status_idx" ON "vendor_listings"("status");
CREATE INDEX IF NOT EXISTS "vendor_listings_availabilityMode_idx" ON "vendor_listings"("availabilityMode");
CREATE INDEX IF NOT EXISTS "vendor_listings_forceHidden_idx" ON "vendor_listings"("forceHidden");

-- ── 5. NEW INDEXES on Product ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Product_availabilityMode_idx" ON "Product"("availabilityMode");
CREATE INDEX IF NOT EXISTS "Product_forceHidden_idx" ON "Product"("forceHidden");

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. After running this script in Supabase SQL Editor, the production
-- database will match the Prisma schema and /api/vendor/me will return 200.
-- ═══════════════════════════════════════════════════════════════════════════
