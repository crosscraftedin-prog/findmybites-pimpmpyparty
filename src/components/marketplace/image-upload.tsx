"use client";

import * as React from "react";
import { UploadCloud, Loader2, X, ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  /** Current image URL (empty string = no image). */
  value: string;
  /** Called with the uploaded image URL when upload completes. */
  onChange: (url: string) => void;
  /** Aspect ratio hint for the dropzone + preview. */
  aspect?: "banner" | "square";
  /** Compact mode — shorter height for onboarding/forms (default: false). */
  compact?: boolean;
  /** Field label. */
  label: string;
  /** Optional helper text under the label. */
  hint?: string;
  /** Max bytes (default 4 MB). */
  maxSizeBytes?: number;
  className?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES_DEFAULT = 5 * 1024 * 1024; // 5MB

export function ImageUpload({
  value,
  onChange,
  aspect = "banner",
  compact = false,
  label,
  hint,
  maxSizeBytes = MAX_BYTES_DEFAULT,
  className,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const aspectClass = compact
    ? "h-[120px] sm:h-[160px]"
    : aspect === "banner"
      ? "aspect-[16/9]"
      : "aspect-square";

  const validate = (file: File): string | null => {
    if (!file.type.startsWith("image/")) return "Please choose an image file.";
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.type
    );
    if (!ok) return "Only JPG, PNG, WebP or GIF are supported.";
    if (file.size > maxSizeBytes)
      return `File is too large. Max ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`;
    return null;
  };

  const upload = async (file: File) => {
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);

      // Use XHR for real upload progress; fetch() can't report progress on
      // request bodies without streams.
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText) as {
              success?: boolean;
              url?: string;
              error?: string;
            };
            if (xhr.status >= 200 && xhr.status < 300 && body.url) {
              resolve(body.url);
            } else {
              reject(new Error(body.error ?? `Upload failed (${xhr.status})`));
            }
          } catch {
            // Response was not JSON — log the raw response for debugging
            console.error("[ImageUpload] Non-JSON response:", xhr.status, xhr.responseText?.slice(0, 200));
            reject(new Error("Upload failed: invalid response."));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(fd);
      });

      onChange(url);
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void upload(f);
    // reset so the same file can be picked again after remove
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const hasImage = !!value;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-semibold">{label}</label>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => !uploading && !hasImage && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (
            (e.key === "Enter" || e.key === " ") &&
            !uploading &&
            !hasImage
          ) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading && !hasImage) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
          aspectClass,
          dragging
            ? "border-brand bg-brand-soft"
            : "border-border bg-muted/40 hover:border-brand-border hover:bg-muted/60",
          (uploading || hasImage) && "cursor-default"
        )}
      >
        {/* Preview */}
        {hasImage && !uploading && (
          <>
            <img
              src={value}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-white"
              >
                <UploadCloud className="size-3.5" />
                Replace
              </button>
            </div>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove image"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            >
              <X className="size-4" />
            </button>
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              <CheckCircle2 className="size-3" />
              Uploaded
            </span>
          </>
        )}

        {/* Uploading state */}
        {uploading && (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-brand" />
            <span className="text-xs font-medium">
              Uploading… {progress}%
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasImage && !uploading && (
          <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
            <div
              className={cn(
                "grid place-items-center rounded-xl bg-background/80 shadow-sm",
                aspect === "banner" ? "size-10" : "size-12"
              )}
            >
              {dragging ? (
                <UploadCloud className="size-5 text-brand" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs font-semibold">
              {dragging ? "Drop to upload" : "Click or drag to upload"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              JPG, PNG, WebP · max {Math.round(maxSizeBytes / 1024 / 1024)}MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          className="sr-only"
        />
      </div>

      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
