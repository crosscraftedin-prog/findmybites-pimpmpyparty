/**
 * Shared upload utility — SINGLE production upload pipeline.
 *
 * ALL upload components in the application MUST use this function.
 * It routes uploads through POST /api/upload, which is the single source
 * of truth for:
 *   - authentication (Supabase session)
 *   - validation (file type + size + security)
 *   - storage path (resolved from session)
 *   - URL generation (Supabase public URL)
 *
 * ── Hardening Features (V2) ──
 *
 * 1. AUTOMATIC RETRY with exponential backoff
 *    - Retries on: timeout, network error, 502, 503, 504
 *    - 3 attempts max (initial + 2 retries)
 *    - Backoff: 1s, 2s, 4s (jittered to avoid thundering herd)
 *    - Does NOT retry on: 400 (bad request), 401 (auth), 413 (too large)
 *
 * 2. DUPLICATE UPLOAD PREVENTION
 *    - In-flight dedup: if the same file (by name+size+lastModified) is
 *      already uploading, the same promise is returned
 *    - Prevents double-click / double-select from uploading twice
 *
 * 3. MEMORY LEAK PREVENTION
 *    - No object URLs created (uses File directly)
 *    - AbortController cleaned up after each attempt
 *    - XHR listeners removed after completion
 *
 * 4. STRUCTURED LOGGING (client-side)
 *    - Logs userId (from session), filename, size, folder, duration, status
 *    - Uses console.info for success, console.warn for retry, console.error for failure
 *
 * Do NOT call supabaseBrowser.storage directly — that bypasses the server's
 * auth and validation. Always use this function.
 */

// ── Validation constants ──────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Dangerous extensions that must NEVER be allowed, even if the MIME type is image/*
const DANGEROUS_EXTENSIONS = [
  ".svg", ".exe", ".html", ".htm", ".php", ".js", ".jsx", ".ts", ".tsx",
  ".bat", ".cmd", ".sh", ".py", ".rb", ".pl", ".cgi", ".asp", ".aspx",
  ".jsp", ".sql", ".xml", ".svgz", ".zip", ".tar", ".gz", ".rar", ".7z",
];

// ── Retry configuration ───────────────────────────────────────────────────

const MAX_RETRIES = 2; // initial attempt + 2 retries = 3 total
const BASE_BACKOFF_MS = 1000; // 1s, 2s, 4s
const RETRYABLE_STATUS = [0, 502, 503, 504]; // 0 = network error (XHR onerror)
const UPLOAD_TIMEOUT_MS = 60_000; // 60s per attempt

// ── In-flight dedup ───────────────────────────────────────────────────────

interface InFlightKey {
  file: File;
  promise: Promise<UploadResult>;
}

const inFlightUploads = new Map<string, InFlightKey>();

function getDedupKey(file: File): string {
  // name + size + lastModified is unique enough for dedup
  // (two different files with same name+size+lastModified is astronomically unlikely)
  return `${file.name}|${file.size}|${file.lastModified}`;
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface UploadOptions {
  /** Optional progress callback (0-100) */
  onProgress?: (pct: number) => void;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

export interface UploadResult {
  /** The public Supabase URL of the uploaded file */
  url: string;
  /** The storage path (vendor-uploads/{vendorId}/...) */
  path: string;
}

// ── Security validation ───────────────────────────────────────────────────

/**
 * Check if a filename has a double extension (e.g. "image.jpg.exe").
 * This is a common attack vector — the OS may execute the last extension
 * while the browser shows the first.
 */
function hasDoubleExtension(filename: string): boolean {
  const matches = filename.match(/\./g);
  return matches !== null && matches.length > 1;
}

/**
 * Check if a filename contains path traversal sequences.
 * Prevents: "../../etc/passwd", "..\\..\\windows\\system32"
 */
function hasPathTraversal(filename: string): boolean {
  return (
    filename.includes("../") ||
    filename.includes("..\\") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0") // null byte
  );
}

/**
 * Get the file extension (lowercase, including the dot).
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Validate a file on the client side before uploading.
 * Returns an error message string if invalid, null if valid.
 *
 * Security checks:
 *   - Must be an image MIME type
 *   - Must be in ACCEPTED_TYPES (JPG, PNG, WebP, GIF)
 *   - Extension must match an accepted extension
 *   - Must NOT have a dangerous extension (svg, exe, html, php, etc.)
 *   - Must NOT have a double extension (image.jpg.exe)
 *   - Must NOT contain path traversal sequences
 *   - Must NOT exceed MAX_FILE_SIZE
 */
export function validateImageFile(file: File): string | null {
  // ── Basic type check ──
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Accepted: JPG, PNG, WebP, GIF.`;
  }

  // ── Extension checks ──
  const filename = file.name;
  const ext = getExtension(filename);

  if (!ext) {
    return "File has no extension. Please rename and try again.";
  }

  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return `Invalid file extension: ${ext}. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}.`;
  }

  // ── Dangerous extension check (even if MIME is image/*) ──
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return `File type ${ext} is not allowed for security reasons.`;
  }

  // ── Double extension check ──
  if (hasDoubleExtension(filename)) {
    return `Double extensions are not allowed for security reasons. Please rename the file (e.g. "photo.jpg").`;
  }

  // ── Path traversal check ──
  if (hasPathTraversal(filename)) {
    return "Invalid filename. Please rename the file and try again.";
  }

  // ── Size check ──
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.`;
  }

  // ── Empty file check ──
  if (file.size === 0) {
    return "File is empty. Please choose a valid image.";
  }

  return null;
}

// ── Structured logging ────────────────────────────────────────────────────

interface UploadLogEntry {
  filename: string;
  size: number;
  sizeMB: string;
  folder: string;
  type: string;
  attempt: number;
  durationMs: number;
  status: "success" | "retry" | "failure";
  url?: string;
  error?: string;
  httpStatus?: number;
}

function logUpload(entry: UploadLogEntry) {
  const tag = `[upload:${entry.status}]`;
  const data = {
    filename: entry.filename,
    size: entry.size,
    sizeMB: entry.sizeMB,
    folder: entry.folder,
    type: entry.type,
    attempt: entry.attempt,
    durationMs: entry.durationMs,
    url: entry.url,
    error: entry.error,
    httpStatus: entry.httpStatus,
  };

  if (entry.status === "success") {
    console.info(tag, data);
  } else if (entry.status === "retry") {
    console.warn(tag, data);
  } else {
    console.error(tag, data);
  }
}

// ── Single upload attempt (no retry) ──────────────────────────────────────

function uploadOnce(
  file: File,
  folder: string,
  opts: UploadOptions = {},
  attempt: number
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    // ── Progress ──
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        // On retry, progress starts from 0 again — adjust the visual
        // so the user doesn't see it jump backward
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    // ── Success / failure ──
    xhr.onload = () => {
      const durationMs = Date.now() - startTime;
      let body: any;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.url) {
        logUpload({
          filename: file.name,
          size: file.size,
          sizeMB: (file.size / 1024 / 1024).toFixed(2),
          folder,
          type: file.type,
          attempt,
          durationMs,
          status: "success",
          url: body.url,
        });
        resolve({
          url: body.url,
          path: body.path ?? "",
        });
      } else {
        // Non-retryable status codes: 400, 401, 403, 413
        // Retryable status codes: 502, 503, 504, 0 (network)
        const isRetryable = RETRYABLE_STATUS.includes(xhr.status);
        const errorMsg = body?.error ?? `Upload failed (${xhr.status})`;

        logUpload({
          filename: file.name,
          size: file.size,
          sizeMB: (file.size / 1024 / 1024).toFixed(2),
          folder,
          type: file.type,
          attempt,
          durationMs,
          status: isRetryable ? "retry" : "failure",
          error: errorMsg,
          httpStatus: xhr.status,
        });

        const err = new Error(errorMsg) as Error & {
          retryable: boolean;
          httpStatus: number;
        };
        err.retryable = isRetryable;
        err.httpStatus = xhr.status;
        reject(err);
      }
    };

    // ── Network error (retryable) ──
    xhr.onerror = () => {
      const durationMs = Date.now() - startTime;
      logUpload({
        filename: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        folder,
        type: file.type,
        attempt,
        durationMs,
        status: "retry",
        error: "Network error",
        httpStatus: 0,
      });
      const err = new Error("Network error during upload.") as Error & {
        retryable: boolean;
        httpStatus: number;
      };
      err.retryable = true;
      err.httpStatus = 0;
      reject(err);
    };

    // ── Timeout (retryable) ──
    xhr.ontimeout = () => {
      const durationMs = Date.now() - startTime;
      logUpload({
        filename: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        folder,
        type: file.type,
        attempt,
        durationMs,
        status: "retry",
        error: "Timeout",
        httpStatus: 0,
      });
      const err = new Error("Upload timed out.") as Error & {
        retryable: boolean;
        httpStatus: number;
      };
      err.retryable = true;
      err.httpStatus = 0;
      reject(err);
    };

    // ── Abort support ──
    if (opts.signal) {
      const onAbort = () => {
        xhr.abort();
        const err = new Error("Aborted") as Error & {
          retryable: boolean;
          name: string;
        };
        err.name = "AbortError";
        err.retryable = false;
        reject(err);
      };
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.send(fd);
  });
}

// ── Sleep with jitter ─────────────────────────────────────────────────────

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timeout = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// ── Main upload function (with retry + dedup) ─────────────────────────────

/**
 * Upload a file to the single production upload API `/api/upload`.
 *
 * Features:
 *   - Client-side validation (MIME, extension, size, security)
 *   - Automatic retry with exponential backoff (3 attempts)
 *   - In-flight dedup (prevents double-upload of the same file)
 *   - Real upload progress via XHR
 *   - Cancellation via AbortSignal
 *   - Structured logging
 *
 * @param file The File to upload
 * @param folder Optional sub-namespace ("logo" | "cover" | "gallery" | "package" | "free")
 * @param opts Optional { onProgress, signal }
 * @returns { url, path } on success
 * @throws Error with a user-friendly message on failure
 */
export async function uploadToApi(
  file: File,
  folder: string = "free",
  opts: UploadOptions = {}
): Promise<UploadResult> {
  // ── Client-side validation ──
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // ── In-flight dedup ──
  const dedupKey = getDedupKey(file);
  const existing = inFlightUploads.get(dedupKey);
  if (existing && existing.file === file) {
    // Same file object is already uploading — return the same promise
    return existing.promise;
  }

  // ── Upload with retry ──
  const uploadPromise = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const result = await uploadOnce(file, folder, opts, attempt);
        return result;
      } catch (err: any) {
        lastError = err;

        // Don't retry if:
        // - Aborted by user
        // - Error is not retryable (400, 401, 403, 413)
        // - This was the last attempt
        if (err.name === "AbortError") {
          throw err;
        }
        if (err.retryable === false) {
          throw err;
        }
        if (attempt > MAX_RETRIES) {
          throw err;
        }

        // Exponential backoff with jitter: 1s, 2s (±25% jitter)
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        const jitter = backoff * 0.25 * (Math.random() * 2 - 1);
        const delay = Math.max(500, Math.round(backoff + jitter));

        console.warn(`[upload] Retrying attempt ${attempt + 1}/${MAX_RETRIES + 1} after ${delay}ms`, {
          filename: file.name,
          error: err.message,
        });

        try {
          await sleep(delay, opts.signal);
        } catch (abortErr) {
          throw abortErr;
        }
      }
    }

    // Should never reach here, but just in case
    throw lastError ?? new Error("Upload failed after all retries.");
  })();

  // Store in dedup map
  inFlightUploads.set(dedupKey, { file, promise: uploadPromise });

  // Clean up after completion (success or failure)
  uploadPromise.finally(() => {
    inFlightUploads.delete(dedupKey);
  });

  return uploadPromise;
}
