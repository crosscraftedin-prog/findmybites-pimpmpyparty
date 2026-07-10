"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
  X,
  Package,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { StarRating } from "@/components/marketplace/star-rating";
import { VendorImage } from "@/components/marketplace/vendor-image";
import { useCreateBooking } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { VendorAIChat } from "@/components/marketplace/vendor-ai-chat";
import {
  AIStoreSummary,
  AIFAQ,
  AIReviewSummary,
} from "@/components/marketplace/vendor-ai-sections";
import {
  VendorHighlights,
  FollowButton,
  ProductBadge,
} from "@/components/marketplace/vendor-highlights";
import { SmartEnquiryForm } from "@/components/marketplace/smart-enquiry-form";
import { ProductAvailabilityBanner } from "@/components/inventory/product-availability-banner";
import type { VendorWithRelations } from "@/lib/types";

interface Props {
  slug: string;
}

interface ProductData {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    offerPrice: number | null;
    comparePrice: number | null;
    discountPercent: number | null;
    currency: string;
    currencySymbol: string;
    image: string | null;
    images: string[];
    videoUrl: string | null;
    productType: string | null;
    packageType: string | null;
    badge: string | null;
    isFeatured: boolean;
    isAvailable: boolean;
    capacity: number | null;
    duration: string | null;
    leadTime: string | null;
    minGuests: number | null;
    pricePerHead: number | null;
    includes: string[];
    dietaryTags: string[];
    allergens: string[];
    addOns: string[];
    cuisineType: string | null;
    customisationAvailable: boolean;
    customisationNotes: string | null;
    shelfLife: string | null;
    storageMethod: string | null;
    storageInstructions: string | null;
    offerType: string | null;
    offerLabel: string | null;
    templateSlug: string | null;
    templateVersion: number | null;
    extraFields: Record<string, any>;
    createdAt: string;
  };
  vendor: {
    id: string;
    name: string;
    slug: string;
    ecosystem: string;
    category: string;
    subcategory: string | null;
    tagline: string;
    description: string;
    city: string;
    country: string;
    countryCode: string;
    currency: string;
    priceRange: string;
    basePrice: number;
    rating: number;
    reviewCount: number;
    heroImage: string;
    avatarImage: string;
    featured: boolean;
    verified: boolean;
    responseTime: string;
    yearsActive: number;
    completedBookings: number;
    deliveryAvailable: boolean;
    pickupAvailable: boolean;
    serviceAreas: string | null;
    serviceRadiusKm: number | null;
    openHours: string | null;
    whatsapp: string | null;
    instagram: string | null;
    website: string | null;
    tags: string[];
  } | null;
  related: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    packageType: string | null;
    badge: string | null;
    isFeatured: boolean;
    vendor: { id: string; name: string; slug: string; city: string; avatarImage: string } | null;
  }[];
}

export function ProductPageClient({ slug }: Props) {
  const router = useRouter();
  const [data, setData] = React.useState<ProductData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [wishlisted, setWishlisted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"specs" | "reviews" | "faq">("specs");
  const [selectedVariant, setSelectedVariant] = React.useState<number>(0);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/products/detail?slug=${encodeURIComponent(slug)}&t=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [slug]);

  // Track product view
  React.useEffect(() => {
    if (data?.product?.id) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: data.vendor?.id,
          eventType: "product_view",
          productId: data.product.id,
          referrer: document.referrer || null,
        }),
      }).catch(() => {});
    }
  }, [data?.product?.id, data?.vendor?.id]);

  // Check wishlist status
  React.useEffect(() => {
    if (data?.product?.id) {
      fetch(`/api/wishlist?entityType=product&entityId=${data.product.id}`)
        .then((r) => r.json())
        .then((d) => setWishlisted(d.wishlisted ?? false))
        .catch(() => {});
    }
  }, [data?.product?.id]);

  const trackClick = (eventType: string) => {
    if (!data?.vendor?.id) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: data.vendor.id, eventType }),
    }).catch(() => {});
  };

  const toggleWishlist = async () => {
    if (!data?.product?.id) return;
    try {
      const method = wishlisted ? "DELETE" : "POST";
      await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "product",
          entityId: data.product.id,
          vendorId: data.vendor?.id,
        }),
      });
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  const share = async () => {
    trackClick("share_click");
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.product?.name || "Product", url });
      } catch {}
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!data || !data.product) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-lg font-bold">Product not found</p>
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { product, vendor, related } = data;
  const gallery = product.images.length > 0 ? product.images : [product.image].filter(Boolean);
  const isFood = vendor?.ecosystem === "FINDMYBITES";
  const symbol = product.currencySymbol;

  // Build specifications from template engine extraFields + standard fields
  const specs: { label: string; value: string }[] = [];
  if (product.capacity) specs.push({ label: "Capacity", value: `${product.capacity} guests` });
  if (product.duration) specs.push({ label: "Duration", value: product.duration });
  if (product.leadTime) specs.push({ label: "Lead Time", value: `${product.leadTime} days` });
  if (product.minGuests) specs.push({ label: "Minimum Guests", value: String(product.minGuests) });
  if (product.cuisineType) specs.push({ label: "Cuisine", value: product.cuisineType });
  if (product.shelfLife) specs.push({ label: "Shelf Life", value: product.shelfLife });
  if (product.storageMethod) specs.push({ label: "Storage", value: product.storageMethod });
  if (product.storageInstructions) specs.push({ label: "Storage Instructions", value: product.storageInstructions });
  // Template Engine extra fields
  for (const [key, value] of Object.entries(product.extraFields)) {
    if (value && typeof value === "string" && value.trim()) {
      // Convert camelCase to Title Case
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
      specs.push({ label, value });
    } else if (Array.isArray(value) && value.length > 0) {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
      specs.push({ label, value: value.join(", ") });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">{isFood ? "FindMyBites" : "PimpMyParty"}</Link>
            <ChevronRight className="size-3" />
            {vendor && (
              <>
                <Link href={`/vendor/${vendor.slug}`} className="hover:text-foreground">{vendor.name}</Link>
                <ChevronRight className="size-3" />
              </>
            )}
            <span className="font-medium text-foreground">{product.name}</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* ── Product Hero — Premium Gallery ─────────────────── */}
              <div>
                {/* Main Gallery */}
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  {/* Main image — larger, more prominent */}
                  <button
                    onClick={() => setLightboxIndex(0)}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[4/3]"
                  >
                    {gallery[0] ? (
                      <img src={gallery[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Package className="size-16" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                      <ProductBadge badge={product.badge} />
                      {product.isFeatured && (
                        <Badge className="border-0 bg-amber-500 text-white shadow-lg">★ Featured</Badge>
                      )}
                    </div>
                    {gallery.length > 1 && (
                      <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {gallery.length} photos
                      </div>
                    )}
                  </button>
                  {/* Thumbnails — vertical on desktop, hidden on mobile */}
                  {gallery.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible sm:w-24">
                      {gallery.slice(0, 4).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="relative aspect-square shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted transition-colors hover:border-brand sm:w-24"
                        >
                          <img src={img ?? undefined} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title + price + actions */}
                <div className="mt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{product.name}</h1>
                      {vendor && (
                        <Link
                          href={`/vendor/${vendor.slug}`}
                          className="mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          {vendor.avatarImage && (
                            <img src={vendor.avatarImage} alt={vendor.name} className="size-6 rounded-full object-cover ring-1 ring-border" />
                          )}
                          <span>by <span className="font-semibold text-foreground">{vendor.name}</span></span>
                          {vendor.verified && <BadgeCheck className="size-4 text-emerald-500" />}
                          {vendor.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {vendor.rating.toFixed(1)}
                              <span className="text-muted-foreground">({vendor.reviewCount})</span>
                            </span>
                          )}
                        </Link>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={toggleWishlist}
                        className={cn(
                          "grid size-10 place-items-center rounded-full border transition-colors",
                          wishlisted ? "border-rose-200 bg-rose-50 text-rose-500" : "border-border hover:bg-accent"
                        )}
                        aria-label="Save to wishlist"
                      >
                        <Heart className={cn("size-5", wishlisted && "fill-rose-500")} />
                      </button>
                      <button
                        onClick={share}
                        className="grid size-10 place-items-center rounded-full border border-border transition-colors hover:bg-accent"
                        aria-label="Share"
                      >
                        <Share2 className="size-5" />
                      </button>
                    </div>
                  </div>

                  {/* Rating + location */}
                  {vendor && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{vendor.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-4" />
                        {vendor.city}, {vendor.country}
                      </span>
                      {vendor.responseTime && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="size-4 text-brand" />
                          Responds {vendor.responseTime}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price — show offerPrice or variant price as main price */}
                  <div className="mt-4 flex items-baseline gap-2">
                    {(() => {
                      // If a variant is selected, show variant price
                      const variants = (() => {
                        const v = (product as any).variants;
                        if (Array.isArray(v)) return v;
                        if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
                        return [];
                      })();
                      const selVar = variants[selectedVariant];
                      if (selVar) {
                        const varPrice = Number(selVar.offerPrice || selVar.price || 0);
                        const varOrig = Number(selVar.price || 0);
                        return (
                          <>
                            <span className="text-3xl font-extrabold text-brand">
                              {symbol}{varPrice.toLocaleString()}
                            </span>
                            {selVar.offerPrice && varOrig > varPrice && (
                              <span className="text-lg text-muted-foreground line-through">
                                {symbol}{varOrig.toLocaleString()}
                              </span>
                            )}
                          </>
                        );
                      }
                      // Otherwise show product offerPrice or regular price
                      if (product.offerPrice && Number(product.offerPrice) < product.price) {
                        const pct = Math.round(((product.price - Number(product.offerPrice)) / product.price) * 100);
                        return (
                          <>
                            <span className="text-3xl font-extrabold text-brand">
                              {symbol}{Number(product.offerPrice).toLocaleString()}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              {symbol}{product.price.toLocaleString()}
                            </span>
                            {pct > 0 && <Badge className="border-0 bg-red-500 text-white">{pct}% OFF</Badge>}
                          </>
                        );
                      }
                      return (
                        <>
                          <span className="text-3xl font-extrabold text-brand">
                            {symbol}{product.price.toLocaleString()}
                          </span>
                          {product.comparePrice && Number(product.comparePrice) > product.price && (
                            <span className="text-lg text-muted-foreground line-through">
                              {symbol}{Number(product.comparePrice).toLocaleString()}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Quick badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vendor?.deliveryAvailable && (
                      <Badge className="border-0 bg-emerald-100 text-emerald-700"><Check className="size-3" /> Delivery</Badge>
                    )}
                    {vendor?.pickupAvailable && (
                      <Badge className="border-0 bg-emerald-100 text-emerald-700"><Check className="size-3" /> Pickup</Badge>
                    )}
                    {product.customisationAvailable && (
                      <Badge className="border-0 bg-blue-100 text-blue-700"><Check className="size-3" /> Customisation</Badge>
                    )}
                  </div>

                  {/* Availability & inventory banner */}
                  <div className="mt-3">
                    <ProductAvailabilityBanner
                      productId={product.id}
                      preparationTimeCategory={(product as any).preparationTimeCategory}
                      preparationTimeCustom={(product as any).preparationTimeCustom}
                      prepTime={(product as any).prepTime}
                      bookingNoticeHours={(product as any).bookingNoticeHours}
                      serviceAreaType={(product as any).serviceAreaType}
                      deliveryAvailable={(product as any).deliveryAvailable}
                      stockType={(product as any).stockType}
                      stockCount={(product as any).stockCount}
                      lowStockThreshold={(product as any).lowStockThreshold}
                      status={(product as any).status}
                    />
                  </div>

                  {/* ── Package / Variant Options ─────────────────────────── */}
                  {(() => {
                    const variants = (() => {
                      const v = (product as any).variants;
                      if (Array.isArray(v)) return v;
                      if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
                      return [];
                    })();
                    if (!variants.length || variants.length === 1) return null; // Hide if 0 or 1 variant
                    return (
                      <div className="mt-5 rounded-xl border border-border p-4">
                        <h4 className="mb-3 text-sm font-bold text-foreground">Choose Package</h4>
                        <div className="space-y-2">
                          {variants.map((variant: any, idx: number) => {
                            const isUnavailable = variant.available === false;
                            const varPrice = Number(variant.offerPrice || variant.price || 0);
                            const varOrig = Number(variant.price || 0);
                            const hasOffer = variant.offerPrice && varOrig > varPrice;
                            return (
                            <button
                              key={idx}
                              onClick={() => !isUnavailable && setSelectedVariant(idx)}
                              disabled={isUnavailable}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all",
                                isUnavailable
                                  ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                                  : selectedVariant === idx
                                    ? "border-brand bg-brand/5"
                                    : "border-border hover:border-brand/50"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={cn(
                                  "grid size-5 shrink-0 place-items-center rounded-full border-2",
                                  selectedVariant === idx && !isUnavailable ? "border-brand bg-brand" : "border-muted-foreground/30"
                                )}>
                                  {selectedVariant === idx && !isUnavailable && <div className="size-2 rounded-full bg-white" />}
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-sm font-semibold truncate">{variant.name || `Option ${idx + 1}`}</span>
                                  {variant.description && (
                                    <span className="block text-xs text-muted-foreground truncate">{variant.description}</span>
                                  )}
                                  {isUnavailable && (
                                    <span className="text-xs text-red-500">Currently unavailable</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {hasOffer && (
                                  <span className="text-xs text-muted-foreground line-through">{symbol}{varOrig.toLocaleString()}</span>
                                )}
                                <span className="text-sm font-bold text-brand">{symbol}{varPrice.toLocaleString()}</span>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ── AI Store Summary ────────────────────────────────── */}
              {vendor && <AIStoreSummary vendorId={vendor.id} />}

              {/* ── Tabs: Specs / Reviews / FAQ ──────────────────────── */}
              <div className="border-b border-border">
                <div className="flex gap-4">
                  {([
                    { id: "specs" as const, label: "Specifications" },
                    { id: "reviews" as const, label: "Reviews" },
                    { id: "faq" as const, label: "FAQ" },
                  ]).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "border-b-2 pb-3 text-sm font-semibold transition-colors",
                        activeTab === t.id
                          ? "border-brand text-brand"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specs tab */}
              {activeTab === "specs" && (
                <div className="space-y-4">
                  {/* Description */}
                  {product.description && (
                    <div>
                      <h2 className="mb-2 text-lg font-bold">Description</h2>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{product.description}</p>
                    </div>
                  )}

                  {/* Specifications grid */}
                  {specs.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-lg font-bold">Specifications</h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {specs.map((spec, i) => (
                          <div key={i} className="flex justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
                            <span className="text-muted-foreground">{spec.label}</span>
                            <span className="font-medium text-right">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What's included */}
                  {product.includes.length > 0 && (
                    <div>
                      <h2 className="mb-2 text-lg font-bold">What&apos;s Included</h2>
                      <ul className="space-y-1">
                        {product.includes.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dietary + Allergens */}
                  {(product.dietaryTags.length > 0 || product.allergens.length > 0) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {product.dietaryTags.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-bold">Dietary</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {product.dietaryTags.map((tag) => (
                              <Badge key={tag} className="border-0 bg-emerald-100 text-emerald-700">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.allergens.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-bold">Allergens</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {product.allergens.map((allergen) => (
                              <Badge key={allergen} className="border-0 bg-amber-100 text-amber-700">{allergen}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customisation */}
                  {product.customisationAvailable && (
                    <div className="rounded-xl border border-brand-border bg-brand-soft p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-bold">
                        <Sparkles className="size-4 text-brand" /> Customisation Available
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.customisationNotes || "Contact the vendor to customise this product to your needs."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews tab */}
              {activeTab === "reviews" && vendor && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4">
                    <div className="text-center">
                      <p className="text-4xl font-extrabold tabular-nums">{vendor.rating.toFixed(1)}</p>
                      <StarRating rating={vendor.rating} size={14} />
                      <p className="mt-1 text-xs text-muted-foreground">{vendor.reviewCount} reviews</p>
                    </div>
                  </div>
                  <AIReviewSummary vendorId={vendor.id} />
                  <p className="text-center text-sm text-muted-foreground">
                    <Link href={`/vendor/${vendor.slug}#reviews`} className="text-brand hover:underline">
                      See all reviews on vendor profile →
                    </Link>
                  </p>
                </div>
              )}

              {/* FAQ tab */}
              {activeTab === "faq" && vendor && (
                <AIFAQ vendorId={vendor.id} />
              )}

              {/* ── Vendor Preview ──────────────────────────────────── */}
              {vendor && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="mb-3 text-lg font-bold">About {vendor.name}</h2>
                  <div className="flex items-start gap-4">
                    {vendor.avatarImage && (
                      <Link href={`/vendor/${vendor.slug}`}>
                        <img src={vendor.avatarImage} alt={vendor.name} className="size-16 rounded-xl object-cover" />
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/vendor/${vendor.slug}`} className="font-bold hover:underline">{vendor.name}</Link>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{vendor.tagline}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{vendor.city}</span>
                        <span className="flex items-center gap-1"><Zap className="size-3" />{vendor.responseTime}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" />{vendor.yearsActive} yrs</span>
                      </div>
                    </div>
                    <Link href={`/vendor/${vendor.slug}`}>
                      <Button variant="outline" size="sm">Visit Store</Button>
                    </Link>
                  </div>
                  <div className="mt-3">
                    <FollowButton vendorId={vendor.id} />
                  </div>
                </div>
              )}

              {/* ── Related Products ────────────────────────────────── */}
              {related.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-bold">You may also like</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {related.map((rp) => (
                      <Link
                        key={rp.id}
                        href={`/product/${rp.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative aspect-square overflow-hidden">
                          {rp.image ? (
                            <img src={rp.image} alt={rp.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted">
                              <Package className="size-8 text-muted-foreground/40" />
                            </div>
                          )}
                          <ProductBadge badge={rp.badge} />
                        </div>
                        <div className="p-2">
                          <p className="line-clamp-1 text-xs font-bold">{rp.name}</p>
                          <p className="mt-0.5 text-xs font-bold text-brand">{symbol}{((rp as any).offerPrice || rp.price).toLocaleString()}</p>
                          {rp.vendor && (
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">by {rp.vendor.name}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: Sticky smart enquiry form ────────────── */}
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              {vendor && (() => {
                const variants = (() => {
                  const v = (product as any).variants;
                  if (Array.isArray(v)) return v;
                  if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
                  return [];
                })();
                const selVar = variants[selectedVariant];
                return (
                <SmartEnquiryForm
                  vendorId={vendor.id}
                  vendorName={vendor.name}
                  vendorCity={vendor.city}
                  productId={product.id}
                  productName={selVar ? `${product.name} — ${selVar.name}` : product.name}
                  productPrice={selVar ? Number(selVar.offerPrice || selVar.price || 0) : (product.offerPrice || product.price)}
                  currencySymbol={symbol}
                  eventType={product.productType || product.packageType || undefined}
                />
                );
              })()}
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />

      {/* Josh AI */}
      {vendor && (
        <VendorAIChat
          vendorId={vendor.id}
          vendorName={vendor.name}
          vendorCategory={vendor.category}
          vendorCity={vendor.city}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-6" />
          </button>
          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i === null ? 0 : (i - 1 + gallery.length) % gallery.length); }}
              className="absolute left-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <img
            src={gallery[lightboxIndex]}
            alt={`${product.name} photo ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i === null ? 0 : (i + 1) % gallery.length); }}
              className="absolute right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Product Enquiry / Booking Form ────────────────────────────────────────
function ProductEnquiryForm({
  product,
  vendor,
  symbol,
  selectedVariant = 0,
}: {
  product: ProductData["product"];
  vendor: ProductData["vendor"];
  symbol: string;
  selectedVariant?: number;
}) {
  const createBooking = useCreateBooking();
  const [done, setDone] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    whatsapp: "",
    eventDate: "",
    guests: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.eventDate;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !vendor) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createBooking.mutateAsync({
        vendorId: vendor.id,
        name: form.name.trim(),
        email: form.email.trim(),
        eventType: product.productType || product.packageType || "Enquiry",
        eventDate: form.eventDate,
        eventCity: vendor.city,
        guests: parseInt(form.guests, 10) || 0,
        budget: `${symbol}${product.offerPrice || product.price}`,
        message: form.message.trim() || `Enquiry for ${product.name}`,
      });
      setDone(true);
      toast.success("Enquiry sent!", { description: `${vendor.name} will respond shortly.` });
      // Track
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id, eventType: "contact_click", productId: product.id }),
      }).catch(() => {});
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-soft p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
          <Check className="size-7" />
        </div>
        <h3 className="mt-3 text-lg font-bold">Enquiry sent! ✅</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {vendor?.name} typically replies within {vendor?.responseTime}.
        </p>
        {vendor?.whatsapp && (() => {
          const variants = (() => {
            const v = (product as any).variants;
            if (Array.isArray(v)) return v;
            if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
            return [];
          })();
          const selectedVar = variants[selectedVariant || 0];
          const msg = selectedVar
            ? `Hi, I'm interested in ${product.name} — ${selectedVar.name} (${symbol}${selectedVar.price || selectedVar.offerPrice})`
            : `Hi, I'm interested in ${product.name}`;
          return (
          <a
            href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1da851]"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          );
        })()}
        <Button variant="outline" className="mt-2 w-full" onClick={() => setDone(false)}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div>
        <p className="text-lg font-bold">{symbol}{(product.offerPrice || product.price).toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{product.packageType || "Package"}</p>
      </div>
      <Field label="Your name" required>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="h-10" />
      </Field>
      <Field label="Your email" required>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@email.com" className="h-10" />
      </Field>
      <Field label="WhatsApp (optional)">
        <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+44 7700 900123" className="h-10" inputMode="tel" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Event date" required>
          <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="h-10" />
        </Field>
        <Field label="Guests">
          <Input type="number" min={1} value={form.guests} onChange={(e) => set("guests", e.target.value)} placeholder="50" className="h-10" />
        </Field>
      </div>
      <Field label="Message">
        <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder={`I'm interested in ${product.name}...`} rows={3} className="resize-none" />
      </Field>
      <Button type="submit" disabled={createBooking.isPending || !valid} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {createBooking.isPending ? (<><Loader2 className="size-4 animate-spin" /> Sending…</>) : (<><Send className="size-4" /> Send Enquiry</>)}
      </Button>

      {/* Quick contact options */}
      <div className="flex flex-wrap gap-2 pt-1">
        {vendor?.whatsapp && (
          <a
            href={`https://wa.me/${vendor.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1da851]"
          >
            <MessageCircle className="size-3.5" /> WhatsApp
          </a>
        )}
        {vendor?.website && (
          <a
            href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-muted/80"
          >
            <Globe className="size-3.5" /> Website
          </a>
        )}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Shield className="size-3" /> Your details go directly to {vendor?.name} only
      </p>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
