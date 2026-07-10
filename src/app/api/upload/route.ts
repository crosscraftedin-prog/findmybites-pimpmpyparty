/**
 * POST /api/upload
 * ───────────────────────────────────────────────────────────────────────────
 * Server-side image upload to Supabase Storage.
 *
 * Accepts: multipart/form-data with a "file" field (image only)
 * Returns: { url: string } on success
 *          { error: string } on failure (ALWAYS JSON, never HTML)
 *
 * Security:
 *   - Validates file type (JPG, PNG, WebP, GIF only)
 *   - Validates file size (max 5MB)
 *   - Uses the Supabase admin client (service role key) for server-side upload
 *   - Generates a secure random filename (no user-supplied filenames in path)
 *   - Requires authentication (vendor or admin)
 *
 * Storage path: vendor-uploads/{vendorId}/{folder}/{timestamp-random}.ext
 *   - vendorId is resolved from the session (not trusted from client)
 *   - folder defaults to "misc" if not provided
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin, isStorageAdminConfigured } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = "vendor-uploads";

function secureFilename(ext: string): string {
  const ts = Date.now().toString(36);
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ts}-${rand}.${ext}`;
}

// Force dynamic, nodejs runtime — required for FormData parsing on Vercel
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // ── 1. Parse FormData ──
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "misc";

    if (!file || !(file instanceof File)) {
      logger.warn("upload", "No file provided in FormData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    logger.info("upload", "Upload request received", {
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
      folder,
    });

    // ── 2. Validate file type ──
    if (!ACCEPTED_TYPES.includes(file.type)) {
      logger.warn("upload", "Invalid file type", { contentType: file.type });
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Accepted: JPG, PNG, WebP, GIF.` },
        { status: 400 }
      );
    }

    // ── 3. Validate file size ──
    if (file.size > MAX_SIZE_BYTES) {
      logger.warn("upload", "File too large", { fileSize: file.size, max: MAX_SIZE_BYTES });
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(MAX_SIZE_BYTES / 1024 / 1024)}MB.` },
        { status: 400 }
      );
    }

    // ── 4. Resolve vendor ID from session (never trust client) ──
    // SECURITY: Require authentication — anonymous uploads are NOT allowed.
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {}

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to upload files." },
        { status: 401 }
      );
    }

    let vendorId: string;
    try {
      const vendor = await db.vendor.findFirst({
        where: { owner_user_id: userId },
        select: { id: true },
      }).catch(() => null);
      if (!vendor) {
        return NextResponse.json(
          { error: "No vendor listing found. Complete your vendor profile first." },
          { status: 403 }
        );
      }
      vendorId = vendor.id;
    } catch {
      return NextResponse.json(
        { error: "Failed to verify vendor account." },
        { status: 500 }
      );
    }

    // ── 5. Check Supabase Storage is configured ──
    if (!isStorageAdminConfigured) {
      logger.error("upload", "Supabase Storage not configured", {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { error: "Storage is not configured. Contact support." },
        { status: 503 }
      );
    }

    // ── 6. Upload to Supabase Storage ──
    const admin = getSupabaseAdmin()!;
    const ext = file.type.split("/")[1] || "jpg";
    const fileName = secureFilename(ext);
    const path = `${vendorId}/${folder}/${fileName}`;

    logger.info("upload", "Uploading to Supabase Storage", {
      bucket: BUCKET_NAME,
      path,
      contentType: file.type,
    });

    const { data: uploadData, error: uploadError } = await admin
      .storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error("upload", "Supabase Storage upload failed", {
        error: uploadError.message,
        code: uploadError.name,
        path,
      });
      return NextResponse.json(
        { error: `Storage error: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ── 7. Get public URL ──
    const { data: urlData } = admin
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    logger.info("upload", "Upload successful", {
      path: uploadData.path,
      publicUrl: urlData.publicUrl,
      duration: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json({ success: true, url: urlData.publicUrl });

  } catch (err: any) {
    logger.error("upload", "Unexpected upload failure", {
      error: err instanceof Error ? err.message : String(err),
      stack: err?.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
