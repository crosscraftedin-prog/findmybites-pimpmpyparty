"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Images } from "lucide-react";
import { useMarketplace } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GalleryItem {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  city: string;
  image: string;
  category: string;
}

export function InspirationGallery() {
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Only show for PimpMyParty
  React.useEffect(() => {
    if (ecosystem !== "PIMPMYPARTY") return;
    setLoading(true);
    fetch(`/api/vendors?ecosystem=PIMPMYPARTY&featured=true&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        const vendors = d.vendors ?? [];
        const galleryItems: GalleryItem[] = [];
        for (const v of vendors) {
          let gallery: string[] = [];
          try {
            gallery = typeof v.gallery === "string" ? JSON.parse(v.gallery) : (v.gallery ?? []);
          } catch {
            gallery = [];
          }
          // Take up to 2 images per vendor
          for (const img of gallery.slice(0, 2)) {
            if (img) {
              galleryItems.push({
                vendorId: v.id,
                vendorName: v.name,
                vendorSlug: v.slug,
                city: v.city,
                image: img,
                category: v.category,
              });
            }
          }
        }
        setItems(galleryItems.slice(0, 12));
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, [ecosystem]);

  if (ecosystem !== "PIMPMYPARTY") return null;

  return (
    <section id="inspiration" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <Images className="size-4" />
              Inspiration gallery
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Get inspired
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Real work from real vendors — scroll through stunning setups, decor, and celebrations.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn("rounded-2xl", i % 3 === 0 ? "aspect-[3/4]" : "aspect-square")} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-8 py-8 text-center text-sm text-muted-foreground">
            Inspiration loading — vendors are uploading their best work.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <motion.a
                key={`${item.vendorId}-${i}`}
                href={`/vendor/${item.vendorSlug}`}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border shadow-sm transition-all hover:shadow-lg",
                  i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                )}
              >
                <img
                  src={item.image}
                  alt={item.vendorName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs font-bold text-white">{item.vendorName}</p>
                  <p className="truncate text-[10px] text-white/80">{item.city}</p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
