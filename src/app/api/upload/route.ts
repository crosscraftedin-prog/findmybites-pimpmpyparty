import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/upload
 * Upload an image to Supabase Storage (bucket: "vendor-images").
 * Returns the public URL of the uploaded file.
 *
 * Security:
 * - Requires authenticated session (no anonymous uploads)
 * - Rate limited (20 uploads/min per IP)
 * - File type validation (JPEG, PNG, WebP, GIF only)
 * - File size limit (4 MB max)
 * - Filename sanitized + randomized (prevents path traversal)
 */
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  try {
    // Rate limit: max 20 uploads per minute per IP
    const limited = rateLimit(req, { windowMs: 60_000, max: 20 });
    if (limited) return limited;

    // Auth check — only signed-in users can upload images
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required to upload images." },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded. Use field name 'file'." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_BYTES / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    const type = file.type || "";
    if (!ALLOWED.has(type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${type || "unknown"}. Use JPG, PNG, WebP or GIF.` },
        { status: 415 }
      );
    }

    // Generate a unique filename (sanitized + randomized to prevent path traversal)
    const ext = EXT_BY_TYPE[type] ?? "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const fileName = `${timestamp}-${random}.${ext}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from("vendor-images")
      .upload(filePath, arrayBuffer, {
        contentType: type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[api/upload] Supabase Storage error:", error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("vendor-images")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json(
      { url: publicUrl, size: file.size, type },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/upload] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 }
    );
  }
}
