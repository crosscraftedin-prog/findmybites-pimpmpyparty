/**
 * Vendor Delete Service — transactional cascade deletion.
 * ───────────────────────────────────────────────────────────────────────────
 * Deletes a vendor and EVERYTHING connected to it inside a single DB
 * transaction, then cleans up Supabase Storage files and writes an
 * AdminAuditLog entry.
 *
 * Safety:
 *  • The entire DB cascade runs inside db.$transaction — if any step
 *    fails, the whole operation rolls back (no orphaned rows).
 *  • Storage cleanup is best-effort (runs AFTER the commit) so a storage
 *    failure never blocks the DB deletion.
 *  • The audit log is written AFTER the commit so it records what actually
 *    happened (and can't reference a rolled-back deletion).
 */
import { db } from "@/lib/db";
import { deleteVendorStorageFiles } from "@/lib/supabase/admin";

export interface DeleteResult {
  success: boolean;
  vendorId: string;
  vendorName: string;
  /** rows deleted per table (approx — counts from deleteMany) */
  counts: Record<string, number>;
  storage: { deleted: number; skipped: boolean };
  auditLogId: string | null;
  error?: string;
}

/**
 * Delete a single vendor + all related data.
 * `adminId` / `adminEmail` identify the admin (from the session).
 * `reason` is the admin's free-form justification.
 */
export async function deleteVendor(
  vendorId: string,
  adminId: string,
  adminEmail: string | null,
  reason: string
): Promise<DeleteResult> {
  // 1. Fetch the vendor first (need name for audit log, confirm existence)
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, slug: true, owner_user_id: true },
  });
  if (!vendor) {
    return {
      success: false, vendorId, vendorName: "(unknown)",
      counts: {}, storage: { deleted: 0, skipped: true }, auditLogId: null,
      error: "Vendor not found",
    };
  }

  const counts: Record<string, number> = {};

  // 2. Transactional cascade delete.
  try {
    await db.$transaction(async (tx) => {
      // ── Child tables with cascade FKs (explicit delete for counts) ──
      const r1 = await tx.review.deleteMany({ where: { vendorId } });
      counts.reviews = r1.count;

      const r2 = await tx.booking.deleteMany({ where: { vendorId } });
      counts.bookings = r2.count;

      const r3 = await tx.bookingV2.deleteMany({ where: { vendorId } });
      counts.bookingsV2 = r3.count;

      const r4 = await tx.product.deleteMany({ where: { vendorId } });
      counts.products = r4.count;

      const r5 = await tx.vendorAvailability.deleteMany({ where: { vendorId } });
      counts.availability = r5.count;

      const r6 = await tx.vendorSubscription.deleteMany({ where: { vendorId } });
      counts.subscriptions = r6.count;

      const r7 = await tx.paymentHistory.deleteMany({ where: { vendorId } });
      counts.payments = r7.count;

      const r8 = await tx.vendorAnalytics.deleteMany({ where: { vendorId } });
      counts.analytics = r8.count;

      const r9 = await tx.vendorAnalyticsDaily.deleteMany({ where: { vendorId } });
      counts.analyticsDaily = r9.count;

      const r10 = await tx.growthScore.deleteMany({ where: { vendorId } });
      counts.growthScores = r10.count;

      const r11 = await tx.marketingCampaign.deleteMany({ where: { vendorId } });
      counts.marketingCampaigns = r11.count;

      const r12 = await tx.emailCampaign.deleteMany({ where: { vendorId } });
      counts.emailCampaigns = r12.count;

      const r13 = await tx.reviewRequest.deleteMany({ where: { vendorId } });
      counts.reviewRequests = r13.count;

      const r14 = await tx.referral.deleteMany({ where: { referrerVendorId: vendorId } });
      counts.referralsMade = r14.count;

      const r15 = await tx.referral.updateMany({ where: { inviteeVendorId: vendorId }, data: { inviteeVendorId: null } });
      counts.referralsJoined = r15.count;

      const r16 = await tx.aiGenerationLog.deleteMany({ where: { vendorId } });
      counts.aiGenerationLogs = r16.count;

      const r17 = await tx.vendorFilterValue.deleteMany({ where: { vendorId } });
      counts.vendorFilterValues = r17.count;

      const r18 = await tx.vendorFollow.deleteMany({ where: { vendorId } });
      counts.vendorFollows = r18.count;

      // ── Tables with optional/non-FK vendorId (null them out) ──
      const r19 = await tx.joshConversation.updateMany({ where: { vendorId }, data: { vendorId: null } });
      counts.joshConversationsCleared = r19.count;

      const r20 = await tx.wishlist.updateMany({ where: { vendorId }, data: { vendorId: null } });
      counts.wishlistCleared = r20.count;

      const r21 = await tx.notification.deleteMany({ where: { recipientType: "vendor", recipientId: vendorId } });
      counts.notificationsDeleted = r21.count;

      // ── Finally, delete the vendor row itself ──
      await tx.vendor.delete({ where: { id: vendorId } });
    });
  } catch (err: any) {
    console.error("[vendor-delete] transaction failed:", err);
    return {
      success: false, vendorId, vendorName: vendor.name,
      counts, storage: { deleted: 0, skipped: true }, auditLogId: null,
      error: err.message || "Transaction failed",
    };
  }

  // 3. Best-effort Storage cleanup (after commit — never blocks the deletion)
  const storage = await deleteVendorStorageFiles(vendorId);

  // 4. Write the audit log (after commit)
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
    console.error("[vendor-delete] audit log failed (non-fatal):", err);
  }

  console.log(`[vendor-delete] Deleted ${vendor.name} (${vendorId}) by ${adminEmail || adminId}. Storage: ${storage.deleted} files.`);

  return { success: true, vendorId, vendorName: vendor.name, counts, storage, auditLogId };
}

/**
 * Bulk delete multiple vendors. Runs each deletion sequentially (each in its
 * own transaction) so a single failure doesn't roll back the others.
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
    console.error("[vendor-delete] bulk audit log failed:", err);
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
    console.error("[vendor-delete] cleanup audit log failed:", err);
  }

  return { results, preview, summary };
}
