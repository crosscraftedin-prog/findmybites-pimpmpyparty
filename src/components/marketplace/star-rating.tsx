"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 16,
  className,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const roundedFull = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - roundedFull - (hasHalf ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: roundedFull }).map((_, i) => (
          <Star
            key={`f-${i}`}
            style={{ width: size, height: size }}
            className="fill-amber-400 text-amber-400"
          />
        ))}
        {hasHalf && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star
              style={{ width: size, height: size }}
              className="absolute inset-0 text-amber-400"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: size / 2 }}
            >
              <Star
                style={{ width: size, height: size }}
                className="fill-amber-400 text-amber-400"
              />
            </div>
          </div>
        )}
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
          <Star
            key={`e-${i}`}
            style={{ width: size, height: size }}
            className="text-muted-foreground/30"
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-semibold tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground tabular-nums">
          ({count})
        </span>
      )}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  size = 28,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = React.useState(0);
  const display = hover || value;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star
            style={{ width: size, height: size }}
            className={
              n <= display
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            }
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-muted-foreground">
        {display > 0 ? `${display}.0` : "Rate"}
      </span>
    </div>
  );
}
