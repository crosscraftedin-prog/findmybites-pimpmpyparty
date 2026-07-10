"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { useFeaturedVendors } from "@/lib/queries";
import { getPlaceholderVendors } from "@/lib/placeholder-vendors";
import { VendorCard } from "./vendor-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function FeaturedSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const { data, isLoading } = useFeaturedVendors(ecosystem);
  const realVendors = data?.vendors ?? [];
  const displayVendors = realVendors.length > 0 ? realVendors : getPlaceholderVendors(ecosystem);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const vendors = data?.vendors ?? [];

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section id="featured" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <Flame className="size-4" />
              Hand-picked this season
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Featured {ecosystem === "FINDMYBITES" ? "food artisans" : "party pros"}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Top-rated, verified vendors loved by customers around the world.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-72 shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : displayVendors.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-muted-foreground">
            Featured vendors coming soon — check back shortly.
          </p>
        ) : (
          <div
            ref={scrollerRef}
            className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
          >
            {displayVendors.map((v, i) => (
              <div
                key={v.id}
                
                
                
                
                className="w-72 shrink-0 snap-start"
              >
                <VendorCard vendor={v} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
