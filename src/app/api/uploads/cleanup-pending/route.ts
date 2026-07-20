import { NextRequest, NextResponse } from "next/server";
import { cleanupPendingUploads } from "@/lib/uploads/pending-cleanup";

/**
 * GET /api/uploads/cleanup-pending — cron-ready orphaned-upload cleanup.
 *
 * Deletes pending/{userId}/... files in Supabase Storage that are:
 *   - older than 30 days, AND
 *   - NOT referenced by any vendor row (heroImage/avatarImage/gallery) or
 *     product row (images).
 *
 * This keeps storage clean of orphaned files from abandoned onboarding
 * attempts while never touching files a live vendor is using.
 *
 * Protected by CRON_SECRET: the Authorization header must be
 * `Bearer <CRON_SECRET>`. If CRON_SECRET is not set (dev), the endpoint is
 * open but logs a warning — matching the pattern in /api/bookings/reminders.
 *
 * Schedule: daily (e.g. Vercel Cron → `0 3 * * *`).
 *
 * This route does NOT create a new upload pipeline — it only deletes orphaned
 * files produced by the existing /api/upload pipeline. It reuses the existing
 * Supabase admin client and storage bucket.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // ── CRON_SECRET authorization ──
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn(
      "[uploads/cleanup-pending] CRON_SECRET not set — running unauthenticated (dev only)."
    );
  }

  try {
    const result = await cleanupPendingUploads();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[uploads/cleanup-pending] fatal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
