"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminReviews, useDeleteReview } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-rose-500",
  "bg-fuchsia-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
];
function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function AdminReviews() {
  const [rating, setRating] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isFetching } = useAdminReviews({
    rating,
    page,
    pageSize: 20,
  });
  const deleteReview = useDeleteReview();

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const onDelete = (id: string, author: string) => {
    if (!confirm(`Delete the review by "${author}"? This cannot be undone.`))
      return;
    deleteReview.mutate(id, {
      onSuccess: () => toast.success("Review deleted."),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={rating} onValueChange={(v) => { setRating(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[180px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="1">★ 1 star</SelectItem>
            <SelectItem value="2">★ 2 stars</SelectItem>
            <SelectItem value="3">★ 3 stars</SelectItem>
            <SelectItem value="4">★ 4 stars</SelectItem>
            <SelectItem value="5">★ 5 stars</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {isFetching && !isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" /> Updating…
            </span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{total}</span>{" "}
              {total === 1 ? "review" : "reviews"}
            </>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          No reviews found.
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
                  colorFor(r.author)
                )}
              >
                {r.avatar || r.author.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{r.author}</p>
                  <span className="text-xs text-muted-foreground">
                    on <span className="font-medium text-foreground">{r.vendorName}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">· {timeAgo(r.createdAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3.5",
                        i < r.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  &ldquo;{r.comment}&rdquo;
                </p>
              </div>
              <button
                title="Delete review"
                onClick={() => onDelete(r.id, r.author)}
                disabled={deleteReview.isPending}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
