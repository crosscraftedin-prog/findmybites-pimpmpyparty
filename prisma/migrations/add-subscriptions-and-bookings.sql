-- ============================================================
-- Subscription Lifecycle + Bookings Management System
-- Generated from prisma/schema.prisma
-- Run this in Supabase SQL Editor to create the new tables.
-- ============================================================

CREATE TABLE "vendor_subscriptions" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "planTier" TEXT NOT NULL DEFAULT 'pro',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "status" TEXT NOT NULL DEFAULT 'active',
    "planStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planExpiresAt" TIMESTAMP(3) NOT NULL,
    "nextRenewalDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'razorpay_orders',
    "providerSubscriptionId" TEXT,
    "amountPaid" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "signature" TEXT,
    "planName" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentStatus" TEXT NOT NULL DEFAULT 'captured',
    "provider" TEXT NOT NULL DEFAULT 'razorpay_orders',
    "paymentMethod" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings_v2" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerId" TEXT,
    "eventType" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "bookingTime" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 0,
    "budget" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "specialNotes" TEXT,
    "items" TEXT NOT NULL DEFAULT '[]',
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referenceImage" TEXT,
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "depositStatus" TEXT NOT NULL DEFAULT 'none',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "escrowStatus" TEXT NOT NULL DEFAULT 'none',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" INTEGER NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "invoiceNumber" TEXT,
    "recurrenceRule" TEXT,
    "calendarSyncToken" TEXT,
    "calendarEventId" TEXT,
    "internalNotes" TEXT,
    "reassignedFrom" TEXT,
    "reassignedAt" TIMESTAMP(3),
    "reassignedBy" TEXT,
    "createdBy" TEXT,
    "cancelledReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_v2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_notes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'vendor',
    "note" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_events" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL DEFAULT 'system',
    "metadata" TEXT,
    "notifEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "notifWhatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "notifPushSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_subscriptions_vendorId_idx" ON "vendor_subscriptions"("vendorId");
CREATE INDEX "vendor_subscriptions_status_idx" ON "vendor_subscriptions"("status");
CREATE INDEX "vendor_subscriptions_planExpiresAt_idx" ON "vendor_subscriptions"("planExpiresAt");
CREATE INDEX "vendor_subscriptions_provider_idx" ON "vendor_subscriptions"("provider");
CREATE UNIQUE INDEX "payment_history_paymentId_key" ON "payment_history"("paymentId");
CREATE INDEX "payment_history_vendorId_idx" ON "payment_history"("vendorId");
CREATE INDEX "payment_history_subscriptionId_idx" ON "payment_history"("subscriptionId");
CREATE INDEX "payment_history_orderId_idx" ON "payment_history"("orderId");
CREATE INDEX "payment_history_paymentStatus_idx" ON "payment_history"("paymentStatus");
CREATE INDEX "payment_history_createdAt_idx" ON "payment_history"("createdAt");
CREATE UNIQUE INDEX "bookings_v2_bookingNumber_key" ON "bookings_v2"("bookingNumber");
CREATE INDEX "bookings_v2_vendorId_idx" ON "bookings_v2"("vendorId");
CREATE INDEX "bookings_v2_customerId_idx" ON "bookings_v2"("customerId");
CREATE INDEX "bookings_v2_customerEmail_idx" ON "bookings_v2"("customerEmail");
CREATE INDEX "bookings_v2_status_idx" ON "bookings_v2"("status");
CREATE INDEX "bookings_v2_bookingDate_idx" ON "bookings_v2"("bookingDate");
CREATE INDEX "bookings_v2_city_idx" ON "bookings_v2"("city");
CREATE INDEX "bookings_v2_createdAt_idx" ON "bookings_v2"("createdAt");
CREATE INDEX "bookings_v2_vendorId_status_idx" ON "bookings_v2"("vendorId", "status");
CREATE INDEX "bookings_v2_vendorId_bookingDate_idx" ON "bookings_v2"("vendorId", "bookingDate");
CREATE INDEX "bookings_v2_status_bookingDate_idx" ON "bookings_v2"("status", "bookingDate");
CREATE INDEX "bookings_v2_customerEmail_status_idx" ON "bookings_v2"("customerEmail", "status");
CREATE INDEX "booking_notes_bookingId_idx" ON "booking_notes"("bookingId");
CREATE INDEX "booking_notes_createdAt_idx" ON "booking_notes"("createdAt");
CREATE INDEX "booking_events_bookingId_idx" ON "booking_events"("bookingId");
CREATE INDEX "booking_events_eventType_idx" ON "booking_events"("eventType");
CREATE INDEX "booking_events_createdAt_idx" ON "booking_events"("createdAt");
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "vendor_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings_v2" ADD CONSTRAINT "bookings_v2_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings_v2" ADD CONSTRAINT "bookings_v2_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;