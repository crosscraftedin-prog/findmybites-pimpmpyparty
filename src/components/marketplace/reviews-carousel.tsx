"use client";

import * as React from "react";
import { Star, Quote } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";

interface ReviewWithVendor {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  eventDate: string | null;
  createdAt: string;
  vendor: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    avatarImage: string;
    category: string;
  };
}

export function ReviewsCarousel() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const [reviews, setReviews] = React.useState<ReviewWithVendor[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews/recent?ecosystem=${ecosystem}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setLoading(false);
      })
      .catch(() => {
        setReviews([]);
        setLoading(false);
      });
  }, [ecosystem]);

  return (
    <section id="reviews" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <Star className="size-4 fill-brand" />
              Loved by customers
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              What people are saying
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Real reviews from real customers who found their perfect {ecosystem === "FINDMYBITES" ? "bite" : "party pro"}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-muted-foreground">
            Reviews loading — customers are sharing their experiences.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r, i) => (
              <div
                key={r.id}
                
                
                
                
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {r.avatar ? (
                      <img loading="lazy" src={r.avatar} alt={r.author} className="size-9 rounded-full object-cover" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                        {r.author?.charAt(0)?.toUpperCase() || "A"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold">{r.author}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.eventDate ? `Event: ${r.eventDate}` : "Verified customer"}
                      </p>
                    </div>
                  </div>
                  <Quote className="size-5 shrink-0 text-muted-foreground/30" />
                </div>

                <div className="mt-3">
                  <StarRating rating={r.rating} size={16} />
                </div>

                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  "{r.comment}"
                </p>

                <a
                  href={`/vendor/${r.vendor.slug}`}
                  className="mt-3 flex items-center gap-2 border-t border-border pt-3 hover:opacity-80"
                >
                  {r.vendor.avatarImage && (
                    <img loading="lazy" src={r.vendor.avatarImage} alt={r.vendor.name} className="size-6 rounded-full object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{r.vendor.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{r.vendor.city}, {r.vendor.country}</p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
