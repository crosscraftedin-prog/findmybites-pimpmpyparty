"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package, BadgeCheck, Star,
  MessageCircle, Heart, Truck, ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared ProductDetailView component.
 * Used by BOTH the live product page AND the wizard preview.
 * One component, one layout, no duplication.
 */

export interface ProductViewData {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  price: number;
  offerPrice?: number | null;
  comparePrice?: number | null;
  discountPercent?: number | null;
  currency?: string;
  currencySymbol?: string;
  image?: string | null;
  images?: string[] | null;
  packageType?: string | null;
  badge?: string | null;
  isFeatured?: boolean;
  isAvailable?: boolean;
  variants?: any[] | null;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  halal?: boolean;
  glutenFree?: boolean;
  eggless?: boolean;
  category?: string | null;
  subCategory?: string | null;
  capacity?: number | null;
  duration?: string | null;
  servings?: string | null;
  weight?: string | null;
  prepTime?: string | null;
  ingredients?: string | null;
  allergenInfo?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface VendorViewData {
  id: string;
  name: string;
  slug: string;
  city: string;
  country?: string;
  avatarImage?: string | null;
  verified?: boolean;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  responseTime?: string | null;
  whatsapp?: string | null;
  ecosystem?: string;
}

export interface ProductDetailViewProps {
  product: ProductViewData;
  vendor?: VendorViewData | null;
  mode?: "live" | "preview";
  onVariantSelect?: (index: number) => void;
  selectedVariant?: number;
  onEnquiry?: () => void;
  onWhatsApp?: () => void;
  onWishlist?: () => void;
  isWishlisted?: boolean;
}

export function ProductDetailView({
  product,
  vendor,
  mode = "live",
  onVariantSelect,
  selectedVariant = 0,
  onEnquiry,
  onWhatsApp,
  onWishlist,
  isWishlisted,
}: ProductDetailViewProps) {
  const symbol = product.currencySymbol || "₹";
  const gallery: string[] = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const variants = React.useMemo(() => {
    const v = product.variants as any;
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
    return [];
  }, [product.variants]);

  const selVar = variants[selectedVariant];

  const displayPrice = selVar
    ? Number(selVar.offerPrice || selVar.price || 0)
    : product.offerPrice
      ? Number(product.offerPrice)
      : product.price;

  const originalPrice = selVar
    ? Number(selVar.price || 0)
    : product.price;

  const hasOffer = selVar
    ? !!(selVar.offerPrice && Number(selVar.price) > Number(selVar.offerPrice))
    : !!(product.offerPrice && product.price > Number(product.offerPrice));

  const discountPct = hasOffer && originalPrice > 0
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Gallery */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[4/3]">
          {gallery[0] ? (
            <img src={gallery[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="eager" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="size-16" /></div>
          )}
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {product.badge && <Badge className="border-0 bg-brand text-white shadow-lg">{product.badge}</Badge>}
            {product.isFeatured && <Badge className="border-0 bg-amber-500 text-white shadow-lg">★ Featured</Badge>}
          </div>
          {gallery.length > 1 && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">{gallery.length} photos</div>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible sm:w-24">
            {gallery.slice(0, 4).map((img, i) => (
              <div key={i} className="relative aspect-square shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted sm:w-24">
                <img src={img ?? undefined} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title + Vendor + Price */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product.name}</h1>
          {vendor && (
            <Link href={mode === "live" ? `/vendor/${vendor.slug}` : "#"} className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              {vendor.avatarImage && <img src={vendor.avatarImage} alt={vendor.name} className="size-6 rounded-full object-cover ring-1 ring-border" />}
              <span>by <span className="font-semibold text-foreground">{vendor.name}</span></span>
              {vendor.verified && <BadgeCheck className="size-4 text-emerald-500" />}
              {(vendor.rating ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Star className="size-3 fill-amber-400 text-amber-400" />{vendor.rating?.toFixed(1)}
                  <span className="text-muted-foreground">({vendor.reviewCount})</span>
                </span>
              )}
            </Link>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand">{symbol}{displayPrice.toLocaleString()}</span>
          {hasOffer && <span className="text-lg text-muted-foreground line-through">{symbol}{originalPrice.toLocaleString()}</span>}
          {discountPct && discountPct > 0 && <Badge className="border-0 bg-red-500 text-white">{discountPct}% OFF</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          {product.deliveryAvailable && <Badge className="border-0 bg-emerald-100 text-emerald-700"><Truck className="size-3" /> Delivery</Badge>}
          {product.pickupAvailable && <Badge className="border-0 bg-emerald-100 text-emerald-700"><ShoppingBag className="size-3" /> Pickup</Badge>}
          {product.vegetarian && <Badge className="border-0 bg-green-100 text-green-700">🟢 Veg</Badge>}
          {product.vegan && <Badge className="border-0 bg-green-100 text-green-700">Vegan</Badge>}
          {product.eggless && <Badge className="border-0 bg-amber-100 text-amber-700">Eggless</Badge>}
        </div>
      </div>

      {/* Variants */}
      {variants.length > 1 && (
        <div className="rounded-xl border border-border p-4">
          <h4 className="mb-3 text-sm font-bold text-foreground">Choose Package</h4>
          <div className="space-y-2">
            {variants.map((variant: any, idx: number) => {
              const isUnavailable = variant.available === false;
              const varPrice = Number(variant.offerPrice || variant.price || 0);
              const varOrig = Number(variant.price || 0);
              const varHasOffer = variant.offerPrice && varOrig > varPrice;
              return (
                <button key={idx} onClick={() => !isUnavailable && onVariantSelect?.(idx)} disabled={isUnavailable}
                  className={cn("flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all",
                    isUnavailable ? "border-border bg-muted/30 opacity-50 cursor-not-allowed" : selectedVariant === idx ? "border-brand bg-brand/5" : "border-border hover:border-brand/50")}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", selectedVariant === idx && !isUnavailable ? "border-brand bg-brand" : "border-muted-foreground/30")}>
                      {selectedVariant === idx && !isUnavailable && <div className="size-2 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{variant.name || `Option ${idx + 1}`}</span>
                      {variant.description && <span className="block text-xs text-muted-foreground truncate">{variant.description}</span>}
                      {isUnavailable && <span className="text-xs text-red-500">Currently unavailable</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {varHasOffer && <span className="text-xs text-muted-foreground line-through">{symbol}{varOrig.toLocaleString()}</span>}
                    <span className="text-sm font-bold text-brand">{symbol}{varPrice.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
        </div>
      )}

      {/* Action buttons (live mode only) */}
      {mode === "live" && (
        <div className="flex gap-2">
          {onEnquiry && <Button onClick={onEnquiry} className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90">Send Enquiry</Button>}
          {vendor?.whatsapp && onWhatsApp && (
            <a href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}${selVar ? ` — ${selVar.name}` : ""}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1da851]">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          )}
          {onWishlist && (
            <button onClick={onWishlist}
              className={cn("grid size-10 place-items-center rounded-full border-2 transition-colors",
                isWishlisted ? "border-red-500 bg-red-50 text-red-500" : "border-border text-muted-foreground hover:border-red-300")}>
              <Heart className={cn("size-4", isWishlisted && "fill-current")} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
