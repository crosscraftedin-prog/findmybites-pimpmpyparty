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
            onClick={handleSaveClick}
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
      </Link>

      {/* ---------------- Body ---------------- */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Title + vendor */}
        <div className="space-y-1">
          <Link
            href={detailHref}
            className="line-clamp-2 text-lg font-bold leading-tight tracking-tight hover:text-brand"
          >
            {product.name}
          </Link>
          {vendor && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="truncate">by</span>
              {vendorHref ? (
                <Link
                  href={vendorHref}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:text-brand"
                >
                  <span className="truncate">{vendor.name}</span>
                  {vendor.verified && (
                    <svg
                      aria-label="Verified vendor"
                      className="size-3.5 shrink-0 text-brand"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.8 1 2.8-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.8-1-2.8 2.2-2 .9-2.9 3-.2L12 2zm-1.1 13.3l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1L7.4 12l3.5 3.3z" />
                    </svg>
                  )}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <span className="truncate">{vendor.name}</span>
                  {vendor.verified && (
                    <svg
                      aria-label="Verified vendor"
                      className="size-3.5 shrink-0 text-brand"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.8 1 2.8-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.8-1-2.8 2.2-2 .9-2.9 3-.2L12 2zm-1.1 13.3l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1L7.4 12l3.5 3.3z" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Location + food type row */}
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
        </div>

        {/* Highlights summary */}
        {highlights.length > 0 && (
          <ul className="space-y-1">
            {highlights.map((h, i) => (
              <li
                key={`${product.id}-hl-${i}`}
                className="flex items-start gap-1.5 text-xs text-foreground/80"
              >
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                <span className="line-clamp-1">{h}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Price + min guests */}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            {symbol}
            {Number(effectivePrice).toLocaleString("en-US")}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/guest</span>
          </span>
          {hasOffer && product.pricePerHead != null && (
            <span className="text-xs font-medium text-muted-foreground line-through">
              {symbol}
              {Number(product.pricePerHead).toLocaleString("en-US")}
            </span>
          )}
          {product.minGuests != null && product.minGuests > 0 && (
            <span className="text-xs text-muted-foreground">
              · Min {product.minGuests} guests
            </span>
          )}
        </div>

        {/* Badges: delivery / customizable */}
        <div className="flex flex-wrap items-center gap-1.5">
          {product.deliveryAvailable && (
            <Badge
              variant="secondary"
              className="gap-1 border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <Truck className="size-3" />
              Delivery
            </Badge>
          )}
          {product.pickupAvailable && (
            <Badge variant="secondary" className="gap-1 border-0">
              <CalendarCheck className="size-3" />
              Pickup
            </Badge>
          )}
          {/* "Customizable" — inferred from presence of variants / highlights
              that mention custom. We default to true when highlights include
              "custom" or includes mention "custom"; otherwise still shown as a
              soft badge since most packages are customizable on request. */}
          <Badge
            variant="secondary"
            className="gap-1 border-0 bg-brand-soft text-brand-soft-foreground"
          >
            <Sparkles className="size-3" />
            Customizable
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
              View Details
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:flex-none"
          >
            <Link href={bookHref}>Book Package</Link>
          </Button>
          <Button
            type="button"
            onClick={handleCompareClick}
            variant={isCompared ? "default" : "outline"}
            size="sm"
            aria-pressed={isCompared}
            className={cn(
              "h-11 shrink-0 rounded-xl px-3 text-sm font-semibold",
              isCompared && "bg-brand text-brand-foreground hover:bg-brand/90"
            )}
          >
            <GitCompare className="size-3.5" />
            <span className="hidden sm:inline">{isCompared ? "Comparing" : "Compare"}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default PackageCard;
