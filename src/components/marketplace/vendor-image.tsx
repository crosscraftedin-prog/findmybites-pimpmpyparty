"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VendorImageProps {
  src: string;
  alt: string;
  className?: string;
  accent?: string; // gradient classes like "from-amber-400 to-orange-500"
  categoryIcon?: React.ReactNode;
}

/**
 * Image with graceful gradient fallback while loading or if it fails to load.
 */
export function VendorImage({
  src,
  alt,
  className,
  accent = "from-amber-400 to-orange-500",
  categoryIcon,
}: VendorImageProps) {
  const [errored, setErrored] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            "h-full w-full object-cover transition-all duration-700",
            loaded ? "scale-100 opacity-100" : "scale-105 opacity-0"
          )}
        />
      )}
      {(errored || !loaded) && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
            accent
          )}
        >
          {categoryIcon && (
            <div className="text-white/80 opacity-60">{categoryIcon}</div>
          )}
        </div>
      )}
    </div>
  );
}
