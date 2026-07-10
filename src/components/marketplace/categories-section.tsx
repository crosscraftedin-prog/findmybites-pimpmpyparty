"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { useCategories } from "@/lib/queries";
import { CategoryIcon } from "./icon";
import { VendorImage } from "./vendor-image";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryDef } from "@/lib/constants";

export function CategoriesSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const setSelectedCategory = useMarketplace((s) => s.setSelectedCategory);
  const { data, isLoading } = useCategories(ecosystem);

  const cats: (CategoryDef & { count: number })[] =
    data?.categories ?? [];

  const handlePick = (id: string) => {
    setSelectedCategory(id);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="categories" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Browse by category
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {ecosystem === "FINDMYBITES"
                ? "Find your perfect bite"
                : "Find your perfect party pro"}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {ecosystem === "FINDMYBITES"
                ? "From neighbourhood bakeries to Michelin-trained private chefs — explore curated categories of food artisans worldwide."
                : "Planners, decorators, DJs, performers and venues — everything you need to throw a celebration people remember."}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))
            : cats.map((cat, i) => (
                <button
                  key={cat.id}
                  
                  
                  
                  
                  onClick={() => handlePick(cat.id)}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <VendorImage
                      src={cat.image || ""}
                      alt={cat.label || ""}
                      accent={cat.accent}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                      categoryIcon={<CategoryIcon name={cat.icon || ""} className="size-12" />}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute left-3 top-3 grid size-9 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md">
                      <CategoryIcon name={cat.icon || ""} className="size-5" />
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      {cat.count} {cat.count === 1 ? "vendor" : "vendors"}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="text-sm font-bold leading-tight text-white">
                        {cat.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="truncate text-xs text-muted-foreground">
                      Explore
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>
                </button>
              ))}
        </div>
      </div>
    </section>
  );
}
