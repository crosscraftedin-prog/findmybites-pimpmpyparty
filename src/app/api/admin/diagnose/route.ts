import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/**
 * GET /api/admin/diagnose
 *
 * Diagnostic endpoint that tests every database table and returns
 * the EXACT error messages. No auth required (so we can test without
 * login issues getting in the way).
 *
 * This endpoint bypasses the resilient client wrapper and uses a
 * raw PrismaClient to get full error details.
 */

export async function GET() {
  const results: { table: string; status: string; error?: string; count?: number }[] = [];

  // Create a raw Prisma client (bypass the resilient wrapper)
  let client: PrismaClient;
  try {
    client = new PrismaClient();
  } catch (err: any) {
    return NextResponse.json({
      error: "Failed to create PrismaClient",
      details: err?.message,
      env: {
        DATABASE_URL_set: !!process.env.DATABASE_URL,
        DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
        NODE_ENV: process.env.NODE_ENV,
      },
    }, { status: 500 });
  }

  // Test each table
  const tables = [
    { name: "vendor_listings", method: () => client.vendor.count() },
    { name: "Product", method: () => client.product.count() },
    { name: "reviews", method: () => client.review.count() },
    { name: "Booking", method: () => client.booking.count() },
    { name: "listing_templates", method: () => client.listingTemplate.count() },
    { name: "template_fields", method: () => client.templateField.count() },
    { name: "template_mappings", method: () => client.templateMapping.count() },
    { name: "Category", method: () => client.category.count() },
    { name: "Subcategory", method: () => client.subcategory.count() },
    { name: "filter_groups", method: () => client.filterGroup.count() },
    { name: "notifications", method: () => client.notification.count() },
    { name: "conversations", method: () => client.conversation.count() },
    { name: "messages", method: () => client.message.count() },
    { name: "vendor_analytics", method: () => client.vendorAnalytics.count() },
    { name: "vendor_availability", method: () => client.vendorAvailability.count() },
    { name: "quotes", method: () => client.quote.count() },
    { name: "concierge_events", method: () => client.conciergeEvent.count() },
    { name: "vendor_follows", method: () => client.vendorFollow.count() },
    { name: "customer_wishlist", method: () => client.wishlist.count() },
    { name: "review_votes", method: () => client.reviewVote.count() },
    { name: "pricing", method: () => client.pricing.count() },
    { name: "josh_conversations", method: () => client.joshConversation.count() },
  ];

  for (const { name, method } of tables) {
    try {
      const count = await method();
      results.push({ table: name, status: "✅ OK", count });
    } catch (err: any) {
      results.push({
        table: name,
        status: "❌ ERROR",
        error: err?.message || String(err),
      });
    }
  }

  // Test relation includes (the ones that cause 500s)
  const relationTests: { name: string; method: () => Promise<any> }[] = [
    {
      name: "vendor.findMany (all columns)",
      method: () => client.vendor.findMany({ take: 1 }),
    },
    {
      name: "listingTemplate.findMany (include fields + mappings)",
      method: () => client.listingTemplate.findMany({
        take: 1,
        include: { fields: { take: 1 }, mappings: { take: 1 } },
      }),
    },
    {
      name: "templateMapping.findMany (include template)",
      method: () => client.templateMapping.findMany({
        take: 1,
        include: { template: { select: { slug: true, name: true } } },
      }),
    },
    {
      name: "booking.findMany (include vendor)",
      method: () => client.booking.findMany({
        take: 1,
        include: { vendor: { select: { name: true, city: true } } },
      }),
    },
  ];

  const relationResults: { test: string; status: string; error?: string }[] = [];
  for (const { name, method } of relationTests) {
    try {
      await method();
      relationResults.push({ test: name, status: "✅ OK" });
    } catch (err: any) {
      relationResults.push({
        test: name,
        status: "❌ ERROR",
        error: err?.message || String(err),
      });
    }
  }

  await client.$disconnect().catch(() => {});

  return NextResponse.json({
    env: {
      DATABASE_URL_set: !!process.env.DATABASE_URL,
      DATABASE_URL_protocol: process.env.DATABASE_URL?.split("://")[0],
      NODE_ENV: process.env.NODE_ENV,
    },
    tables: results,
    relations: relationResults,
  });
}
