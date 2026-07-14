"use client";

import * as React from "react";
import Link from "next/link";
import { Star, MapPin, Utensils, Truck, Check, X, Calendar, ChevronLeft, ChevronRight, Sparkles, GitCompare, Heart } from "lucide-react";
import { VendorImage } from "./vendor-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { currencySymbol } from "@/lib/format";
import type { PackageCardProduct } from "./package-card";

interface QuickViewProps {
  product: PackageCardProduct;
  open: boolean;
  onClose: () => void;
  onCompare?: (product: PackageCardProduct) => void;
  isCompared?: boolean;
}

export function QuickView({ product, open, onClose, onCompare, isCompared }: QuickViewProps) {
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  const vendor = product.vendor;
  const info = product.productInfo;
  const allImages = [...(product.images || [])];
  if (product.image && !allImages.includes(product.image)) allImages.unshift(product.image);
  const images = allImages.length > 0 ? allImages : [""];

  const effectivePrice = product.offerPrice ?? product.pricePerHead ?? product.price;
  const symbol = currencySymbol(product.currency);
  const rating = vendor?.rating ?? 0;
  const highlights = [...(info?.highlights ?? []), ...(info?.includes ?? [])].slice(0, 5);
  const menuItems = info?.menuItems ? String(info.menuItems).split("\n").filter(Boolean).slice(0, 10) : [];
  const foodType = info?.foodType || "Both";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h3 className="text-base font-bold line-clamp-1">{product.name}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        {/* Gallery */}
        <div className="relative aspect-[16/9] bg-muted">
          <VendorImage src={images[selectedImage]} alt={product.name} accent="from-purple-400 to-pink-500" className="h-full w-full" />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow hover:bg-white"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow hover:bg-white"
              >
                <ChevronRight className="size-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn("h-1.5 rounded-full transition-all", idx === selectedImage ? "w-6 bg-white" : "w-1.5 bg-white/50")}
                  />
                ))}
              </div>
            </>
          )}
          {/* Save + Compare */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className="grid size-9 place-items-center rounded-full bg-white/95 backdrop-blur"
            >
              <Heart className={cn("size-4", saved && "fill-rose-500 text-rose-500")} />
            </button>
          </div>
          {/* Rating */}
          {rating > 0 && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {vendor?.reviewCount ? <span className="font-medium text-muted-foreground">({vendor.reviewCount})</span> : null}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          {/* Vendor + Location */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {vendor && (
              <div className="flex items-center gap-2">
                <img src={vendor.avatarImage || "/vendors/catering.png"} alt={vendor.name} className="size-8 rounded-full object-cover" />
                <span className="font-medium">{vendor.name}</span>
                {vendor.verified && <Badge className="size-4 p-0"><Sparkles className="size-3" /></Badge>}
              </div>
            )}
            {vendor?.city && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" /> {vendor.city}
              </span>
            )}
            <Badge variant="outline" className="gap-1">
              <Utensils className="size-3" /> {foodType}
            </Badge>
            {product.deliveryAvailable && (
              <Badge variant="outline" className="gap-1 text-emerald-600">
                <Truck className="size-3" /> Delivery
              </Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Package Includes</h4>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-emerald-500" /> {h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu preview */}
          {menuItems.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Menu Preview</h4>
              <div className="space-y-1">
                {menuItems.map((item, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{item}</p>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 border-t border-border pt-3">
            <span className="text-2xl font-extrabold">{symbol}{Number(effectivePrice).toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/guest</span>
            {product.minGuests != null && product.minGuests > 0 && (
              <span className="text-sm text-muted-foreground">· Min {product.minGuests} guests</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild className="flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              <Link href={`/packages/${product.slug}?action=book`}>
                <Calendar className="size-4" /> Book Package
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 gap-1.5">
              <Link href={`/packages/${product.slug}`}>View Details</Link>
            </Button>
            {onCompare && (
              <Button
                variant={isCompared ? "default" : "outline"}
                onClick={() => onCompare(product)}
                className="gap-1.5"
              >
                <GitCompare className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
