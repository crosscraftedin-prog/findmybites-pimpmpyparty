/**
 * Billing Module — Invoices
 *
 * Generate and manage professional invoices for subscription payments.
 * Invoice numbers: FMB-INV-YYYY-NNNNN
 */

import { db } from "@/lib/db";

export interface InvoiceData {
  invoiceNumber: string;
  vendorName: string;
  vendorEmail: string;
  vendorCity: string;
  vendorCountry: string;
  planName: string;
  billingCycle: string;
  currency: string;
  currencySymbol: string;
  subtotal: number; // minor units
  discount: number; // minor units
  tax: number; // minor units
  total: number; // minor units
  promoCode: string | null;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  invoiceDate: Date;
}

/**
 * Generate a unique invoice number.
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 89999);
  return `FMB-INV-${year}-${random}`;
}

/**
 * Create an invoice record in the database after a successful payment.
 */
export async function createInvoice(params: {
  vendorId: string;
  paymentHistoryId?: string;
  subscriptionId?: string;
  planName: string;
  billingCycle: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  promoCode?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
}): Promise<{ id: string; invoiceNumber: string }> {
  const invoiceNumber = generateInvoiceNumber();

  const invoice = await db.invoice.create({
    data: {
      vendorId: params.vendorId,
      paymentHistoryId: params.paymentHistoryId,
      subscriptionId: params.subscriptionId,
      invoiceNumber,
      invoiceDate: new Date(),
      planName: params.planName,
      billingCycle: params.billingCycle,
      countryCode: params.countryCode,
      currency: params.currency,
      currencySymbol: params.currencySymbol,
      subtotal: params.subtotal,
      discount: params.discount,
      tax: params.tax,
      total: params.total,
      promoCode: params.promoCode || null,
      razorpayPaymentId: params.razorpayPaymentId || null,
      razorpayOrderId: params.razorpayOrderId || null,
      status: "paid",
    },
  });

  return { id: invoice.id, invoiceNumber };
}

/**
 * Get all invoices for a vendor.
 */
export async function getVendorInvoices(vendorId: string, limit: number = 50): Promise<any[]> {
  return db.invoice.findMany({
    where: { vendorId },
    orderBy: { invoiceDate: "desc" },
    take: limit,
  }).catch(() => []);
}

/**
 * Get a single invoice by ID (for PDF download).
 */
export async function getInvoiceById(invoiceId: string): Promise<any | null> {
  return db.invoice.findUnique({
    where: { id: invoiceId },
    include: { vendor: { select: { name: true, userEmail: true, city: true, country: true } } },
  }).catch(() => null);
}

/**
 * Get a single invoice by invoice number.
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<any | null> {
  return db.invoice.findUnique({
    where: { invoiceNumber },
    include: { vendor: { select: { name: true, userEmail: true, city: true, country: true } } },
  }).catch(() => null);
}

/**
 * Update invoice file path (after PDF generation).
 */
export async function updateInvoiceFilePath(invoiceId: string, filePath: string): Promise<void> {
  await db.invoice.update({
    where: { id: invoiceId },
    data: { filePath },
  }).catch(() => {});
}
