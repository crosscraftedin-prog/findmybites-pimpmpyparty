import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/billing/settings
 * Returns the billing settings (single row, ID = "default").
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  let settings = await db.billingSettings.findUnique({ where: { id: "default" } }).catch(() => null);

  // Create default settings if they don't exist
  if (!settings) {
    settings = await db.billingSettings.create({ data: { id: "default" } }).catch(() => null);
  }

  return NextResponse.json(settings);
}

/**
 * PUT /api/admin/billing/settings
 * Update billing settings.
 */
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();

    const settings = await db.billingSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        invoicePrefix: body.invoicePrefix || "FMB-INV",
        gracePeriodDays: body.gracePeriodDays ?? 3,
        retryCount: body.retryCount ?? 3,
        retryIntervalHr: body.retryIntervalHr ?? 48,
        reminderDays: body.reminderDays || "7,3,1,0",
        defaultCurrency: body.defaultCurrency || "USD",
        fallbackCountry: body.fallbackCountry || "US",
        supportEmail: body.supportEmail || "hello@findmybites.party",
        taxPercentage: body.taxPercentage ?? 0,
        invoiceFooter: body.invoiceFooter || "Thank you for your business!",
      },
      update: {
        invoicePrefix: body.invoicePrefix,
        gracePeriodDays: body.gracePeriodDays,
        retryCount: body.retryCount,
        retryIntervalHr: body.retryIntervalHr,
        reminderDays: body.reminderDays,
        defaultCurrency: body.defaultCurrency,
        fallbackCountry: body.fallbackCountry,
        supportEmail: body.supportEmail,
        taxPercentage: body.taxPercentage,
        invoiceFooter: body.invoiceFooter,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
