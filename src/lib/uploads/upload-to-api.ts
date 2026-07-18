/**
 * Shared upload utility — single production upload pipeline.
 *
 * ALL upload components in the application MUST use this function.
 * It routes uploads through POST /api/upload, which is the single source
 * of truth for:
 *   - authentication (Supabase session)
 *   - validation (file type + size)
 *   - storage path (resolved from session)
 *   - URL generation (Supabase public URL)
 *
 * Components that call fetch("/api/upload") directly should be refactored
 * to use this function instead, so they get:
 *   - consistent error handling
 *   - file type validation on the client (fast feedback)
 *   - file size validation on the client (fast feedback)
 *   - optional upload progress via XHR
 *
 * Do NOT call supabaseBrowser.storage directly — that bypasses the server's
 * auth and validation. Always use this function.
 */

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

/**
 * Validate a file on the client side before uploading.
 * Returns an error message string if invalid, null if valid.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Accepted: JPG, PNG, WebP, GIF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB.`;
  }
  return null;
}

/**
 * Upload a file to the single production upload API `/api/upload`.
 *
 * Uses XHR for real upload progress + cancellation support.
 * Resolves with the public storage URL returned by the server.
 *
 * @param file The File to upload
 * @param folder Optional sub-namespace ("logo" | "cover" | "gallery" | "package" | "free")
 * @param opts Optional { onProgress, signal }
 * @returns { url, path } on success
 * @throws Error with a user-friendly message on failure
 */
export function uploadToApi(
  file: File,
  folder: string = "free",
  opts: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Client-side validation (fast feedback — doesn't wait for server)
    const validationError = validateImageFile(file);
    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          success?: boolean;
          url?: string;
          path?: string;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && body.url) {
          resolve({
            url: body.url,
            path: body.path ?? "",
          });
        } else {
          reject(new Error(body.error ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        console.error(
          "[uploadToApi] Non-JSON response:",
          xhr.status,
          xhr.responseText?.slice(0, 200)
        );
        reject(new Error("Upload failed: invalid server response."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.ontimeout = () => reject(new Error("Upload timed out."));

    if (opts.signal) {
      opts.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    xhr.send(fd);
  });
}
