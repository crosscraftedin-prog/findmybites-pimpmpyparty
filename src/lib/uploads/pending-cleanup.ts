/**
 * Pending-uploads cleanup service.
 * ─────────────────────────────────────────────────────────────────────────
 * Background: first-time vendor onboarding uploads images BEFORE the vendor
 * row exists. The /api/upload route namespaces those under
 * `vendor-uploads/pending/{userId}/...` (see src/app/api/upload/route.ts).
 *
 * Most of those files become the vendor's heroImage/avatarImage/gallery once
 * the vendor is created (the public URL is stored verbatim in the DB). Some,
 * however, are genuine orphans — the user uploaded a logo, abandoned the
 * form, and never created the vendor.
 *
 * This service deletes orphaned pending folders older than `MAX_AGE_DAYS`,
 * while NEVER deleting a pending folder whose files are still referenced by
 * a vendor row (heroImage / avatarImage / gallery / product images).
 *
 * It is invoked by the cron-ready route:
 *   GET /api/uploads/cleanup-pending  (protected by CRON_SECRET)
 *
 * It reuses the existing Supabase admin client (getSupabaseAdmin) — it does
 * NOT create a new upload pipeline and does NOT touch /api/upload.
 */
import { getSupabaseAdmin, isStorageAdminConfigured } from "@/lib/supabase/admin";
import { db } from "@/lib/db";

const BUCKET_NAME = "vendor-uploads";
const PENDING_PREFIX = "pending";
export const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export interface PendingCleanupResult {
  scanned: number;
  deleted: number;
  keptReferenced: number;
  keptRecent: number;
  errors: string[];
  skipped: boolean;
}

/**
 * Walk the `pending/` prefix in storage and collect every file path with its
 * metadata (so we can age-check it). Supabase Storage `.list()` is not
 * recursive, so we walk one level: pending/{userId}/{folder}/{file}.
 */
async function listPendingFiles(): Promise<
  { path: string; userId: string; updatedAt: string }[]
> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const out: { path: string; userId: string; updatedAt: string }[] = [];

  // Level 1: pending/{userId}
  const { data: userFolders, error: e1 } = await admin
    .storage
    .from(BUCKET_NAME)
    .list(PENDING_PREFIX, { limit: 1000, offset: 0 });

  if (e1) throw new Error(`list pending/: ${e1.message}`);
  if (!userFolders || userFolders.length === 0) return out;

  for (const userFolder of userFolders) {
    // Skip system metadata files (Supabase sometimes adds .emptyFolderPlaceholder)
    if (userFolder.name.startsWith(".")) continue;
    const userId = userFolder.name;
    const userPrefix = `${PENDING_PREFIX}/${userId}`;

    // Level 2: pending/{userId}/{folder}
    const { data: subFolders, error: e2 } = await admin
      .storage
      .from(BUCKET_NAME)
      .list(userPrefix, { limit: 1000, offset: 0 });

    if (e2) {
      // Non-fatal — skip this user folder but keep going
      console.warn(`[pending-cleanup] list ${userPrefix} failed: ${e2.message}`);
      continue;
    }
    if (!subFolders) continue;

    for (const sub of subFolders) {
      if (sub.name.startsWith(".")) continue;
      const subPrefix = `${userPrefix}/${sub.name}`;

      if (sub.id) {
        // It's a file directly under pending/{userId}/
        out.push({
          path: `${userPrefix}/${sub.name}`,
          userId,
          updatedAt: sub.updated_at ?? sub.created_at ?? "",
        });
      } else {
        // It's a folder — list its files
        const { data: files, error: e3 } = await admin
          .storage
          .from(BUCKET_NAME)
          .list(subPrefix, { limit: 1000, offset: 0 });

        if (e3) {
          console.warn(`[pending-cleanup] list ${subPrefix} failed: ${e3.message}`);
          continue;
        }
        if (!files) continue;

        for (const f of files) {
          if (f.name.startsWith(".")) continue;
          out.push({
            path: `${subPrefix}/${f.name}`,
            userId,
            updatedAt: f.updated_at ?? f.created_at ?? "",
          });
        }
      }
    }
  }

  return out;
}

/**
 * Build the set of pending/{userId}/ prefixes that are STILL referenced by a
 * vendor row. We never delete files for these users — they're in active use.
 *
 * A vendor references a pending upload when any of its image columns contain
 * a URL with `/pending/{userId}/` in the path. We check the image-bearing
 * columns: heroImage, avatarImage, gallery (JSON string of URLs) on Vendor,
 * and images (JSON string of URLs) on Product.
 *
 * We use Prisma's typed findMany with `contains` filters (no raw SQL) so this
 * works regardless of the underlying table-name casing.
 */
async function getReferencedPendingUserIds(): Promise<Set<string>> {
  const referenced = new Set<string>();

  // Vendors whose heroImage / avatarImage / gallery reference a pending upload.
  const vendors = await db.vendor.findMany({
    where: {
      OR: [
        { heroImage: { contains: "pending/" } },
        { avatarImage: { contains: "pending/" } },
        { gallery: { contains: "pending/" } },
      ],
    },
    select: { heroImage: true, avatarImage: true, gallery: true },
  });

  for (const v of vendors) {
    // Concatenate all image-bearing columns and extract every pending/{userId}/
    const combined = `${v.heroImage ?? ""} ${v.avatarImage ?? ""} ${v.gallery ?? ""}`;
    const matches = combined.matchAll(/\/pending\/([^/"]+)\//g);
    for (const m of matches) referenced.add(m[1]);
  }

  // Product images (stored as a JSON string array in Product.images)
  try {
    const products = await db.product.findMany({
      where: { images: { contains: "pending/" } },
      select: { images: true },
    });
    for (const p of products) {
      if (!p.images) continue;
      const matches = p.images.matchAll(/\/pending\/([^/"]+)\//g);
      for (const m of matches) referenced.add(m[1]);
    }
  } catch (err) {
    console.warn("[pending-cleanup] product images scan failed (non-fatal):", err);
  }

  // Message attachments (JSON string array in Message.attachments)
  try {
    const messages = await db.message.findMany({
      where: { attachments: { contains: "pending/" } },
      select: { attachments: true },
    });
    for (const m of messages) {
      if (!m.attachments) continue;
      const matches = m.attachments.matchAll(/\/pending\/([^/"]+)\//g);
      for (const match of matches) referenced.add(match[1]);
    }
  } catch (err) {
    console.warn("[pending-cleanup] message attachments scan failed (non-fatal):", err);
  }

  return referenced;
}

/**
 * Delete orphaned pending uploads. A pending file is deletable when:
 *   1. Its userId is NOT in the referenced set (no vendor/product uses it), AND
 *   2. It is older than MAX_AGE_DAYS.
 *
 * Files for a referenced user are kept entirely (we don't partially delete a
 * user's pending folder — if any file is in use, we keep the whole folder to
 * avoid a race where a vendor is created mid-cleanup).
 */
export async function cleanupPendingUploads(): Promise<PendingCleanupResult> {
  if (!isStorageAdminConfigured) {
    return {
      scanned: 0,
      deleted: 0,
      keptReferenced: 0,
      keptRecent: 0,
      errors: ["Supabase Storage admin not configured — skipping cleanup."],
      skipped: true,
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      scanned: 0,
      deleted: 0,
      keptReferenced: 0,
      keptRecent: 0,
      errors: ["Supabase admin client unavailable — skipping cleanup."],
      skipped: true,
    };
  }

  const result: PendingCleanupResult = {
    scanned: 0,
    deleted: 0,
    keptReferenced: 0,
    keptRecent: 0,
    errors: [],
    skipped: false,
  };

  let files: { path: string; userId: string; updatedAt: string }[];
  try {
    files = await listPendingFiles();
  } catch (err: any) {
    result.errors.push(`Failed to list pending files: ${err.message}`);
    return result;
  }

  result.scanned = files.length;
  if (files.length === 0) return result;

  // Determine which users still have a vendor/product referencing their pending folder
  let referencedUserIds: Set<string>;
  try {
    referencedUserIds = await getReferencedPendingUserIds();
  } catch (err: any) {
    // If we can't verify references, FAIL SAFE — delete nothing.
    result.errors.push(
      `Failed to verify referenced users (fail-safe: nothing deleted): ${err.message}`
    );
    result.keptReferenced = files.length;
    return result;
  }

  const now = Date.now();
  const toDelete: string[] = [];

  for (const f of files) {
    // Keep everything for a referenced user — never risk breaking a live vendor.
    if (referencedUserIds.has(f.userId)) {
      result.keptReferenced++;
      continue;
    }

    // Age check: only delete files older than MAX_AGE_DAYS.
    // Supabase returns updated_at as an ISO string. If missing, be conservative
    // and treat as recent (keep) rather than deleting.
    if (!f.updatedAt) {
      result.keptRecent++;
      continue;
    }
    const ts = Date.parse(f.updatedAt);
    if (Number.isNaN(ts)) {
      result.keptRecent++;
      continue;
    }
    if (now - ts < MAX_AGE_MS) {
      result.keptRecent++;
      continue;
    }

    toDelete.push(f.path);
  }

  if (toDelete.length === 0) return result;

  // Batch delete (Supabase .remove accepts an array of paths)
  try {
    const { error: deleteError } = await admin
      .storage
      .from(BUCKET_NAME)
      .remove(toDelete);

    if (deleteError) {
      result.errors.push(`Storage delete failed: ${deleteError.message}`);
    } else {
      result.deleted = toDelete.length;
    }
  } catch (err: any) {
    result.errors.push(`Storage delete threw: ${err.message}`);
  }

  return result;
}
