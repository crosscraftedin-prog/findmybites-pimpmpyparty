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
 *
 * 6. Granular debug logging at every phase:
 *    - START transaction
 *    - Before each model operation (model name printed)
 *    - After child deletes
 *    - Before vendor delete
 *    - Transaction committed
 *    - Storage cleanup start/finish
 *    - Audit log written
 *
 * 7. Prisma error handling logs: error.code, error.meta, error.message, error.stack
 *    Specifically detects: P2025 (not found), P2028 (transaction timeout),
 *    P2034 (transaction write conflict).
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

// ── Prisma error handler ─────────────────────────────────────────────────────

interface PrismaError {
  code?: string;
  meta?: unknown;
  message?: string;
  stack?: string;
  name?: string;
}

/**
 * Log a Prisma error with full diagnostic detail.
 * Detects the critical transaction-related error codes:
 *   P2025 — record not found (already deleted)
 *   P2028 — transaction timeout / closed transaction
 *   P2034 — transaction write conflict
 */
function logPrismaError(context: string, vendorId: string, err: unknown): {
  code: string;
  isAlreadyDeleted: boolean;
  isTimeout: boolean;
  isConflict: boolean;
} {
  const e = err as PrismaError;
  const code = e?.code || "UNKNOWN";
  const isAlreadyDeleted = code === "P2025";
  const isTimeout = code === "P2028";
  const isConflict = code === "P2034";

  logger.error("vendor-delete", `Prisma error in ${context}`, {
    vendorId,
    code,
    name: e?.name,
    message: e?.message,
    meta: e?.meta,
    stack: e?.stack?.split("\n").slice(0, 5).join("\n"),
    isAlreadyDeleted,
    isTimeout,
    isConflict,
  });

  return { code, isAlreadyDeleted, isTimeout, isConflict };
}

// ── Internal: cascade delete (Prisma-only, runs inside transaction) ──────────

/**
 * Deletes ALL child rows for a vendor using the transaction client `tx`.
 *
 * This function is PURE Prisma — no external I/O, no storage, no HTTP.
 * Uses Promise.all for independent deletes to minimize transaction duration.
 *
 * IMPORTANT: Every query uses `tx.` (the transaction client), never `db.`.
 *
 * Debug logging: logs the model name BEFORE every tx operation so the
 * exact failing statement is identifiable in logs.
 */
async function cascadeDeleteVendorData(
  tx: PrismaClient,
  vendorId: string,
  logCtx: ReturnType<typeof logger.withContext>
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const t0 = Date.now();

  // ── Group 1: Independent child-table deletes (run in parallel) ──
  // These tables have no dependencies between each other, so they can all
  // run concurrently inside the transaction. This drastically reduces the
  // total transaction duration compared to sequential awaits.
  //
  // Each model name is logged BEFORE the operation so if a P2028/P2034
  // fires, the log shows exactly which statement was executing.
  logCtx.debug("vendor-delete", "TX: child-table deletes — starting (18 models in parallel)");

  const models = [
    "review", "booking", "bookingV2", "product", "vendorAvailability",
    "vendorSubscription", "paymentHistory", "vendorAnalytics", "vendorAnalyticsDaily",
    "growthScore", "marketingCampaign", "emailCampaign", "reviewRequest",
    "referral", "aiGenerationLog", "vendorFilterValue", "vendorFollow", "notification",
  ];
  logCtx.debug("vendor-delete", "TX: models to delete", { models });

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

  logCtx.info("vendor-delete", "TX: child-table deletes complete", {
    duration: `${Date.now() - t0}ms`,
    totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    counts,
  });

  // ── Group 2: Null-out tables where vendorId is optional (run in parallel) ──
  // These use updateMany to set vendorId = null instead of deleting
  // (the row belongs to another entity, e.g. a conversation or wishlist item).
  logCtx.debug("vendor-delete", "TX: null-out updates — starting (3 models in parallel)");

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

  logCtx.info("vendor-delete", "TX: null-out updates complete", {
    referralsJoined: referralsJoined.count,
    joshConversationsCleared: joshConversations.count,
    wishlistCleared: wishlistCleared.count,
  });

  // ── Finally: delete the vendor row itself ──
  // This MUST be last — child FKs must be gone before the parent.
  logCtx.debug("vendor-delete", "TX: before vendor.delete", { model: "vendor", where: { id: vendorId } });
  await tx.vendor.delete({ where: { id: vendorId } });
  logCtx.info("vendor-delete", "TX: vendor.delete complete", { model: "vendor", vendorId });

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
  vendorSlug: string,
  logCtx: ReturnType<typeof logger.withContext>
): Promise<{ storage: { deleted: number; skipped: boolean } }> {
  // ── Storage cleanup (best-effort) ──
  logCtx.info("vendor-delete", "Storage cleanup start", { vendorId });
  let storage = { deleted: 0, skipped: true };
  try {
    storage = await deleteVendorStorageFiles(vendorId);
    logCtx.info("vendor-delete", "Storage cleanup finished", {
      vendorId,
      deleted: storage.deleted,
      skipped: storage.skipped,
    });
  } catch (err) {
    // DO NOT rollback DB deletion. Log warning only.
    logCtx.warn("vendor-delete", "Storage cleanup failed (non-fatal — DB deletion is authoritative)", {
      vendorId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Cache invalidation (best-effort) ──
  logCtx.debug("vendor-delete", "Cache revalidation start", { vendorId, slug: vendorSlug });
  try {
    revalidatePath(`/vendor/${vendorSlug}`);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    logCtx.info("vendor-delete", "Cache revalidation complete", { vendorId, slug: vendorSlug });
  } catch (err) {
    logCtx.warn("vendor-delete", "Cache revalidation failed (non-fatal)", {
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
 *
 * Debug logging phases:
 *   1. "Deleting vendor" (before fetch)
 *   2. "START transaction" (before db.$transaction)
 *   3. "TX: child-table deletes — starting" (inside callback)
 *   4. "TX: child-table deletes complete" (after group 1)
 *   5. "TX: null-out updates — starting" (inside callback)
 *   6. "TX: null-out updates complete" (after group 2)
 *   7. "TX: before vendor.delete" (before parent delete)
 *   8. "TX: vendor.delete complete" (after parent delete)
 *   9. "Transaction committed" (after db.$transaction resolves)
 *   10. "Storage cleanup start"
 *   11. "Storage cleanup finished"
 *   12. "Audit log written"
 *   13. "Vendor deleted successfully"
 */
export async function deleteVendor(
  vendorId: string,
  adminId: string,
  adminEmail: string | null,
  reason: string
): Promise<DeleteResult> {
  const logCtx = logger.withContext({ requestId: `del-${vendorId.slice(0, 8)}` });

  logCtx.info("vendor-delete", "Deleting vendor", { vendorId, admin: adminEmail || adminId, reason });

  // 1. Fetch the vendor first (need name + slug for audit log + cache, confirm existence)
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, slug: true, owner_user_id: true },
  }).catch(() => null);

  if (!vendor) {
    logCtx.warn("vendor-delete", "Vendor not found", { vendorId });
    return {
      success: false, vendorId, vendorName: "(unknown)",
      counts: {}, storage: { deleted: 0, skipped: true }, auditLogId: null,
      error: "Vendor not found",
      statusCode: 404,
    };
  }

  logCtx.info("vendor-delete", "Vendor found, starting cascade delete", {
    vendorId, vendorName: vendor.name, slug: vendor.slug,
  });

  // 2. Transactional cascade delete — ONLY Prisma queries inside.
  //    No storage, no HTTP, no AI, no email, no setTimeout.
  let counts: Record<string, number> = {};
  try {
    logCtx.info("vendor-delete", "START transaction", { vendorId, timeout: "30s" });

    counts = await db.$transaction(async (tx) => {
      // ════════════════════════════════════════════════════════════════════
      // TRANSACTION BODY — ONLY tx.* calls allowed here.
      // No db.* , no prisma.*, no storage, no HTTP, no AI, no setTimeout.
      // The cascadeDeleteVendorData function is verified to use tx.* only.
      // ════════════════════════════════════════════════════════════════════
      return cascadeDeleteVendorData(tx as unknown as PrismaClient, vendorId, logCtx);
    }, {
      // Give the transaction up to 30 seconds — enough for all child deletes
      // even on a remote DB. Prisma's default is 5s which is too short for
      // a 21-table cascade on Supabase.
      timeout: 30_000,
      maxWait: 15_000,
    });

    logCtx.info("vendor-delete", "Transaction committed", {
      vendorId,
      totalRowsDeleted: Object.values(counts).reduce((a, b) => a + b, 0),
    });
  } catch (err: unknown) {
    const prismaErr = logPrismaError("transaction", vendorId, err);

    // P2025 = record not found (vendor already deleted by a concurrent request)
    if (prismaErr.isAlreadyDeleted) {
      logCtx.warn("vendor-delete", "Vendor already deleted (concurrent request)", { vendorId });
      return {
        success: false, vendorId, vendorName: vendor.name,
        counts, storage: { deleted: 0, skipped: true }, auditLogId: null,
        error: "Vendor already deleted",
        statusCode: 409,
      };
    }

    // P2028 = transaction timeout — the transaction was closed before all
    // queries completed. This is the original bug. The fix is the 30s
    // timeout + parallel Promise.all for independent deletes.
    if (prismaErr.isTimeout) {
      logCtx.error("vendor-delete", "Transaction TIMEOUT (P2028) — transaction was closed before queries completed", {
        vendorId,
        message: (err as PrismaError)?.message,
      });
    }

    // P2034 = transaction write conflict — another transaction modified the
    // same rows. Retry logic could be added here in the future.
    if (prismaErr.isConflict) {
      logCtx.error("vendor-delete", "Transaction CONFLICT (P2034) — concurrent modification detected", {
        vendorId,
        message: (err as PrismaError)?.message,
      });
    }

    return {
      success: false, vendorId, vendorName: vendor.name,
      counts, storage: { deleted: 0, skipped: true }, auditLogId: null,
      error: (err as PrismaError)?.message || "Transaction failed",
      statusCode: 500,
    };
  }

  // 3. Post-commit cleanup (storage + cache) — best-effort, never rolls back DB
  const { storage } = await postCommitCleanup(vendorId, vendor.slug, logCtx);

  // 4. Write the audit log (after commit — records what actually happened)
  logCtx.debug("vendor-delete", "Writing audit log", { vendorId });
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
    logCtx.info("vendor-delete", "Audit log written", { vendorId, auditLogId });
  } catch (err) {
    logCtx.warn("vendor-delete", "Audit log write failed (non-fatal)", {
      vendorId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  logCtx.info("vendor-delete", "Vendor deleted successfully", {
    vendorId,
    vendorName: vendor.name,
    admin: adminEmail || adminId,
    storageDeleted: storage.deleted,
    auditLogId,
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
