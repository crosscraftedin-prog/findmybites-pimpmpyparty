import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/upload
 * Upload an image to Supabase Storage (bucket: "vendor-images").
 * Returns the public URL of the uploaded file.
 *
 * This replaces the old local-file approach which doesn't work on Vercel
 * (read-only filesystem). Supabase Storage is persistent and CDN-backed.
 *
 * Required env vars:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * The bucket "vendor-images" must exist in Supabase Storage and be set to
 * public (so images are accessible without auth).
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

    // Use the server-side Supabase client (has the anon key, which has
    // storage write permissions if the bucket allows public uploads).
    const supabase = await createSupabaseServerClient();

    // Generate a unique filename
    const ext = EXT_BY_TYPE[type] ?? "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const fileName = `${timestamp}-${random}.${ext}`;
    const filePath = `uploads/${fileName}`;

    // Read file as ArrayBuffer and upload to Supabase Storage
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
