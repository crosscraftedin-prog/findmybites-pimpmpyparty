/** GET /api/vendor/support/faqs — static FAQs + vendor ticket stats */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { FAQS, getVendorTicketStats } from "@/lib/support/support-service";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  let stats = { total: 0, open: 0, unread: 0 };
  if (vendor) {
    try { stats = await getVendorTicketStats(vendor.id); } catch {}
  }
  return NextResponse.json({ faqs: FAQS, stats });
}
