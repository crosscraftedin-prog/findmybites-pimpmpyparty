"use client";

import * as React from "react";
import { Upload, X, Loader2, Image as ImageIcon, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

interface ImageUploadProps {
  /** Current image URL (from DB) */
  value: string;
  /** Callback when image is uploaded (receives the public URL) */
  onChange: (url: string) => void;
  /** Folder prefix in storage: 'logos' | 'covers' | 'gallery' */
  folder: string;
  /** Upload label */
  label: string;
  /** Aspect ratio hint for the preview */
  aspect?: "square" | "wide" | "free";
  /** Accept attribute */
  accept?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Whether to allow camera capture on mobile */
  camera?: boolean;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * ImageUpload — modern image upload component using Supabase Storage.
 *
 * Features:
 * - Drag & drop
 * - Click to select
 * - Mobile camera support (capture="environment")
 * - Client-side image compression (canvas resize + quality)
 * - Upload progress
 * - Preview with replace/delete
 * - Friendly error handling
 */
export function ImageUpload({
  value, onChange, folder, label, aspect = "free",
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 10, camera = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!ACCEPTED.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      toast.error("Invalid file type. Use JPG, PNG, or WebP.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB`);
      toast.error(`Image too large. Maximum ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Compress image client-side
      const compressed = await compressImage(file, aspect);
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${compressed.type.split("/")[1]}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabaseBrowser.storage
        .from("vendor-uploads")
        .upload(fileName, compressed, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          },
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabaseBrowser.storage
        .from("vendor-uploads")
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      console.error("[ImageUpload] failed:", err);
      setError(err.message || "Upload failed");
      toast.error("Upload failed. Please try again.");
    }

    setUploading(false);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    toast.success("Image removed");
  };

  const previewClass = aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-video" : "aspect-auto";

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={camera ? "environment" : undefined}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // reset for re-upload
        }}
      />

      {value ? (
        // Preview state
        <div className="relative group">
          <div className={cn("overflow-hidden rounded-xl border border-border bg-muted", previewClass)}>
            <img src={value} alt={label} className="h-full w-full object-cover" />
          </div>
          {/* Overlay actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-3 mr-1" /> Replace
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/90 text-white text-xs border-red-400"
              onClick={handleDelete}
            >
              <X className="size-3" /> Delete
            </Button>
          </div>
          {/* Upload progress overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <div className="text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-white" />
                <p className="mt-1 text-xs text-white">{progress}%</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Upload state
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
            previewClass,
            dragOver ? "border-brand bg-brand/5" : "border-border bg-muted/30 hover:bg-muted/50",
            uploading && "opacity-60"
          )}
        >
          {uploading ? (
            <div className="text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-brand" />
              <p className="mt-1 text-xs font-medium text-muted-foreground">Uploading… {progress}%</p>
              <div className="mx-auto mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <Upload className="size-6 text-muted-foreground" />
              <span className="mt-2 text-xs font-medium">{label}</span>
              <span className="text-[10px] text-muted-foreground">Drag & drop or click</span>
              {camera && <span className="text-[10px] text-muted-foreground">📷 Camera supported</span>}
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="size-3" /> {error}
        </div>
      )}
    </div>
  );
}

/**
 * Gallery upload — multiple images with drag & drop, reorder, delete.
 */
export function GalleryUpload({
  images, onChange, maxImages = 10,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      toast.error(`Maximum ${maxImages} images`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      if (!ACCEPTED.includes(file.type)) {
        toast.error(`${file.name}: Invalid type. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Too large. Max 10MB.`);
        continue;
      }

      try {
        setProgress(Math.round((i / toUpload.length) * 100));
        const compressed = await compressImage(file, "free");
        const fileName = `gallery/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}.${compressed.type.split("/")[1]}`;

        const { data, error } = await supabaseBrowser.storage
          .from("vendor-uploads")
          .upload(fileName, compressed, { cacheControl: "3600" });

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
    onChange([...images, ...newUrls]);
    toast.success(`${newUrls.length} image(s) uploaded`);
    setUploading(false);
    setProgress(0);
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

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIndex(idx); };
  const handleDrop = (idx: number) => {
    if (dragIndex !== null && dragIndex !== idx) moveImage(dragIndex, dragIndex);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border border-border cursor-move",
                dragOverIndex === idx && "ring-2 ring-brand",
                dragIndex === idx && "opacity-50"
              )}
            >
              <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand px-1 py-0.5 text-[8px] font-bold text-white">
                  COVER
                </span>
              )}
              <button
                onClick={() => deleteImage(idx)}
                className="absolute right-1 top-1 grid size-5 place-items-center rounded bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between bg-black/50 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => moveImage(idx, idx - 1)}
                  disabled={idx === 0}
                  className="text-[10px] text-white disabled:opacity-30"
                >←</button>
                <button
                  onClick={() => moveImage(idx, idx + 1)}
                  disabled={idx === images.length - 1}
                  className="text-[10px] text-white disabled:opacity-30"
                >→</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-6 hover:bg-muted/50 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-brand" />
              <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
            </>
          ) : (
            <>
              <Upload className="size-5 text-muted-foreground" />
              <span className="mt-1 text-xs font-medium">Add Gallery Images</span>
              <span className="text-[10px] text-muted-foreground">
                {images.length}/{maxImages} · Drag & drop or click · JPG, PNG, WebP
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Compress an image client-side using canvas.
 * Resizes to max dimension and reduces quality.
 */
async function compressImage(file: File, aspect: string): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const MAX_DIM = 1200; // max width or height

        // Resize if too large
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height / width) * MAX_DIM);
            width = MAX_DIM;
          } else {
            width = Math.round((width / height) * MAX_DIM);
            height = MAX_DIM;
          }
        }

        // Crop to aspect ratio if specified
        if (aspect === "square") {
          const size = Math.min(width, height);
          width = size;
          height = size;
        } else if (aspect === "wide") {
          const targetHeight = Math.round(width * 9 / 16);
          if (height > targetHeight) height = targetHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }

        // Center-crop
        const sx = (img.width - width * (img.width / width)) / 2;
        const sy = (img.height - height * (img.height / height)) / 2;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressed = new File([blob], file.name, { type: file.type });
              resolve(compressed);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.82 // quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
