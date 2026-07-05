/**
 * Vendor Delete Service — production-safe transactional cascade deletion.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * CRITICAL RULES (enforced by design):
 *
 * 1. The Prisma transaction contains ONLY Prisma queries.
 *    No Supabase Storage, no HTTP fetch, no AI, no email, no setTimeout,
 *    no filesystem — nothing that holds the transaction open while waiting
 *    for external I/O.
 *
 * 2. All child-table deletes inside the transaction use the `tx` client
 *    (never the top-level `db` client).
 *
 * 3. No nested transactions (no `tx.$transaction()` or `db.$transaction()`
 *    inside the callback).
 *
 * 4. Storage cleanup, cache invalidation, and revalidation happen AFTER
 *    the transaction commits. If storage cleanup fails, the DB deletion
 *    is NOT rolled back — the database is authoritative. Failures are
 *    logged as warnings only.
 *
 * 5. Proper error codes:
 *    - 404 if vendor not found
 *    - 409 if vendor already deleted (concurrent request)
 *    - 500 only for unexpected failures
 */
import { db } from "@/lib/db";
import { deleteVendorStorageFiles } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DeleteResult {
  success: boolean;
  vendorId: string;
  vendorName: string;
  /** rows deleted per table (approx — counts from deleteMany) */
  counts: Record<string, number>;
  storage: { deleted: number; skipped: boolean };
  auditLogId: string | null;
  error?: string;
  /** HTTP status code hint for callers */
  statusCode?: number;
}

// ── Internal: cascade delete (Prisma-only, runs inside transaction) ──────────

/**
 * Deletes ALL child rows for a vendor using the transaction client `tx`.
 *
 * This function is PURE Prisma — no external I/O, no storage, no HTTP.
 * Uses Promise.all for independent deletes to minimize transaction duration.
 *
 * IMPORTANT: Every query uses `tx.` (the transaction client), never `db.`.
 */
async function cascadeDeleteVendorData(
  tx: PrismaClient,
  vendorId: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  // ── Group 1: Independent child-table deletes (run in parallel) ──
  // These tables have no dependencies between each other, so they can all
  // run concurrently inside the transaction. This drastically reduces the
  // total transaction duration compared to sequential awaits.
  const [
    reviews, bookings, bookingsV2, products, availability,
    subscriptions, payments, analytics, analyticsDaily, growthScores,
    marketingCampaigns, emailCampaigns, reviewRequests, referralsMade,
    aiGenerationLogs, vendorFilterValues, vendorFollows, notifications,
  ] = await Promise.all([
    tx.review.deleteMany({ where: { vendorId } }),
    tx.booking.deleteMany({ where: { vendorId } }),
    tx.bookingV2.deleteMany({ where: { vendorId } }),
    tx.product.deleteMany({ where: { vendorId } }),
    tx.vendorAvailability.deleteMany({ where: { vendorId } }),
    tx.vendorSubscription.deleteMany({ where: { vendorId } }),
    tx.paymentHistory.deleteMany({ where: { vendorId } }),
    tx.vendorAnalytics.deleteMany({ where: { vendorId } }),
    tx.vendorAnalyticsDaily.deleteMany({ where: { vendorId } }),
    tx.growthScore.deleteMany({ where: { vendorId } }),
    tx.marketingCampaign.deleteMany({ where: { vendorId } }),
    tx.emailCampaign.deleteMany({ where: { vendorId } }),
    tx.reviewRequest.deleteMany({ where: { vendorId } }),
    tx.referral.deleteMany({ where: { referrerVendorId: vendorId } }),
    tx.aiGenerationLog.deleteMany({ where: { vendorId } }),
    tx.vendorFilterValue.deleteMany({ where: { vendorId } }),
    tx.vendorFollow.deleteMany({ where: { vendorId } }),
    tx.notification.deleteMany({ where: { recipientType: "vendor", recipientId: vendorId } }),
  ]);

  counts.reviews = reviews.count;
  counts.bookings = bookings.count;
  counts.bookingsV2 = bookingsV2.count;
  counts.products = products.count;
  counts.availability = availability.count;
  counts.subscriptions = subscriptions.count;
  counts.payments = payments.count;
  counts.analytics = analytics.count;
  counts.analyticsDaily = analyticsDaily.count;
  counts.growthScores = growthScores.count;
  counts.marketingCampaigns = marketingCampaigns.count;
  counts.emailCampaigns = emailCampaigns.count;
  counts.reviewRequests = reviewRequests.count;
  counts.referralsMade = referralsMade.count;
  counts.aiGenerationLogs = aiGenerationLogs.count;
  counts.vendorFilterValues = vendorFilterValues.count;
  counts.vendorFollows = vendorFollows.count;
  counts.notificationsDeleted = notifications.count;

  // ── Group 2: Null-out tables where vendorId is optional (run in parallel) ──
  // These use updateMany to set vendorId = null instead of deleting
  // (the row belongs to another entity, e.g. a conversation or wishlist item).
  const [
    referralsJoined, joshConversations, wishlistCleared,
  ] = await Promise.all([
    tx.referral.updateMany({ where: { inviteeVendorId: vendorId }, data: { inviteeVendorId: null } }),
    tx.joshConversation.updateMany({ where: { vendorId }, data: { vendorId: null } }),
    tx.wishlist.updateMany({ where: { vendorId }, data: { vendorId: null } }),
  ]);

  counts.referralsJoined = referralsJoined.count;
  counts.joshConversationsCleared = joshConversations.count;
  counts.wishlistCleared = wishlistCleared.count;

  // ── Finally: delete the vendor row itself ──
  // This MUST be last — child FKs must be gone before the parent.
  await tx.vendor.delete({ where: { id: vendorId } });

  return counts;
}

// ── Internal: post-commit cleanup (storage + cache) ──────────────────────────

/**
 * Runs AFTER the DB transaction commits successfully.
 *
 * Deletes Supabase Storage files and revalidates Next.js cache paths.
 * All failures are caught and logged as warnings — they NEVER roll back
 * the DB deletion. The database is authoritative.
 */
async function postCommitCleanup(
  vendorId: string,
  vendorSlug: string
): Promise<{ storage: { deleted: number; skipped: boolean } }> {
  // ── Storage cleanup (best-effort) ──
  let storage = { deleted: 0, skipped: true };
  try {
    storage = await deleteVendorStorageFiles(vendorId);
    logger.info("vendor-delete", "Storage cleanup complete", {
      vendorId,
      deleted: storage.deleted,
      skipped: storage.skipped,
    });
  } catch (err) {
    // DO NOT rollback DB deletion. Log warning only.
    logger.warn("vendor-delete", "Storage cleanup failed (non-fatal — DB deletion is authoritative)", {
      vendorId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Cache invalidation (best-effort) ──
  try {
    revalidatePath(`/vendor/${vendorSlug}`);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    logger.info("vendor-delete", "Cache revalidation complete", { vendorId, slug: vendorSlug });
  } catch (err) {
    logger.warn("vendor-delete", "Cache revalidation failed (non-fatal)", {
      vendorId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { storage };
}

// ── Main: delete a single vendor ─────────────────────────────────────────────

/**
 * Delete a single vendor + all related data.
 *
 * `adminId` / `adminEmail` identify the admin (from the session).
 * `reason` is the admin's free-form justification (for the audit log).
 *
 * Returns a DeleteResult with:
 *   - success: boolean
 *   - statusCode: 404 (not found), 409 (already deleted), 500 (unexpected)
 */
export async function deleteVendor(
  vendorId: string,
  adminId: string,
  adminEmail: string | null,
  reason: string
): Promise<DeleteResult> {
  logger.info("vendor-delete", "Deleting vendor", { vendorId, admin: adminEmail || adminId, reason });

  // 1. Fetch the vendor first (need name + slug for audit log + cache, confirm existence)
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, slug: true, owner_user_id: true },
  }).catch(() => null);

  if (!vendor) {
    logger.warn("vendor-delete", "Vendor not found", { vendorId });
    return {
      success: false, vendorId, vendorName: "(unknown)",
      counts: {}, storage: { deleted: 0, skipped: true }, auditLogId: null,
      error: "Vendor not found",
      statusCode: 404,
    };
  }

  // 2. Transactional cascade delete — ONLY Prisma queries inside.
  //    No storage, no HTTP, no AI, no email, no setTimeout.
  let counts: Record<string, number> = {};
  try {
    counts = await db.$transaction(async (tx) => {
      return cascadeDeleteVendorData(tx as unknown as PrismaClient, vendorId);
    }, {
      // Give the transaction up to 30 seconds — enough for all child deletes
      // even on a remote DB. Prisma's default is 5s which is too short for
      // a 21-table cascade on Supabase.
      timeout: 30_000,
      maxWait: 15_000,
    });
    logger.info("vendor-delete", "Database cleanup complete", { vendorId, counts });
  } catch (err: any) {
    // Prisma P2025 = record not found (vendor already deleted by a concurrent request)
    if (err?.code === "P2025") {
      logger.warn("vendor-delete", "Vendor already deleted (concurrent request)", { vendorId });
      return {
        success: false, vendorId, vendorName: vendor.name,
        counts, storage: { deleted: 0, skipped: true }, auditLogId: null,
        error: "Vendor already deleted",
        statusCode: 409,
      };
    }
    logger.error("vendor-delete", "Transaction failed", {
      vendorId,
      error: err instanceof Error ? err.message : String(err),
      code: err?.code,
    });
    return {
      success: false, vendorId, vendorName: vendor.name,
      counts, storage: { deleted: 0, skipped: true }, auditLogId: null,
      error: err?.message || "Transaction failed",
      statusCode: 500,
    };
  }

  // 3. Post-commit cleanup (storage + cache) — best-effort, never rolls back DB
  const { storage } = await postCommitCleanup(vendorId, vendor.slug);

  // 4. Write the audit log (after commit — records what actually happened)
  let auditLogId: string | null = null;
  try {
    const log = await db.adminAuditLog.create({
      data: {
        action: "vendor_delete",
        adminId,
        adminEmail,
        targetId: vendorId,
        targetName: vendor.name,
        reason: reason || null,
        metadata: JSON.stringify({ counts, storageDeleted: storage.deleted, storageSkipped: storage.skipped }),
      },
    });
    auditLogId = log.id;
  } catch (err) {
    logger.warn("vendor-delete", "Audit log write failed (non-fatal)", {
      vendorId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  logger.info("vendor-delete", "Vendor deleted successfully", {
    vendorId,
    vendorName: vendor.name,
    admin: adminEmail || adminId,
    storageDeleted: storage.deleted,
  });

  return { success: true, vendorId, vendorName: vendor.name, counts, storage, auditLogId };
}

// ── Bulk delete ──────────────────────────────────────────────────────────────

/**
 * Bulk delete multiple vendors. Runs each deletion sequentially (each in its
 * OWN transaction) so a single failure doesn't roll back the others.
 *
 * Never wraps multiple vendors in a single transaction — that would create
 * an extremely long-running transaction that risks timeout.
 */
export async function deleteVendors(
  vendorIds: string[],
  adminId: string,
  adminEmail: string | null,
  reason: string
): Promise<{ results: DeleteResult[]; summary: { success: number; failed: number } }> {
  const results: DeleteResult[] = [];
  for (const id of vendorIds) {
    const result = await deleteVendor(id, adminId, adminEmail, reason);
    results.push(result);
  }
  const successCount = results.filter((r) => r.success).length;

  try {
    await db.adminAuditLog.create({
      data: {
        action: "vendor_bulk_delete",
        adminId,
        adminEmail,
        targetId: vendorIds.join(","),
        targetName: `${successCount}/${vendorIds.length} vendors`,
        reason: reason || null,
        metadata: JSON.stringify({ vendorIds, successCount, failed: vendorIds.length - successCount }),
      },
    });
  } catch (err) {
    logger.warn("vendor-delete", "Bulk audit log failed (non-fatal)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    results,
    summary: { success: successCount, failed: vendorIds.length - successCount },
  };
}

// ── Test vendor cleanup ─────────────────────────────────────────────────────

const TEST_NAME_PATTERNS = /\b(test|demo|sample|temp|dummy)\b/i;

export interface TestVendorPreview {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  city: string;
  country: string;
  createdAt: string;
  approved: boolean;
  matchedOn: string;
}

/** Preview vendors whose names match test/demo/sample/temp/dummy patterns. */
export async function previewTestVendors(): Promise<TestVendorPreview[]> {
  const all = await db.vendor.findMany({
    select: { id: true, name: true, slug: true, ecosystem: true, city: true, country: true, createdAt: true, approved: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return all
    .filter((v) => TEST_NAME_PATTERNS.test(v.name))
    .map((v) => ({
      ...v,
      createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
      matchedOn: (v.name.match(TEST_NAME_PATTERNS) || [""])[0],
    }));
}

/** Delete all vendors matching test-name patterns. Returns per-vendor results. */
export async function cleanupTestVendors(
  adminId: string,
  adminEmail: string | null,
  reason: string
): Promise<{ results: DeleteResult[]; preview: TestVendorPreview[]; summary: { success: number; failed: number } }> {
  const preview = await previewTestVendors();
  const ids = preview.map((v) => v.id);
  if (ids.length === 0) {
    return { results: [], preview: [], summary: { success: 0, failed: 0 } };
  }
  const { results, summary } = await deleteVendors(ids, adminId, adminEmail, reason);

  try {
    await db.adminAuditLog.create({
      data: {
        action: "vendor_cleanup_test",
        adminId,
        adminEmail,
        targetId: ids.join(","),
        targetName: `${summary.success}/${ids.length} test vendors`,
        reason: reason || "Cleanup test vendors",
        metadata: JSON.stringify({ vendorIds: ids, ...summary }),
      },
    });
  } catch (err) {
    logger.warn("vendor-delete", "Cleanup audit log failed (non-fatal)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { results, preview, summary };
}
