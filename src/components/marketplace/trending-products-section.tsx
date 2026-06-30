"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp, MapPin } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrendingProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  currencySymbol: string;
  image: string | null;
  packageType: string | null;
  isFeatured: boolean;
  vendor: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    countryCode: string;
    avatarImage: string;
  } | null;
}

export function TrendingProductsSection() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const [products, setProducts] = React.useState<TrendingProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/products/trending?ecosystem=${ecosystem}&limit=14&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [ecosystem]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section id="trending" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <TrendingUp className="size-4" />
              {ecosystem === "FINDMYBITES" ? "Trending treats" : "Trending services"}
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {ecosystem === "FINDMYBITES" ? "Hot off the press" : "Most-loved packages"}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {ecosystem === "FINDMYBITES"
                ? "Fresh cakes, desserts and treats our customers can't stop ordering."
                : "The event packages everyone's talking about — book before they're taken."}
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" size="icon" onClick={() => scroll("left")} aria-label="Scroll left">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll("right")} aria-label="Scroll right">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-60 shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-muted-foreground">
            Trending products coming soon — vendors are adding new items daily.
          </p>
        ) : (
          <div ref={scrollerRef} className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="w-60 shrink-0 snap-start"
              >
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className={cn("h-full w-full bg-gradient-to-br", ecosystem === "FINDMYBITES" ? "from-amber-200 to-orange-300" : "from-fuchsia-200 to-purple-300")} />
                    )}
                    {p.isFeatured && (
                      <Badge className="absolute left-2 top-2 border-0 bg-brand text-brand-foreground shadow-sm">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-1 text-sm font-bold">{p.name}</h3>
                    {p.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm font-bold text-brand">
                        {p.currencySymbol}{p.price.toLocaleString()}
                      </span>
                      {p.vendor && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <MapPin className="size-2.5" />
                          {p.vendor.city}
                        </span>
                      )}
                    </div>
                    {p.vendor && (
                      <a
                        href={`/vendor/${p.vendor.slug}`}
                        className="mt-2 truncate text-[10px] font-medium text-brand hover:underline"
                      >
                        by {p.vendor.name}
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
