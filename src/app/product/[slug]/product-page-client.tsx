"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ZoomIn,
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
import { StickyBookingBar } from "@/components/marketplace/sticky-booking-bar";
import { ProductAvailabilityBanner } from "@/components/inventory/product-availability-banner";
import { ProductDetailView, type ProductViewData } from "@/components/product/ProductDetailView";
import { ProductInfoDisplay } from "@/components/dashboard/product-info-display";
import { ProductFAQSection } from "@/components/dashboard/product-faq-section";
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
    fetch(`/api/products/detail?slug=${encodeURIComponent(slug)}`)
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
  const gallery: string[] = product.images.length > 0 ? product.images : [product.image].filter((x): x is string => Boolean(x));
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
      <main className="flex-1 pb-24 lg:pb-0">
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
              {/* ── Product Detail — shared component (same as wizard preview) ── */}
              <ProductDetailView
                mode="live"
                product={{
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  shortDescription: (product as any).shortDescription,
                  price: product.price,
                  offerPrice: product.offerPrice,
                  comparePrice: product.comparePrice,
                  discountPercent: product.discountPercent,
                  currency: product.currency,
                  currencySymbol: symbol,
                  image: product.image,
                  images: gallery,
                  packageType: product.packageType,
                  badge: product.badge,
                  isFeatured: product.isFeatured,
                  isAvailable: product.isAvailable,
                  variants: (product as any).variants,
                  deliveryAvailable: (product as any).deliveryAvailable ?? vendor?.deliveryAvailable,
                  pickupAvailable: (product as any).pickupAvailable ?? vendor?.pickupAvailable,
                  vegetarian: (product as any).vegetarian,
                  vegan: (product as any).vegan,
                  halal: (product as any).halal,
                  glutenFree: (product as any).glutenFree,
                  eggless: (product as any).eggless,
                  category: (product as any).category,
                  capacity: (product as any).capacity,
                  duration: (product as any).duration,
                  servings: (product as any).servings,
                  weight: (product as any).weight,
                } as ProductViewData}
                vendor={vendor ? {
                  id: vendor.id,
                  name: vendor.name,
                  slug: vendor.slug,
                  city: vendor.city,
                  avatarImage: vendor.avatarImage,
                  verified: vendor.verified,
                  rating: vendor.rating,
                  reviewCount: vendor.reviewCount,
                  whatsapp: vendor.whatsapp,
                  ecosystem: vendor.ecosystem,
                } : null}
                selectedVariant={selectedVariant}
                onVariantSelect={setSelectedVariant}
                onWhatsApp={() => {
                  const variants = (() => {
                    const v = (product as any).variants;
                    if (Array.isArray(v)) return v;
                    if (typeof v === "string" && v.trim()) { try { return JSON.parse(v); } catch { return []; } }
                    return [];
                  })();
                  const selVar = variants[selectedVariant];
                  if (vendor?.whatsapp) {
                    const msg = selVar
                      ? `Hi, I'm interested in ${product.name} — ${selVar.name} (${symbol}${selVar.offerPrice || selVar.price})`
                      : `Hi, I'm interested in ${product.name}`;
                    window.open(`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
                  }
                }}
                onWishlist={toggleWishlist}
                isWishlisted={wishlisted}
                onImageClick={(i) => setLightboxIndex(i)}
              />

              {/* Availability banner */}
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

                  {/* Product Information System — Ingredients, Packaging, Storage, etc. */}
                  {(product as any).productInfo && Object.keys((product as any).productInfo).length > 0 && (
                    <>
                      <ProductInfoDisplay
                        productInfo={(product as any).productInfo}
                        category={(product as any).category}
                      />
                      {/* Auto-generated FAQs from Product Information for SEO */}
                      <ProductFAQSection
                        productName={product.name}
                        productInfo={(product as any).productInfo}
                      />
                    </>
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
                        <img loading="lazy" src={vendor.avatarImage} alt={vendor.name} className="size-16 rounded-xl object-cover" />
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
                            <img loading="lazy" src={rp.image} alt={rp.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
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
            <aside id="booking-sidebar" className="space-y-4 lg:sticky lg:top-6 lg:self-start">
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

      {/* ── Sticky booking bar — always-visible Book Now (desktop top + mobile bottom) ── */}
      <StickyBookingBar
        priceLabel={`${symbol}${(product.offerPrice || product.price).toLocaleString()}`}
        subLabel={
          product.minGuests
            ? `Min ${product.minGuests} guests`
            : vendor?.city
              ? vendor.city
              : undefined
        }
        rating={vendor?.rating}
        reviewCount={vendor?.reviewCount}
        whatsappLink={
          vendor?.whatsapp
            ? `https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}`)}`
            : undefined
        }
        onBook={() => {
          document.getElementById("booking-sidebar")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

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

      {/* Lightbox — keyboard nav, mobile swipe, click-to-zoom */}
      <AnimatePresence>
        {lightboxIndex !== null && gallery[lightboxIndex] && (
          <Lightbox
            images={gallery}
            index={lightboxIndex}
            name={product.name}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
 * Lightbox — premium fullscreen gallery viewer
 * Keyboard: ←/→ navigate, Esc close, click image to zoom
 * Mobile: swipe left/right to navigate
 * ========================================================================== */

function Lightbox({
  images, index, name, onClose, onNavigate,
}: {
  images: string[];
  index: number;
  name: string;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const [zoomed, setZoomed] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  // Keyboard navigation
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); setZoomed(false); }
      else if (e.key === "ArrowRight") { onNavigate((index + 1) % images.length); setZoomed(false); }
      else if (e.key === "ArrowLeft") { onNavigate((index - 1 + images.length) % images.length); setZoomed(false); }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onNavigate]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) onNavigate((index + 1) % images.length);
      else onNavigate((index - 1 + images.length) % images.length);
      setZoomed(false);
    }
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close gallery"
        className="absolute right-4 top-4 z-10 grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <X className="size-6" aria-hidden />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); setZoomed(false); }}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % images.length); setZoomed(false); }}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronRight className="size-6" aria-hidden />
        </button>
      )}

      {/* Image */}
      <motion.img
        key={index}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: zoomed ? 1.8 : 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
        src={images[index]}
        alt={`${name} photo ${index + 1}`}
        onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
        className="max-h-[85vh] max-w-[90vw] cursor-zoom-in rounded-lg object-contain shadow-2xl"
      />

      {/* Counter + hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
        {index + 1} / {images.length}
      </div>
      <div className="absolute bottom-6 right-6 hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 backdrop-blur sm:flex">
        <ZoomIn className="size-3.5" aria-hidden /> Click to zoom · ← → to navigate
      </div>
    </motion.div>
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
