import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/upload
 *
 * SINGLE PRODUCTION UPLOAD API.
 *
 * All image uploads in the application route through this endpoint via the
 * shared `uploadToApi()` helper in src/lib/uploads/upload-to-api.ts.
 *
 * ── Hardening Features (V2) ──
 *
 * 1. SECURITY
 *   - Rejects dangerous extensions: svg, exe, html, php, js, etc.
 *   - Rejects double extensions (image.jpg.exe)
 *   - Rejects path traversal (../, ..\, /, \, null bytes)
 *   - Validates MIME type matches extension
 *   - Enforces max request body size (10MB)
 *
 * 2. STRUCTURED LOGGING
 *   - userId, vendorId, filename, size, folder, duration, status
 *
 * 3. STORAGE
 *   - Uploads to Supabase Storage via service role REST API
 *   - Returns public URL
 *
 * 4. ERROR HANDLING
 *   - Always returns JSON (never HTML)
 *   - Proper HTTP status codes (400, 401, 413, 502, 503)
 */

// ── Validation constants ──────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_REQUEST_BODY_SIZE = 11 * 1024 * 1024; // 11MB (file + form overhead)
const BUCKET_NAME = "vendor-uploads";

// Dangerous extensions that must NEVER be allowed
const DANGEROUS_EXTENSIONS = [
  ".svg", ".svgz", ".exe", ".html", ".htm", ".php", ".js", ".jsx", ".ts",
  ".tsx", ".bat", ".cmd", ".sh", ".py", ".rb", ".pl", ".cgi", ".asp",
  ".aspx", ".jsp", ".sql", ".xml", ".zip", ".tar", ".gz", ".rar", ".7z",
];

// ── Helpers ───────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function hasDoubleExtension(filename: string): boolean {
  const matches = filename.match(/\./g);
  return matches !== null && matches.length > 1;
}

function hasPathTraversal(filename: string): boolean {
  return (
    filename.includes("../") ||
    filename.includes("..\\") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  );
}

function sanitizeFileName(name: string): string {
  // Keep only alphanumeric, dash, underscore, dot
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.replace(/-+/g, "-").toLowerCase();
}

/**
 * Comprehensive server-side file validation.
 * Returns an error message if invalid, null if valid.
 */
function validateFile(file: File): string | null {
  // ── Basic presence check ──
  if (!file || file.size === 0) {
    return "File is empty or missing.";
  }

  // ── Size check ──
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.`;
  }

  // ── MIME type check ──
  if (!file.type || !ACCEPTED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type || "unknown"}. Accepted: JPG, PNG, WebP, GIF.`;
  }

  // ── Extension checks ──
  const filename = file.name;
  const ext = getExtension(filename);

  if (!ext) {
    return "File has no extension.";
  }

  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return `Invalid file extension: ${ext}. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}.`;
  }

  // ── Dangerous extension check ──
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return `File type ${ext} is not allowed for security reasons.`;
  }

  // ── Double extension check ──
  if (hasDoubleExtension(filename)) {
    return "Double extensions are not allowed for security reasons.";
  }

  // ── Path traversal check ──
  if (hasPathTraversal(filename)) {
    return "Invalid filename.";
  }

  // ── MIME/extension mismatch check ──
  // e.g. a .exe file with MIME image/jpeg (fake MIME type)
  const extToMime: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  const expectedMime = extToMime[ext];
  if (expectedMime && expectedMime !== file.type) {
    return `File extension ${ext} does not match MIME type ${file.type}.`;
  }

  return null;
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

// ── POST route handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // ── 0. Check Content-Length to reject oversized requests early ──
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_REQUEST_BODY_SIZE) {
      logger.warn("upload", "Request body too large", {
        contentLength,
        max: MAX_REQUEST_BODY_SIZE,
      });
      return NextResponse.json(
        { error: `Request body too large (${(contentLength / 1024 / 1024).toFixed(1)}MB). Max: 10MB.` },
        { status: 413 }
      );
    }

    // ── 1. Authenticate via Supabase session ──
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    } catch {}
    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
          userEmail = session.user.email ?? null;
        }
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

    // ── 3. Validate file (security + type + size) ──
    const validationError = validateFile(file);
    if (validationError) {
      logger.warn("upload", "File validation failed", {
        userId,
        filename: file.name,
        size: file.size,
        type: file.type,
        error: validationError,
      });
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // ── 4. Resolve storage path ──
    const vendorId = await resolveVendorId(userId);
    const basePath = vendorId ?? `pending/${userId}`;
    const sanitized = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const filePath = `${basePath}/${folder}/${timestamp}-${sanitized}`;

    // ── 5. Upload to Supabase Storage ──
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      logger.error("upload", "Storage not configured", undefined, {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { error: "Storage not configured (missing SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 503 }
      );
    }

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
      const errorText = await uploadResponse.text().catch(() => "unknown");
      logger.error("upload", "Supabase storage error", undefined, {
        status: uploadResponse.status,
        error: errorText.slice(0, 500),
        filePath,
      });
      return NextResponse.json(
        { error: `Storage upload failed (${uploadResponse.status})` },
        { status: 502 }
      );
    }

    // ── 6. Construct the public URL ──
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    const durationMs = Date.now() - startTime;

    // ── 7. Structured logging ──
    logger.info("upload", "Upload succeeded", {
      userId,
      userEmail: userEmail ?? undefined,
      vendorId: vendorId ?? "pending",
      filename: file.name,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
      folder,
      type: file.type,
      durationMs,
      path: filePath,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error("upload", "Unexpected error", error, {
      durationMs,
      message: error.message,
    });
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Health check — confirms the upload endpoint is reachable.
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
    version: "2.0.0",
  });
}
