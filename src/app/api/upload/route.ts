import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/upload
 *
 * Uploads an image to Supabase Storage and returns the public URL.
 * Used by the ImageUpload component for vendor banner/logo uploads.
 *
 * Accepts: JPG, PNG, WebP, GIF (max 5MB)
 * Returns: { url: string }
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Please upload an image (JPG, PNG, WebP, or GIF)" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 }
      );
    }

    // Get Supabase config from env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      );
    }

    // Create Supabase admin client (service role key bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("vendor-uploads")
      .upload(fileName, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[api/upload] Supabase upload error:", error.message);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("vendor-uploads")
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to get public URL" },
        { status: 500 }
      );
    }

    console.log("[api/upload] Upload successful:", publicUrlData.publicUrl);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error: any) {
    console.error("[api/upload] Error:", error.message);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
