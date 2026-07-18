import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * POST /api/upload
 *
 * SINGLE PRODUCTION UPLOAD API.
 *
 * All image uploads in the application route through this endpoint — both the
 * marketplace ImageUpload component and the dashboard ImageUpload/GalleryUpload
 * components call POST /api/upload.
 *
 * Architecture:
 *   - Client sends multipart/form-data with `file` (required) and `folder` (optional)
 *   - Server authenticates via Supabase session cookie
 *   - Server validates file type + size
 *   - Server resolves the storage path from the session:
 *       - Existing vendor → vendor-uploads/{vendorId}/{folder}/{timestamp}-{name}
 *       - First-time onboarding → vendor-uploads/pending/{userId}/{folder}/{timestamp}-{name}
 *   - Server uploads to Supabase Storage using the admin client (service role)
 *   - Server returns the public URL as JSON: { success: true, url: "..." }
 *
 * The client never calls Supabase Storage directly — this is the single source
 * of truth for auth, validation, storage path, and URL generation.
 *
 * Security:
 *   - Authentication is ALWAYS required (401 if no session)
 *   - File type is validated server-side (never trust client)
 *   - File size is validated server-side (max 10MB)
 *   - The storage path is resolved from the session — the client cannot
 *     influence which vendor's folder the file is uploaded to
 *
 * Request:
 *   Content-Type: multipart/form-data
 *   Body: file (File) + folder (string, optional — "logo" | "cover" | "gallery" | "package" | "free")
 *
 * Response:
 *   200: { success: true, url: "https://...supabase.co/storage/v1/object/public/vendor-uploads/..." }
 *   400: { error: "No file provided" | "Invalid file type" | "File too large" }
 *   401: { error: "Authentication required" }
 *   503: { error: "Storage not configured" }
 */

// ── Validation constants ──────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = "vendor-uploads";

// ── Helpers ───────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  // Keep only alphanumeric, dash, underscore, dot. Remove everything else.
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  // Collapse multiple dashes
  return cleaned.replace(/-+/g, "-").toLowerCase();
}

async function resolveVendorId(userId: string): Promise<string | null> {
  try {
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true },
    });
    return vendor?.id ?? null;
  } catch {
    return null;
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate via Supabase session ──
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {}
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) userId = session.user.id;
      } catch {}
    }
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // ── 2. Parse multipart form data ──
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "free";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // ── 3. Validate file type ──
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Accepted: JPG, PNG, WebP, GIF.` },
        { status: 400 }
      );
    }

    // ── 4. Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.` },
        { status: 400 }
      );
    }

    // ── 5. Resolve storage path ──
    // Existing vendor → vendor-uploads/{vendorId}/{folder}/{timestamp}-{name}
    // First-time onboarding → vendor-uploads/pending/{userId}/{folder}/{timestamp}-{name}
    const vendorId = await resolveVendorId(userId);
    const basePath = vendorId ?? `pending/${userId}`;
    const sanitized = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const filePath = `${basePath}/${folder}/${timestamp}-${sanitized}`;

    // ── 6. Upload to Supabase Storage ──
    // Use the admin client (service role) so we bypass RLS and can upload
    // from the server. The client's anon key doesn't have INSERT permission
    // on the storage.objects table for the vendor-uploads bucket — only the
    // service role can write.
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Storage not configured (missing SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 503 }
      );
    }

    // Convert File to ArrayBuffer for the Supabase REST API
    const arrayBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: arrayBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("[upload] Supabase storage error:", uploadResponse.status, errorText);
      return NextResponse.json(
        { error: `Storage upload failed (${uploadResponse.status})` },
        { status: 502 }
      );
    }

    // ── 7. Construct the public URL ──
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("[upload] Unexpected error:", error.message);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Health check — confirms the upload endpoint is reachable and configured.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/upload",
    methods: ["POST"],
    configured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  });
}
