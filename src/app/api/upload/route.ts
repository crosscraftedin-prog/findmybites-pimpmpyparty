import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/upload
 *
 * Handles image uploads for vendor banners, logos, gallery photos.
 * Two strategies:
 * 1. Supabase Storage (if configured with "vendor-uploads" bucket)
 * 2. Local filesystem fallback (saves to /public/uploads/)
 *
 * Auth required: must be signed in.
 * Max 4MB, images only (jpg/png/webp).
 */

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WebP allowed." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 4MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Try Supabase Storage first
    try {
      const filePath = `${session.user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("vendor-uploads")
        .upload(filePath, file, { contentType: file.type, cacheControl: "3600", upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("vendor-uploads").getPublicUrl(filePath);
        if (urlData.publicUrl) {
          return NextResponse.json({ url: urlData.publicUrl });
        }
      }
      // If Supabase fails, fall through to local storage
    } catch {
      // Fall through to local storage
    }

    // Fallback: save to local filesystem /public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const localPath = path.join(uploadDir, fileName);
    await writeFile(localPath, buffer);

    const publicUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[api/upload] POST failed:", err);
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${errMsg}` }, { status: 500 });
  }
}
