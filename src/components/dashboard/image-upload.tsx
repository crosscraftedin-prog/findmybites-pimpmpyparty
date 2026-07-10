"use client";

import * as React from "react";
import { Upload, X, Loader2, Check, AlertCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label: string;
  aspect?: "square" | "wide" | "free";
  maxSizeMB?: number;
  camera?: boolean;
  /** Vendor ID for folder path. If omitted, uses 'temp'. */
  vendorId?: string;
  /** Auto-save to DB after upload (calls /api/vendor/profile PUT) */
  autoSave?: boolean;
  /** Field name to auto-save (e.g. 'avatarImage', 'heroImage') */
  field?: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const REJECTED = ["image/gif", "image/svg+xml", "image/heic", "application/pdf"];

/**
 * Generate a secure UUID-like filename.
 */
function secureFilename(ext: string): string {
  const ts = Date.now().toString(36);
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return `${ts}-${rand}.${ext}`;
}

/**
 * Strip EXIF metadata by re-encoding the image via canvas.
 * (Canvas drawImage strips EXIF automatically.)
 */
async function compressImage(file: File, aspect: string): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const MAX_DIM = 1200;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height / width) * MAX_DIM); width = MAX_DIM; }
          else { width = Math.round((width / height) * MAX_DIM); height = MAX_DIM; }
        }

        // Crop to aspect ratio
        if (aspect === "square") {
          const size = Math.min(width, height);
          const sx = (img.width - (img.width * size / width)) / 2;
          const sy = (img.height - (img.height * size / height)) / 2;
          width = size; height = size;
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(file); return; }
          ctx.drawImage(img, sx, sy, img.width * size / width, img.height * size / height, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob ? new File([blob], file.name, { type: file.type }) : file);
          }, file.type, 0.82);
          return;
        } else if (aspect === "wide") {
          const targetH = Math.round(width * 9 / 16);
          if (height > targetH) height = targetH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        // Convert PNG to WebP for smaller size (preserve transparency)
        const outputType = file.type === "image/png" ? "image/webp" : file.type;
        const ext = outputType.split("/")[1];
        canvas.toBlob((blob) => {
          const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
          resolve(blob ? new File([blob], newName, { type: outputType }) : file);
        }, outputType, 0.82);
      };
      img.onerror = () => resolve(file);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value, onChange, folder, label, aspect = "free",
  maxSizeMB = 5, camera = false, vendorId = "temp", autoSave = false, field,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryFile, setRetryFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const uploadFile = async (file: File) => {
    setError(null);
    setRetryFile(null);

    // Validate type
    if (REJECTED.includes(file.type)) {
      const msg = `${file.type.split("/")[1].toUpperCase()} is not supported. Use JPG, PNG, or WebP.`;
      setError(msg); toast.error(msg); return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      toast.error("Invalid file type. Use JPG, PNG, or WebP.");
      return;
    }
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      toast.error(`Image too large. Max ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    abortRef.current = new AbortController();

    try {
      const compressed = await compressImage(file, aspect);
      const ext = compressed.type.split("/")[1];
      const fileName = secureFilename(ext);
      const path = `${vendorId}/${folder}/${fileName}`;

      const { data, error: uploadError } = await supabaseBrowser.storage
        .from("vendor-uploads")
        .upload(path, compressed, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseBrowser.storage
        .from("vendor-uploads")
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      toast.success("Image uploaded!");

      // Auto-save to DB if requested
      if (autoSave && field) {
        try {
          await fetch("/api/vendor/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: urlData.publicUrl }),
          });
          toast.success("Saved to profile");
        } catch {
          // Auto-save is best-effort
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Upload cancelled");
      } else {
        console.error("[ImageUpload] failed:", err);
        setError(err.message || "Upload failed");
        setRetryFile(file);
        toast.error("Upload failed. Click retry.");
      }
    }

    setUploading(false);
    setProgress(0);
    abortRef.current = null;
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    setUploading(false);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (autoSave && field) {
      fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: "" }),
      }).catch(() => {});
    }
    toast.success("Image removed");
  };

  const previewClass = aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-video" : "aspect-auto";
  const maxLabel = `${maxSizeMB}MB max · JPG, PNG, WebP`;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture={camera ? "environment" : undefined}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
        aria-label={label}
      />

      {value ? (
        <div className="relative group">
          <div className={cn("overflow-hidden rounded-xl border border-border bg-muted", previewClass)}>
            <img loading="lazy" src={value} alt={label} className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" variant="outline" className="bg-white/90 text-xs"
              onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="size-3 mr-1" /> Replace
            </Button>
            <Button size="sm" variant="outline" className="bg-red-500/90 text-white text-xs border-red-400"
              onClick={handleDelete}>
              <X className="size-3" /> Delete
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
              <div className="text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-white" />
                <p className="mt-1 text-xs text-white">{progress}%</p>
                <button onClick={cancelUpload} className="mt-1 text-[10px] text-white/70 underline">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
            previewClass, dragOver ? "border-brand bg-brand/5" : "border-border bg-muted/30 hover:bg-muted/50",
            uploading && "opacity-60"
          )}
          aria-label={`Upload ${label}`}
        >
          {uploading ? (
            <div className="text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-brand" />
              <p className="mt-1 text-xs font-medium text-muted-foreground">Uploading… {progress}%</p>
              <div className="mx-auto mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
              <button onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                className="mt-1 text-[10px] text-red-500 underline">
                Cancel
              </button>
            </div>
          ) : retryFile ? (
            <div className="text-center px-3">
              <AlertCircle className="mx-auto size-5 text-red-500" />
              <p className="mt-1 text-xs text-red-600">Upload failed</p>
              <button onClick={(e) => { e.stopPropagation(); uploadFile(retryFile); }}
                className="mt-1 text-[10px] text-brand underline">
                Retry
              </button>
            </div>
          ) : (
            <>
              <Upload className="size-6 text-muted-foreground" />
              <span className="mt-2 text-xs font-medium">{label}</span>
              <span className="text-[10px] text-muted-foreground">Drag & drop or click</span>
              {camera && <span className="text-[10px] text-muted-foreground">📷 Camera supported</span>}
              <span className="mt-0.5 text-[9px] text-muted-foreground/70">{maxLabel}</span>
            </>
          )}
        </button>
      )}

      {error && !retryFile && (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="size-3" /> {error}
        </div>
      )}
    </div>
  );
}

/**
 * Gallery upload — multiple images with drag & drop reorder, delete, subscription limits.
 */
export function GalleryUpload({
  images, onChange, maxImages = 10, vendorId = "temp",
  onUpgrade, folder = "gallery",
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  vendorId?: string;
  onUpgrade?: () => void;
  folder?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const atLimit = images.length >= maxImages;

  const handleFiles = async (files: FileList) => {
    if (atLimit) {
      toast.error(`Limit reached: ${maxImages} images. Upgrade for more.`);
      return;
    }

    const remaining = maxImages === Infinity ? files.length : maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      if (REJECTED.includes(file.type)) {
        toast.error(`${file.name}: Not supported. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (!ACCEPTED.includes(file.type)) {
        toast.error(`${file.name}: Invalid type.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Too large. Max 10MB.`);
        continue;
      }

      try {
        setProgress(Math.round((i / toUpload.length) * 100));
        const compressed = await compressImage(file, "free");
        const ext = compressed.type.split("/")[1];
        const fileName = secureFilename(ext);
        const path = `${vendorId}/${folder}/${fileName}`;

        const { data, error } = await supabaseBrowser.storage
          .from("vendor-uploads")
          .upload(path, compressed, { cacheControl: "3600" });

        if (error) throw error;

        const { data: urlData } = supabaseBrowser.storage
          .from("vendor-uploads")
          .getPublicUrl(data.path);

        newUrls.push(urlData.publicUrl);
      } catch (err: any) {
        toast.error(`${file.name}: Upload failed`);
      }
    }

    setProgress(100);
    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} image(s) uploaded`);
    }
    setUploading(false);
    setProgress(0);
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    setUploading(false);
    setProgress(0);
    toast.info("Upload cancelled");
  };

  const deleteImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
    toast.success("Image removed");
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const arr = [...images];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    onChange(arr);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        aria-label="Upload gallery images"
      />

      {/* Usage counter */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {images.length}{maxImages !== Infinity ? ` / ${maxImages}` : ""} images used
        </p>
        {atLimit && onUpgrade && (
          <button onClick={onUpgrade} className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline">
            <Crown className="size-3" /> Upgrade for more
          </button>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== idx) moveImage(dragIndex, idx);
                setDragIndex(null); setDragOverIndex(null);
              }}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border border-border cursor-move",
                dragOverIndex === idx && "ring-2 ring-brand",
                dragIndex === idx && "opacity-50"
              )}
            >
              <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand px-1 py-0.5 text-[8px] font-bold text-white">COVER</span>
              )}
              <button onClick={() => deleteImage(idx)}
                className="absolute right-1 top-1 grid size-5 place-items-center rounded bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete image">
                <X className="size-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between bg-black/50 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => moveImage(idx, idx - 1)} disabled={idx === 0}
                  className="text-[10px] text-white disabled:opacity-30" aria-label="Move left">←</button>
                <button onClick={() => moveImage(idx, idx + 1)} disabled={idx === images.length - 1}
                  className="text-[10px] text-white disabled:opacity-30" aria-label="Move right">→</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!atLimit && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-6 hover:bg-muted/50 disabled:opacity-60"
          aria-label="Add gallery images"
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-brand" />
              <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
              <button onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                className="mt-1 text-[10px] text-red-500 underline">Cancel</button>
            </>
          ) : (
            <>
              <Upload className="size-5 text-muted-foreground" />
              <span className="mt-1 text-xs font-medium">Add Images</span>
              <span className="text-[10px] text-muted-foreground">
                {images.length}/{maxImages === Infinity ? "∞" : maxImages} · Drag & drop · JPG, PNG, WebP
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
