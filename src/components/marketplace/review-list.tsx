"use client";

import { Quote } from "lucide-react";
import type { Review } from "@/lib/types";
import { StarRating } from "./star-rating";
import { timeAgo } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-rose-500",
  "bg-fuchsia-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-orange-500",
  "bg-pink-500",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function ReviewList({
  reviews,
  isLoading,
}: {
  reviews: Review[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="relative rounded-2xl border border-border bg-card p-4"
        >
          <Quote className="absolute right-3 top-3 size-5 text-muted-foreground/20" />
          <div className="flex items-center gap-3">
            <div
              className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${colorFor(
                r.author
              )}`}
            >
              {r.avatar}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.author}</p>
              <div className="flex items-center gap-2">
                <StarRating rating={r.rating} size={12} />
                <span className="text-xs text-muted-foreground">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            &ldquo;{r.comment}&rdquo;
          </p>
          {r.eventDate && (
            <p className="mt-2 text-xs text-muted-foreground">
              Event date:{" "}
              {new Date(r.eventDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
