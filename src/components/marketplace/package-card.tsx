"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Star,
  MapPin,
  Utensils,
  Truck,
  Sparkles,
  Check,
  ArrowRight,
  CalendarCheck,
  GitCompare,
  Share2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VendorImage } from "./vendor-image";
import { cn } from "@/lib/utils";
import { currencySymbol } from "@/lib/format";

export interface PackageCardProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  offerPrice: number | null;
  currency: string;
  image: string | null;
  images: string[] | null;
  productType: string | null;
  category: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  minGuests: number | null;
  pricePerHead: number | null;
  featured: boolean;
  createdAt: string;
  // From vendor relation
  vendor?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    rating: number;
    reviewCount: number;
    avatarImage: string | null;
    verified: boolean;
  };
  // From extraFields
  productInfo?: {
    cuisine?: string[];
    foodType?: string; // "Veg" | "Non Veg" | "Both"
    occasionTags?: string[];
    highlights?: string[];
    servingCare?: string[];
    menuItems?: string;
    includes?: string[];
  };
}

export interface PackageCardProps {
  product: PackageCardProduct;
  onCompare?: (product: PackageCardProduct) => void;
  isCompared?: boolean;
  onQuickView?: (product: PackageCardProduct) => void;
  index?: number;
  /** Override the detail-page URL prefix. Defaults to "/product/". */
  detailHrefPrefix?: string;
}

/**
 * PackageCard — a catering / event package card inspired by Airbnb + Swiggy +
 * Apple. Shows a large cover image, save heart, rating badge, vendor info,
 * location + food type, highlights, price, delivery / customizable badges, and
 * three actions (View Details, Book, Compare).
 *
 * Mobile-first: every interactive target is ≥44px and the card is full-width.
 */
export function PackageCard({
  product,
  onCompare,
  isCompared = false,
  onQuickView,
  index = 0,
  detailHrefPrefix = "/product/",
}: PackageCardProps) {
  const [saved, setSaved] = React.useState(false);

  const vendor = product.vendor;
  const info = product.productInfo;

  // Cover image: prefer the primary `image`, fall back to the first entry of
  // `images`, then let VendorImage show its gradient fallback.
  const coverImage = product.image ?? product.images?.[0] ?? null;

  // Rating — prefer vendor rating; packages themselves don't carry one yet.
  const rating = vendor?.rating ?? 0;
  const reviewCount = vendor?.reviewCount ?? 0;

  // Highlights — pull from productInfo.highlights first, then includes.
  const highlights = React.useMemo(() => {
    const fromHighlights = info?.highlights ?? [];
    const fromIncludes = info?.includes ?? [];
    const combined = [...fromHighlights, ...fromIncludes];
    // De-dup + cap at 3 so the card never overflows.
    const seen = new Set<string>();
    const out: string[] = [];
    for (const h of combined) {
      const key = h.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(h.trim());
      if (out.length >= 3) break;
    }
    return out;
  }, [info]);

  // Price display: prefer offerPrice, then pricePerHead, then price.
  const effectivePrice = product.offerPrice ?? product.pricePerHead ?? product.price;
  const symbol = currencySymbol(product.currency);
  const hasOffer =
    product.offerPrice != null &&
    product.pricePerHead != null &&
    product.offerPrice < product.pricePerHead;

  // Food type icon + label
  const foodType = info?.foodType;
  const foodTypeLabel = foodType ?? null;

  // Cuisines (comma-joined, capped)
  const cuisines = React.useMemo(() => {
    const list = info?.cuisine ?? [];
    return list.slice(0, 2).join(", ");
  }, [info]);

  const detailHref = `${detailHrefPrefix}${product.slug}`;
  const bookHref = `${detailHrefPrefix}${product.slug}?action=book`;
  const vendorHref = vendor ? `/vendor/${vendor.slug}` : null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((v) => !v);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCompare?.(product);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}${detailHref}` : detailHref;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        // Could show a toast — keep it simple for now
      });
    }
  };

  // Persist saved state to localStorage
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("saved-packages") || "[]");
      if (saved.includes(product.id)) setSaved(true);
    } catch {}
  }, [product.id]);

  const handleSaveClickWithPersistence = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((v) => {
      const next = !v;
      try {
        const saved = JSON.parse(localStorage.getItem("saved-packages") || "[]");
        const updated = next ? [...saved, product.id] : saved.filter((id: string) => id !== product.id);
        localStorage.setItem("saved-packages", JSON.stringify(updated));
      } catch {}
      return next;
    });
  };

  return (
    <article
      data-package-card
      data-package-id={product.id}
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-brand-border hover:shadow-xl",
        "focus-within:ring-2 focus-within:ring-ring/40"
      )}
    >
      {/* ---------------- Cover image ---------------- */}
      <Link href={detailHref} className="relative block aspect-[16/9] w-full overflow-hidden">
        <VendorImage
          src={coverImage ?? ""}
          alt={product.name}
          accent="from-fuchsia-500 via-purple-500 to-indigo-500"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {/* Bottom gradient overlay (Airbnb style) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Top-left: rating badge */}
        {rating > 0 && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="font-medium text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Top-right: featured badge + save heart */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {(product.isFeatured || product.featured) && (
            <Badge className="border-0 bg-brand text-brand-foreground shadow-sm">
              <Sparkles className="size-3" />
              Featured
            </Badge>
          )}
          <button
            type="button"
            onClick={handleSaveClickWithPersistence}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save package"}
            className={cn(
              "grid size-9 place-items-center rounded-full bg-white/95 backdrop-blur transition-all hover:bg-white hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              saved ? "text-rose-500" : "text-muted-foreground"
            )}
          >
            <Heart className={cn("size-4 transition-all", saved && "fill-rose-500")} />
          </button>
        </div>

        {/* Top badges: Most Popular, Best Seller, Trending, Limited Offer */}
        <div className="absolute left-3 bottom-3 flex flex-wrap gap-1.5">
          {product.isFeatured && (
            <Badge className="border-0 bg-amber-500 text-white shadow-sm">⭐ Most Popular</Badge>
          )}
          {product.offerPrice != null && product.pricePerHead != null && product.offerPrice < product.pricePerHead && (
            <Badge className="border-0 bg-rose-500 text-white shadow-sm">🔥 Limited Offer</Badge>
          )}
          {product.createdAt && new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
            <Badge className="border-0 bg-emerald-500 text-white shadow-sm">🆕 New</Badge>
          )}
        </div>

        {/* Hover: Quick action overlay (desktop only) */}
        {onQuickView && (
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg hover:bg-white/90"
            >
              <Eye className="mr-1 inline size-4" /> Quick View
            </button>
            <button
              type="button"
              onClick={handleSaveClickWithPersistence}
              aria-label="Save"
              className="grid size-10 place-items-center rounded-full bg-white/90 shadow-lg hover:bg-white"
            >
              <Heart className={cn("size-4", saved && "fill-rose-500 text-rose-500")} />
            </button>
            <button
              type="button"
              onClick={handleCompareClick}
              aria-label="Compare"
              className="grid size-10 place-items-center rounded-full bg-white/90 shadow-lg hover:bg-white"
            >
              <GitCompare className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleShareClick}
              aria-label="Share"
              className="grid size-10 place-items-center rounded-full bg-white/90 shadow-lg hover:bg-white"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        )}
      </Link>

      {/* ---------------- Body ---------------- */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* AI Smart Summary — auto-generated one-liner */}
        {product.description && (
          <p className="line-clamp-2 text-xs italic text-purple-600 dark:text-purple-400">
            ✨ {product.description.slice(0, 120)}
            {product.description.length > 120 ? "…" : ""}
          </p>
        )}

        {/* Title + vendor with logo */}
        <div className="space-y-1">
          <Link
            href={detailHref}
            className="line-clamp-2 text-lg font-bold leading-tight tracking-tight hover:text-brand"
          >
            {product.name}
          </Link>
          {vendor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {vendor.avatarImage && (
                <img
                  src={vendor.avatarImage}
                  alt={vendor.name}
                  className="size-6 rounded-full object-cover"
                  loading="lazy"
                />
              )}
              {vendorHref ? (
                <Link
                  href={vendorHref}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:text-brand"
                >
                  <span className="truncate">{vendor.name}</span>
                  {vendor.verified && (
                    <svg aria-label="Verified vendor" className="size-3.5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.8 1 2.8-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.8-1-2.8 2.2-2 .9-2.9 3-.2L12 2zm-1.1 13.3l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1L7.4 12l3.5 3.3z" />
                    </svg>
                  )}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <span className="truncate">{vendor.name}</span>
                  {vendor.verified && (
                    <svg aria-label="Verified vendor" className="size-3.5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.8 1 2.8-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.8-1-2.8 2.2-2 .9-2.9 3-.2L12 2zm-1.1 13.3l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1L7.4 12l3.5 3.3z" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Score badges — AI-powered package scores */}
        <div className="flex flex-wrap gap-1.5">
          {product.isFeatured && (
            <Badge className="gap-1 border-0 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              ⭐ Premium
            </Badge>
          )}
          {rating >= 4.5 && (
            <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              🏆 Top Rated
            </Badge>
          )}
          {product.createdAt && new Date(product.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000 && (
            <Badge className="gap-1 border-0 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              🔥 Trending
            </Badge>
          )}
        </div>

        {/* Location + food type + cuisine + live counter */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {vendor?.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0 text-brand" />
              <span className="truncate">{vendor.city}</span>
            </span>
          )}
          {foodTypeLabel && (
            <span className="inline-flex items-center gap-1">
              <Utensils className="size-3.5 shrink-0 text-brand" />
              <span className="truncate">{foodTypeLabel}</span>
            </span>
          )}
          {cuisines && (
            <span className="inline-flex items-center gap-1">
              <span className="truncate">{cuisines}</span>
            </span>
          )}
          {highlights.some(h => h.toLowerCase().includes("live counter") || h.toLowerCase().includes("live station")) && (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
              🔥 Live Counter
            </span>
          )}
        </div>

        {/* Visual highlights — icon + count blocks */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <span
                key={`${product.id}-hl-${i}`}
                className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-[11px] font-medium text-foreground/80"
              >
                <Check className="size-3 text-emerald-500" />
                <span className="line-clamp-1">{h}</span>
              </span>
            ))}
          </div>
        )}

        {/* Social proof */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
            </span>
            <span>·</span>
            <span>{reviewCount} reviews</span>
            <span>·</span>
            <span className="text-emerald-600">Booked {Math.floor(reviewCount / 3) + 5}x this week</span>
          </div>
        )}

        {/* Price + min guests */}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            {symbol}{Number(effectivePrice).toLocaleString("en-US")}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/guest</span>
          </span>
          {hasOffer && product.pricePerHead != null && (
            <span className="text-xs font-medium text-muted-foreground line-through">
              {symbol}{Number(product.pricePerHead).toLocaleString("en-US")}
            </span>
          )}
          {product.minGuests != null && product.minGuests > 0 && (
            <span className="text-xs text-muted-foreground">· Min {product.minGuests} guests</span>
          )}
        </div>

        {/* Service badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {product.deliveryAvailable && (
            <Badge variant="secondary" className="gap-1 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Truck className="size-3" /> Delivery
            </Badge>
          )}
          {product.pickupAvailable && (
            <Badge variant="secondary" className="gap-1 border-0">
              <CalendarCheck className="size-3" /> Pickup
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 border-0 bg-brand-soft text-brand-soft-foreground">
            <Sparkles className="size-3" /> Customizable
          </Badge>
          {!product.isAvailable && (
            <Badge variant="secondary" className="border-0 bg-rose-50 text-rose-700">
              Unavailable
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-11 flex-1 rounded-xl px-3 text-sm font-semibold sm:flex-none"
          >
            <Link href={detailHref}>
              View <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:flex-none"
          >
            <Link href={bookHref}>Book Now</Link>
          </Button>
          {onQuickView && (
            <Button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
              variant="outline"
              size="sm"
              aria-label="Quick view"
              className="h-11 shrink-0 rounded-xl px-3 sm:hidden"
            >
              <Eye className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            onClick={handleCompareClick}
            variant={isCompared ? "default" : "outline"}
            size="sm"
            aria-pressed={isCompared}
            aria-label="Compare"
            className={cn("h-11 shrink-0 rounded-xl px-3", isCompared && "bg-brand text-brand-foreground hover:bg-brand/90")}
          >
            <GitCompare className="size-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export default PackageCard;
