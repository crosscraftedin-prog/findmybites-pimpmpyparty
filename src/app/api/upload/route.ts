import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * POST /api/upload
 * Accepts a single multipart image upload (field name "file") and saves it to
 * `public/uploads/`. Returns the served URL so the client can store it on the
 * vendor (logo / banner).
 *
 * Validation:
 *   - content-type must be an image (jpeg/png/webp/gif)
 *   - max 4 MB
 *   - filename is randomized (hash) to avoid collisions & path traversal
 *
 * No external deps — uses the Web `Request.formData()` API available in Next 16.
 */
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
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
        {
          error: `Unsupported file type: ${type || "unknown"}. Use JPG, PNG, WebP or GIF.`,
        },
        { status: 415 }
      );
    }

    // Ensure the uploads directory exists.
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Random, collision-proof filename. No user-supplied name is trusted.
    const buf = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
    const ext = EXT_BY_TYPE[type] ?? "bin";
    const name = `${Date.now()}-${hash}.${ext}`;
    const fullPath = path.join(uploadDir, name);

    await writeFile(fullPath, buf);

    return NextResponse.json(
      { url: `/uploads/${name}`, size: buf.length, type },
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
