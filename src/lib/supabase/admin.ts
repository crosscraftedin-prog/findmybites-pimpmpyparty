/**
 * Supabase admin client (service role).
 * Bypasses RLS — used only server-side for admin operations like
 * deleting a vendor's Storage files. Requires SUPABASE_SERVICE_ROLE_KEY.
 * Returns null if the key isn't configured (storage cleanup is skipped
 * gracefully — the DB deletion still succeeds).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isStorageAdminConfigured = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!isStorageAdminConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Delete all files under `vendor-uploads/{vendorId}/` in Supabase Storage.
 * Returns the count of deleted files (or null if storage isn't configured).
 */
export async function deleteVendorStorageFiles(vendorId: string): Promise<{ deleted: number; skipped: boolean }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { deleted: 0, skipped: true };

  try {
    // List all files under the vendor's prefix
    const { data: files, error: listError } = await admin
      .storage
      .from("vendor-uploads")
      .list(vendorId, { limit: 1000, offset: 0 });

    if (listError) {
      console.error("[storage] list error:", listError.message);
      return { deleted: 0, skipped: false };
    }

    if (!files || files.length === 0) return { deleted: 0, skipped: false };

    // Collect full paths (including subfolders like products/{productId}/…)
    const pathsToRemove: string[] = [];
    for (const entry of files) {
      if (entry.id) {
        // File entry
        pathsToRemove.push(`${vendorId}/${entry.name}`);
      } else {
        // Folder entry — list its contents recursively
        const { data: subFiles } = await admin
          .storage
          .from("vendor-uploads")
          .list(`${vendorId}/${entry.name}`, { limit: 1000 });
        if (subFiles) {
          for (const sf of subFiles) {
            pathsToRemove.push(`${vendorId}/${entry.name}/${sf.name}`);
          }
        }
      }
    }

    if (pathsToRemove.length === 0) return { deleted: 0, skipped: false };

    const { error: deleteError } = await admin
      .storage
      .from("vendor-uploads")
      .remove(pathsToRemove);

    if (deleteError) {
      console.error("[storage] delete error:", deleteError.message);
      return { deleted: 0, skipped: false };
    }

    return { deleted: pathsToRemove.length, skipped: false };
  } catch (err) {
    console.error("[storage] cleanup failed:", err);
    return { deleted: 0, skipped: false };
  }
}
