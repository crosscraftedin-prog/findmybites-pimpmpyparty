"use client";

import * as React from "react";
import Link from "next/link";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  BadgeCheck,
  MapPin,
  Clock,
  Calendar,
  Star,
  Users,
  Sparkles,
  MessageSquareQuote,
  CalendarPlus,
  Loader2,
  Instagram,
  Globe,
  MessageCircle,
  Navigation,
  Pencil,
  Package,
  CheckCircle2,
  Truck,
  Store as StoreIcon,
  Clock3,
  MapPinned,
  Zap,
  Image as ImageIcon,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/lib/store";
import { useVendor, useReviews, useProducts } from "@/lib/queries";
import { getCategoryMigrated, CURRENCY_SYMBOLS } from "@/lib/constants";
import { formatPrice, countryCodeToFlag } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./icon";
import { VendorImage } from "./vendor-image";
import { StarRating } from "./star-rating";
import { ReviewList } from "./review-list";
import { ReviewForm } from "./review-form";
import { BookingForm } from "./booking-form";
import type { Product as ApiProduct } from "@/lib/types";

export function VendorModal() {
  const slug = useMarketplace((s) => s.selectedVendorSlug);
  const closeVendor = useMarketplace((s) => s.closeVendor);
  const openEditVendor = useMarketplace((s) => s.openEditVendor);
  const openAuthDialog = useMarketplace((s) => s.openAuthDialog);
  const setAuthIntent = useMarketplace((s) => s.setAuthIntent);
  const { user: session } = useSupabaseSession();
  const { isAdmin } = useIsAdmin();
  const { data: vendor, isLoading } = useVendor(slug);

  // Only show Edit button to the vendor owner OR admin (SECURITY)
  const isOwner = vendor?.owner_user_id === session?.id;
  const canEdit = isOwner || isAdmin;
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews(
    vendor?.id ?? null
  );
  const { data: productsData } = useProducts(vendor?.id ?? null);
  const products = productsData?.products ?? [];
  const [selectedProduct, setSelectedProduct] = React.useState<ApiProduct | null>(null);

  const onEditClick = () => {
    if (!vendor) return;
    if (session) {
      openEditVendor(vendor.slug);
    } else {
      setAuthIntent(`edit-vendor:${vendor.slug}`);
      openAuthDialog();
    }
  };

  const cat = vendor ? getCategoryMigrated(vendor.category) : undefined;
  const reviews = reviewsData?.reviews ?? vendor?.reviews ?? [];

  return (
    <>
    <Dialog open={!!slug} onOpenChange={(o) => !o && closeVendor()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogTitle className="sr-only">
          {vendor?.name ?? "Vendor details"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Vendor profile, reviews and booking form.
        </DialogDescription>

        {isLoading || !vendor ? (
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-brand" />
              <span className="text-sm text-muted-foreground">
                Loading vendor…
              </span>
            </div>
            <Skeleton className="mt-4 h-56 w-full rounded-2xl" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex max-h-[92vh] flex-col">
            {/* Hero image */}
            <div className="relative h-44 shrink-0 sm:h-56">
              <VendorImage
                src={vendor.heroImage}
                alt={vendor.name}
                accent={cat?.accent ?? "from-amber-400 to-orange-500"}
                className="h-full w-full"
                categoryIcon={
                  <CategoryIcon
                    name={cat?.icon ?? "UtensilsCrossed"}
                    className="size-16"
                  />
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* Edit listing button — ONLY for owner or admin (SECURITY) */}
              {canEdit && (
              <button
                onClick={onEditClick}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/75"
                aria-label="Edit this listing"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              )}
              {/* Logo avatar (only if the vendor uploaded a distinct logo) */}
              {vendor.avatarImage && vendor.avatarImage !== vendor.heroImage && (
                <div className="absolute -bottom-8 left-4 size-20 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-lg sm:left-6 sm:size-24">
                  <img
                    src={vendor.avatarImage}
                    alt={`${vendor.name} logo`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {cat && (
                    <Badge className="border-0 bg-white/90 text-foreground backdrop-blur">
                      <CategoryIcon name={cat.icon} className="size-3" />
                      {cat.label}
                    </Badge>
                  )}
                  {vendor.subcategory && (
                    <Badge className="border-0 bg-white/70 text-foreground backdrop-blur">
                      {vendor.subcategory}
                    </Badge>
                  )}
                  {vendor.featured && (
                    <Badge className="border-0 bg-brand text-brand-foreground">
                      <Sparkles className="size-3" /> Featured
                    </Badge>
                  )}
                  {vendor.verified && (
                    <Badge className="border-0 bg-emerald-500 text-white">
                      <BadgeCheck className="size-3" /> Verified
                    </Badge>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                  {vendor.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {countryCodeToFlag(vendor.countryCode)} {vendor.city},{" "}
                    {vendor.country}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <StarRating
                      rating={vendor.rating}
                      size={13}
                      showValue
                      count={vendor.reviewCount}
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* Verification + badges row */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {vendor.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
                      <ShieldCheck className="size-3" /> Verified Business
                    </span>
                  )}
                  {vendor.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-brand-foreground">
                      <Star className="size-3 fill-current" /> Featured
                    </span>
                  )}
                  {vendor.approved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-[11px] font-bold text-white">
                      <CheckCircle2 className="size-3" /> Approved
                    </span>
                  )}
                  {vendor.deliveryAvailable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                      <Truck className="size-3" /> Delivery
                    </span>
                  )}
                  {vendor.pickupAvailable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                      <StoreIcon className="size-3" /> Pickup
                    </span>
                  )}
                </div>

                {/* Enhanced stat strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat
                    icon={<CalendarPlus className="size-4" />}
                    label="Starting at"
                    value={formatPrice(vendor.basePrice, vendor.currency)}
                  />
                  <Stat
                    icon={<Clock className="size-4" />}
                    label="Responds"
                    value={vendor.responseTime}
                  />
                  <Stat
                    icon={<TrendingUp className="size-4" />}
                    label="Completed"
                    value={`${vendor.completedBookings}+`}
                  />
                  <Stat
                    icon={<Calendar className="size-4" />}
                    label="Experience"
                    value={`${vendor.yearsActive} yrs`}
                  />
                </div>

                {/* Response rate + travel radius mini-stats */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                    <Zap className="size-3 text-amber-500" />
                    {Math.min(98, 70 + vendor.completedBookings)}% response rate
                  </span>
                  {vendor.serviceRadiusKm != null && vendor.serviceRadiusKm > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                      <MapPinned className="size-3 text-brand" />
                      Travels {vendor.serviceRadiusKm}km
                    </span>
                  )}
                  {vendor.openHours && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs">
                      <Clock3 className="size-3 text-emerald-500" />
                      {vendor.openHours}
                    </span>
                  )}
                </div>

                {/* Tagline + description */}
                <p className="mt-5 text-base font-semibold leading-snug">
                  {vendor.tagline}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {vendor.description}
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {vendor.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-soft-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Service areas */}
                {vendor.serviceAreas && (
                  <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <MapPinned className="size-3.5 text-brand" />
                      Service Areas
                    </p>
                    <p className="text-sm">{vendor.serviceAreas}</p>
                  </div>
                )}

                {/* Featured products preview (show first 2) */}
                {products.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Package className="size-4 text-brand" />
                      {vendor.ecosystem === "FINDMYBITES" ? "Featured Products" : "Featured Packages"}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {products.slice(0, 2).map((p) => {
                        const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency;
                        const pImages = p.images ?? (p.image ? [p.image] : []);
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className="cursor-pointer rounded-xl border border-border bg-card p-3 transition-all hover:border-brand-border hover:shadow-md"
                          >
                            {pImages.length > 0 && (
                              <div className="mb-2 aspect-video overflow-hidden rounded-lg">
                                <img src={pImages[0]} alt={p.name} className="h-full w-full object-cover" />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold">{p.name}</p>
                              <span className="shrink-0 text-sm font-bold tabular-nums">
                                {symbol}{p.price.toLocaleString("en-US")}
                              </span>
                            </div>
                            {p.productType && (
                              <span className="mt-1 inline-block rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium capitalize text-brand-soft-foreground">
                                {p.productType}
                              </span>
                            )}
                            {(p.sizes || p.flavours) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {p.sizes && `📏 ${p.sizes}`}
                                {p.sizes && p.flavours && " · "}
                                {p.flavours && `🍰 ${p.flavours}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Photo gallery */}
                {vendor.gallery && vendor.gallery.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <ImageIcon className="size-4 text-brand" />
                      Gallery
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {vendor.gallery.slice(0, 6).map((img, i) => (
                        <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border">
                          <img src={img} alt={`${vendor.name} photo ${i + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Maps embed */}
                {vendor.latitude != null && vendor.longitude != null && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <MapPin className="size-4 text-brand" />
                      Location
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <iframe
                        src={`https://maps.google.com/maps?q=${vendor.latitude},${vendor.longitude}&z=14&output=embed`}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        loading="lazy"
                        title={`${vendor.name} location`}
                      />
                    </div>
                  </div>
                )}

                {/* Address + contact bar */}
                {(vendor.address ||
                  vendor.zipCode ||
                  vendor.instagram ||
                  vendor.website ||
                  vendor.whatsapp) && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                    {/* Full address */}
                    {(vendor.address || vendor.zipCode) && (
                      <div className="flex items-start gap-2 text-sm">
                        <Navigation className="mt-0.5 size-4 shrink-0 text-brand" />
                        <div>
                          {vendor.address && <p>{vendor.address}</p>}
                          <p className="text-muted-foreground">
                            {vendor.city}
                            {vendor.state ? `, ${vendor.state}` : ""}
                            {vendor.zipCode ? ` ${vendor.zipCode}` : ""} ·{" "}
                            {vendor.country}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Contact buttons */}
                    {(vendor.instagram ||
                      vendor.website ||
                      vendor.whatsapp) && (
                      <div className="flex flex-wrap gap-2">
                        {vendor.whatsapp && (
                          <a
                            href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(
                              `Hi ${vendor.name}, I found you on FindMyBites × PimpMyParty and I'd like to enquire about your services.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
                          >
                            <MessageCircle className="size-3.5" />
                            WhatsApp
                          </a>
                        )}
                        {vendor.instagram && (
                          <a
                            href={`https://instagram.com/${vendor.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                          >
                            <Instagram className="size-3.5" />
                            @{vendor.instagram}
                          </a>
                        )}
                        {vendor.website && (
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                          >
                            <Globe className="size-3.5" />
                            Website
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Instant quote CTA */}
                <div className="mt-5">
                  <Button
                    onClick={() => {
                      const tabsEl = document.querySelector('[data-slot="tabs-trigger"][value="book"]') as HTMLElement;
                      tabsEl?.click();
                    }}
                    className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    <Zap className="size-4" />
                    Get Instant Quote
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue={products.length > 0 ? "products" : "book"} className="mt-4">
                  <TabsList className={cn("grid w-full", products.length > 0 ? "grid-cols-3" : "grid-cols-2")}>
                    {products.length > 0 && (
                      <TabsTrigger value="products">
                        <Package className="size-4" />
                        Products ({products.length})
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="book">
                      <CalendarPlus className="size-4" />
                      Book
                    </TabsTrigger>
                    <TabsTrigger value="reviews">
                      <MessageSquareQuote className="size-4" />
                      Reviews ({vendor.reviewCount})
                    </TabsTrigger>
                  </TabsList>

                  {products.length > 0 && (
                    <TabsContent value="products" className="mt-4">
                      <div className="space-y-3">
                        {products.map((p) => {
                          const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency;
                          const pImages = p.images ?? (p.image ? [p.image] : []);
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedProduct(p)}
                              className="cursor-pointer rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand-border hover:shadow-md"
                            >
                              <div className="flex items-start gap-3">
                                {pImages.length > 0 && (
                                  <div className="size-16 shrink-0 overflow-hidden rounded-lg">
                                    <img src={pImages[0]} alt={p.name} className="h-full w-full object-cover" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold">{p.name}</h4>
                                    {p.productType && (
                                      <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium capitalize text-brand-soft-foreground">
                                        {p.productType}
                                      </span>
                                    )}
                                  </div>
                                  {p.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-lg font-extrabold tabular-nums">
                                    {symbol}{p.price.toLocaleString("en-US")}
                                  </p>
                                  {p.pricePerHead != null && (
                                    <p className="text-xs text-muted-foreground">
                                      {symbol}{p.pricePerHead}/head
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* attributes */}
                              {(p.sizes || p.flavours || p.weight || p.prepTime || p.minGuests || p.deliveryAvailable) && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {p.sizes && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">📏 {p.sizes}</span>}
                                  {p.flavours && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">🍰 {p.flavours}</span>}
                                  {p.weight && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">⚖️ {p.weight}</span>}
                                  {p.prepTime && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">⏱️ {p.prepTime}</span>}
                                  {p.minGuests != null && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">👥 Min {p.minGuests} guests</span>}
                                  {p.deliveryAvailable && <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700">🚚 Delivery available</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="book" className="mt-4">
                    <BookingForm vendorId={vendor.id} />
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-4 space-y-5">
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center rounded-xl bg-brand text-brand-foreground">
                          <Star className="size-6 fill-current" />
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold tabular-nums">
                            {vendor.rating.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Based on {vendor.reviewCount} review
                            {vendor.reviewCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ReviewList
                      reviews={reviews}
                      isLoading={reviewsLoading && !vendor.reviews?.length}
                    />
                    <ReviewForm vendorId={vendor.id} />
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Product detail modal */}
    <ProductDetailModal
      product={selectedProduct}
      currency={vendor?.currency ?? "USD"}
      onClose={() => setSelectedProduct(null)}
    />
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1 text-sm font-bold capitalize">{value}</p>
    </div>
  );
}

// ── Product detail modal ────────────────────────────────────────────────────
function ProductDetailModal({
  product,
  currency,
  onClose,
}: {
  product: ApiProduct | null;
  currency: string;
  onClose: () => void;
}) {
  const [activeImage, setActiveImage] = React.useState(0);

  React.useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

  if (!product) return null;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  // Handle both 'images' (array) and 'image' (single) fields
  const images = product.images ?? (product.image ? [product.image] : []);
  const hasVideo = product.videoUrl && (
    product.videoUrl.includes("youtube.com") ||
    product.videoUrl.includes("youtu.be") ||
    product.videoUrl.includes("vimeo.com")
  );

  // Extract YouTube embed URL
  let embedUrl = "";
  if (product.videoUrl) {
    if (product.videoUrl.includes("youtu.be/")) {
      embedUrl = `https://www.youtube.com/embed/${product.videoUrl.split("youtu.be/")[1]?.split("?")[0]}`;
    } else if (product.videoUrl.includes("watch?v=")) {
      embedUrl = `https://www.youtube.com/embed/${product.videoUrl.split("watch?v=")[1]?.split("&")[0]}`;
    } else if (product.videoUrl.includes("vimeo.com/")) {
      embedUrl = `https://player.vimeo.com/video/${product.videoUrl.split("vimeo.com/")[1]?.split("?")[0]}`;
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">Product details</DialogDescription>
        <ScrollArea className="max-h-[90vh] overflow-y-auto">
          {/* Image gallery — clickable thumbnails */}
          {images.length > 0 && (
            <div className="relative aspect-video overflow-hidden bg-muted">
              <img src={images[activeImage] ?? images[0]} alt={product.name} className="h-full w-full object-cover" />
              {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`size-12 overflow-hidden rounded-lg border-2 transition-all ${
                        i === activeImage ? "border-white opacity-100" : "border-white/40 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-5">
            {/* Title + price */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                {product.productType && (
                  <span className="mt-1 inline-block rounded bg-brand-soft px-2 py-0.5 text-[11px] font-medium capitalize text-brand-soft-foreground">
                    {product.productType}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular-nums">
                  {symbol}{product.price.toLocaleString("en-US")}
                </p>
                {product.pricePerHead != null && (
                  <p className="text-xs text-muted-foreground">{symbol}{product.pricePerHead}/head</p>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            {/* Video embed */}
            {hasVideo && embedUrl && (
              <div className="mt-4 overflow-hidden rounded-xl">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={product.name}
                />
              </div>
            )}

            {/* Attributes */}
            {(product.sizes || product.flavours || product.weight || product.prepTime || product.servings || product.shape || product.minGuests != null || product.eggless || product.sameDay || product.customOrder || product.deliveryAvailable || product.pickupAvailable || product.featured) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.featured && <span className="rounded-lg bg-brand-soft px-2 py-1 text-[11px] font-bold text-brand-soft-foreground">⭐ Featured</span>}
                {product.sizes && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">📏 {product.sizes}</span>}
                {product.flavours && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">🍰 {product.flavours}</span>}
                {product.weight && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">⚖️ {product.weight}</span>}
                {product.servings && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">🍽️ {product.servings}</span>}
                {product.shape && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">⬡ {product.shape}</span>}
                {product.eggless && <span className="rounded-lg bg-green-100 px-2 py-1 text-[11px] text-green-700">🥚 Eggless</span>}
                {product.prepTime && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">⏱️ {product.prepTime}</span>}
                {product.minGuests != null && <span className="rounded-lg bg-muted px-2 py-1 text-[11px]">👥 Min {product.minGuests} guests</span>}
                {product.sameDay && <span className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] text-amber-700">⚡ Same-day</span>}
                {product.customOrder && <span className="rounded-lg bg-purple-100 px-2 py-1 text-[11px] text-purple-700">🎨 Custom orders</span>}
                {product.deliveryAvailable && <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700">🚚 Delivery</span>}
                {product.pickupAvailable && <span className="rounded-lg bg-blue-100 px-2 py-1 text-[11px] text-blue-700">🏪 Pickup</span>}
              </div>
            )}

            {/* Extra category fields */}
            {product.extraFields && Object.entries(product.extraFields).filter(([, v]) => v).length > 0 && (
              <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Details</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(product.extraFields).filter(([, v]) => v).map(([k, v]) => (
                    <span key={k} className="rounded bg-background px-2 py-0.5 text-[11px]">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
