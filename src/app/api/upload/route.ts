import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/upload
 *
 * Handles image uploads for vendor banners, logos, gallery photos.
 * Two strategies:
 * 1. Supabase Storage (if "vendor-uploads" bucket exists + is public)
 * 2. Local filesystem fallback (saves to /public/uploads/)
 *
 * Auth required: must be signed in.
 * Max 5MB, images only (jpg/png/webp/gif).
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    // Auth check — must be signed in to upload
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user) {
      // Fallback to getSession
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Upload failed: not authenticated. Please sign in and try again." },
          { status: 401 }
        );
      }
      var userId = session.user.id;
    } else {
      var userId = user.id;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Upload failed: no file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Upload failed: invalid file type (${file.type}). Only JPG, PNG, WebP, GIF allowed.` },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Upload failed: file too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` },
        { status: 400 }
      );
    }

    // Generate unique filename to avoid conflicts
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Try Supabase Storage first
    try {
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("vendor-uploads")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (!uploadError) {
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("vendor-uploads")
          .getPublicUrl(filePath);

        if (urlData.publicUrl) {
          return NextResponse.json({ url: urlData.publicUrl });
        }
      }

      // If bucket doesn't exist, log specific error
      if (uploadError?.message?.includes("not found") || uploadError?.message?.includes("Bucket")) {
        console.error("[api/upload] Supabase bucket 'vendor-uploads' not found. Falling back to local storage.");
      } else {
        console.error("[api/upload] Supabase upload error:", uploadError?.message);
      }
      // Fall through to local storage
    } catch (supabaseErr) {
      console.error("[api/upload] Supabase storage failed:", supabaseErr);
      // Fall through to local storage
    }

    // Fallback: save to local filesystem /public/uploads/
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const localPath = path.join(uploadDir, fileName);
      await writeFile(localPath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({ url: publicUrl });
    } catch (localErr) {
      console.error("[api/upload] Local storage failed:", localErr);
      return NextResponse.json(
        { error: "Upload failed: could not save file. Please try again." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[api/upload] POST failed:", err);
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Upload failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
