import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { windowMs: 60_000, max: 20 });
    if (limited) return limited;

    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: `Max ${MAX_BYTES / 1024 / 1024}MB.` }, { status: 413 });

    const type = file.type || "";
    if (!ALLOWED.has(type)) return NextResponse.json({ error: "Use JPG, PNG, WebP or GIF." }, { status: 415 });

    const ext = EXT_BY_TYPE[type] ?? "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage.from("vendor-images").upload(filePath, arrayBuffer, {
      contentType: type, cacheControl: "3600", upsert: false,
    });

    if (error) {
      console.error("[api/upload] Storage error:", error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("vendor-images").getPublicUrl(filePath);
    return NextResponse.json({ url: publicUrlData.publicUrl, size: file.size, type }, { status: 201 });
  } catch (err) {
    console.error("[api/upload] POST failed:", err);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
