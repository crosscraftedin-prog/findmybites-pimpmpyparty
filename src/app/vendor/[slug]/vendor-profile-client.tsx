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
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  PartyPopper,
  Send,
  Shield,
  Share2,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { LocationBanner } from "@/components/marketplace/location-banner";
import { CategoryIcon } from "@/components/marketplace/icon";
import { VendorImage } from "@/components/marketplace/vendor-image";
import { StarRating } from "@/components/marketplace/star-rating";
import { VendorCard } from "@/components/marketplace/vendor-card";
import { CountdownTimer } from "@/components/marketplace/countdown-timer";
import { useProducts, useVendors, useCreateBooking } from "@/lib/queries";
import { getCategoryMigrated, CURRENCY_SYMBOLS } from "@/lib/constants";
import { formatPrice, countryCodeToFlag, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VendorAIChat } from "@/components/marketplace/vendor-ai-chat";
import { AIStoreSummary, AIFAQ, AIReviewSummary } from "@/components/marketplace/vendor-ai-sections";
import { VendorHighlights, FollowButton, InstantQuoteEstimator, ProductBadge } from "@/components/marketplace/vendor-highlights";
import type { VendorWithRelations, Product } from "@/lib/types";

const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Corporate",
  "Kids party",
  "Anniversary",
  "Other",
];

interface Props {
  vendor: VendorWithRelations;
}

export function VendorProfileClient({ vendor }: Props) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [visibleReviews, setVisibleReviews] = React.useState(3);
  const [productFilter, setProductFilter] = React.useState<string>("all");

  // Products (menu / services)
  const { data: productsData } = useProducts(vendor.id);
  const products = productsData?.products ?? [];

  // ── Analytics: track page view on mount ──
  React.useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: vendor.id,
        eventType: "page_view",
        referrer: document.referrer || null,
      }),
    }).catch(() => {}); // analytics should never break the page
  }, [vendor.id]);

  // ── Analytics: track click events ──
  const trackClick = (eventType: string) => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: vendor.id, eventType }),
    }).catch(() => {});
  };

  // Similar vendors — fetched from dedicated API
  const [similarVendors, setSimilarVendors] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch(`/api/vendors/similar?vendorId=${vendor.id}&limit=4&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => setSimilarVendors(d.vendors ?? []))
      .catch(() => setSimilarVendors([]));
  }, [vendor.id]);

  // Filtered products (in-storefront filter) — featured/badged products first
  const filteredProducts = React.useMemo(() => {
    const filtered = productFilter === "all"
      ? products
      : products.filter((p) => (p as any).packageType === productFilter);
    // Sort: badge (featured > bestseller > new > seasonal > limited) > isFeatured > rest
    const badgeOrder: Record<string, number> = { featured: 0, bestseller: 1, new: 2, seasonal: 3, limited: 4 };
    return [...filtered].sort((a, b) => {
      const aBadge = (a as any).badge;
      const bBadge = (b as any).badge;
      const aOrder = aBadge ? (badgeOrder[aBadge] ?? 5) : 99;
      const bOrder = bBadge ? (badgeOrder[bBadge] ?? 5) : 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      if ((a as any).isFeatured && !(b as any).isFeatured) return -1;
      if (!(a as any).isFeatured && (b as any).isFeatured) return 1;
      return 0;
    });
  }, [products, productFilter]);
  const productTypes = React.useMemo(() => {
    const types = new Set(products.map((p) => (p as any).packageType).filter(Boolean));
    return ["all", ...Array.from(types)];
  }, [products]);

  const cat = getCategoryMigrated(vendor.category);
  // Fallback: if the category doesn't match any known category ID,
  // create a synthetic category def so the badge still shows.
  const catDisplay = cat ?? {
    id: vendor.category,
    ecosystem: vendor.ecosystem,
    label: vendor.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "",
    icon: "UtensilsCrossed",
    image: "",
    accent: "from-amber-400 to-orange-500",
  };
  const isFoodVendor = vendor.ecosystem === "FINDMYBITES";
  const gallery = vendor.gallery.length > 0 ? vendor.gallery : [vendor.heroImage].filter(Boolean);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.length));
  const prevImage = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));

  React.useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const share = async () => {
    trackClick("share_click");
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: vendor.name, url });
      } catch {}
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <LocationBanner />
      <main className="flex-1">
        {/* Back link */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        {/* ── 1. HERO HEADER ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            {/* Banner */}
            <div className="relative h-48 w-full overflow-hidden sm:h-64 md:h-80">
              <VendorImage
                src={vendor.heroImage}
                alt={vendor.name}
                accent={catDisplay.accent}
                className="h-full w-full"
                categoryIcon={<CategoryIcon name={catDisplay.icon} className="size-20" />}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top right actions */}
              <div className="absolute right-3 top-3 flex gap-2">
                <FollowButton vendorId={vendor.id} />
                <button
                  onClick={() => setLiked((v) => !v)}
                  aria-label="Save"
                  className={cn(
                    "grid size-10 place-items-center rounded-full backdrop-blur transition-colors",
                    liked ? "bg-rose-500 text-white" : "bg-white/90 text-muted-foreground hover:bg-white"
                  )}
                >
                  <Heart className={cn("size-5", liked && "fill-white")} />
                </button>
                <button
                  onClick={share}
                  aria-label="Share"
                  className="grid size-10 place-items-center rounded-full bg-white/90 text-muted-foreground backdrop-blur transition-colors hover:bg-white"
                >
                  <Share2 className="size-5" />
                </button>
              </div>

              {/* Overlay text at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <div className="flex items-end gap-4">
                  {/* Avatar (overlapping) */}
                  <div className="-mb-8 size-20 shrink-0 overflow-hidden rounded-full border-4 border-card bg-card shadow-lg sm:-mb-12 sm:size-24">
                    <VendorImage
                      src={vendor.avatarImage}
                      alt={`${vendor.name} logo`}
                      accent={catDisplay.accent}
                      className="h-full w-full"
                    />
                  </div>
                  {/* Name + badges */}
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <h1 className="truncate text-xl font-extrabold tracking-tight text-white sm:text-3xl">
                        {vendor.name}
                      </h1>
                      {vendor.verified && (
                        <Badge className="border-0 bg-emerald-500 text-white">
                          <BadgeCheck className="size-3" />
                          Verified
                        </Badge>
                      )}
                      {vendor.featured && (
                        <Badge className="border-0 bg-amber-500 text-white">
                          <Sparkles className="size-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
                      {catDisplay && (
                        <Badge variant="secondary" className="border-0 bg-white/20 text-white backdrop-blur">
                          <CategoryIcon name={catDisplay.icon} className="size-3" />
                          {catDisplay.label}
                        </Badge>
                      )}
                      {vendor.subcategory && (
                        <Badge variant="secondary" className="border-0 bg-white/20 text-white backdrop-blur">
                          {vendor.subcategory}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{vendor.rating.toFixed(1)}</span>
                        <span className="text-white/70">· {vendor.reviewCount} reviews</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {countryCodeToFlag(vendor.countryCode)} {vendor.city}, {vendor.country}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. QUICK INFO BAR ───────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-10 sm:px-6 sm:pt-12 md:px-8">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 text-brand" />
                Responds {vendor.responseTime}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-4 text-brand" />
                {vendor.yearsActive} years active
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-bold text-brand">{vendor.priceRange}</span>
                · From {formatPrice(vendor.basePrice, vendor.currency)}
              </span>
              {vendor.serviceRadiusKm && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Navigation className="size-4 text-brand" />
                  Serves up to {vendor.serviceRadiusKm}km away
                </span>
              )}
              {vendor.whatsapp && (
                <a
                  href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(
                    `Hi ${vendor.name}, I found you on FindMyBites × PimpMyParty and I'd like to enquire about your services.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
                >
                  <MessageCircle className="size-4" />
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── 2b. AI Store Summary + Vendor Highlights ─────────────── */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <AIStoreSummary vendorId={vendor.id} />
            <VendorHighlights vendor={vendor} />
          </div>
        </div>

        {/* ── Body: two-column layout ─────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left column (65%) */}
            <div className="space-y-10">
              {/* ── 3. ABOUT ────────────────────────────────────────── */}
              <section>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  About {vendor.name}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90 sm:text-base">
                  {vendor.description || vendor.tagline}
                </p>
                {vendor.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {vendor.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-soft-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {vendor.instagram && (
                    <a
                      href={vendor.instagram.startsWith("http") ? vendor.instagram : `https://instagram.com/${vendor.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="size-3.5" />
                      Instagram
                    </a>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <Globe className="size-3.5" />
                      Website
                    </a>
                  )}
                  {(vendor as any).facebook && (
                    <a
                      href={(vendor as any).facebook.startsWith("http") ? (vendor as any).facebook : `https://facebook.com/${(vendor as any).facebook.replace("@","")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> Facebook
                    </a>
                  )}
                  {(vendor as any).youtube && (
                    <a
                      href={(vendor as any).youtube.startsWith("http") ? (vendor as any).youtube : `https://youtube.com/${(vendor as any).youtube.replace("@","")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> YouTube
                    </a>
                  )}
                  {(vendor as any).tiktok && (
                    <a
                      href={(vendor as any).tiktok.startsWith("http") ? (vendor as any).tiktok : `https://tiktok.com/${(vendor as any).tiktok.replace("@","")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> TikTok
                    </a>
                  )}
                  {(vendor as any).twitter && (
                    <a
                      href={(vendor as any).twitter.startsWith("http") ? (vendor as any).twitter : `https://x.com/${(vendor as any).twitter.replace("@","")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> X
                    </a>
                  )}
                  {(vendor as any).snapchat && (
                    <a
                      href={(vendor as any).snapchat.startsWith("http") ? (vendor as any).snapchat : `https://snapchat.com/add/${(vendor as any).snapchat.replace("@","")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> Snapchat
                    </a>
                  )}
                </div>
                {(vendor as any).fssaiNumber && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    🇮🇳 FSSAI Licensed: {(vendor as any).fssaiNumber}
                  </p>
                )}
              </section>

              {/* ── 4. GALLERY ──────────────────────────────────────── */}
              {gallery.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Our Work</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {gallery.slice(0, 9).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => openLightbox(i)}
                        className={cn(
                          "group relative overflow-hidden rounded-xl border border-border bg-muted",
                          i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"
                        )}
                      >
                        <img
                          src={img}
                          alt={`${vendor.name} photo ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* ── 5. PACKAGES & SERVICES (all vendors) ──────────── */}
              {products.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {isFoodVendor ? "Menu & Packages" : "Packages & Services"}
                    </h2>
                    {productTypes.length > 2 && (
                      <div className="flex flex-wrap gap-1.5">
                        {productTypes.map((t) => (
                          <button
                            key={t}
                            onClick={() => setProductFilter(t)}
                            className={cn(
                              "rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition-colors",
                              productFilter === t
                                ? "bg-brand text-brand-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.slice(0, 9).map((p) => (
                      <ProductCard key={p.id} product={p} currency={vendor.currency} />
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No packages match this filter.
                    </p>
                  )}
                </section>
              )}

              {/* ── 7. AVAILABILITY ─────────────────────────────────── */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Availability</h2>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                      const available = vendor.openHours?.includes(day) ?? false;
                      return (
                        <span
                          key={day}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            available
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                  {vendor.openHours && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      <Clock className="inline size-3.5 text-brand" /> {vendor.openHours}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-brand" />
                      Requires advance booking
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-3.5 text-brand" />
                      Accepts last-minute bookings
                    </span>
                  </div>
                </div>
              </section>

              {/* ── 8. REVIEWS ──────────────────────────────────────── */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
                  Reviews ({vendor.reviewCount})
                </h2>
                {vendor.reviews.length > 0 ? (
                  <>
                    <div className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4">
                      <div className="text-center">
                        <p className="text-4xl font-extrabold tabular-nums">{vendor.rating.toFixed(1)}</p>
                        <StarRating rating={vendor.rating} size={14} />
                        <p className="mt-1 text-xs text-muted-foreground">{vendor.reviewCount} reviews</p>
                      </div>
                    </div>
                    {/* AI Review Summary */}
                    <div className="mb-4">
                      <AIReviewSummary vendorId={vendor.id} />
                    </div>
                    <div className="space-y-4">
                      {vendor.reviews.slice(0, visibleReviews).map((r) => (
                        <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                              {r.author.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-semibold">{r.author}</p>
                                <span suppressHydrationWarning className="shrink-0 text-xs text-muted-foreground">
                                  {timeAgo(r.createdAt)}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <StarRating rating={r.rating} size={12} />
                                {r.eventDate && (
                                  <span suppressHydrationWarning className="text-xs text-muted-foreground">
                                    · Event: {new Date(r.eventDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {vendor.reviews.length > visibleReviews && (
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => setVisibleReviews((v) => v + 5)}
                      >
                        Load more reviews ({vendor.reviews.length - visibleReviews} remaining)
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <Star className="mx-auto size-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No reviews yet — be the first to book!
                    </p>
                  </div>
                )}
              </section>

              {/* ── 8b. SERVICE AREA & BUSINESS INFO ──────────────── */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
                  Service Area & Business Info
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Service Area */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold">
                      <MapPin className="size-4 text-brand" /> Service Area
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="text-muted-foreground">Based in:</span>
                        <span className="font-medium">{vendor.city}, {vendor.country}</span>
                      </p>
                      {vendor.serviceRadiusKm && (
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Travel radius:</span>
                          <span className="font-medium">{vendor.serviceRadiusKm} km</span>
                        </p>
                      )}
                      {vendor.serviceAreas && (
                        <p className="flex items-start gap-2">
                          <span className="text-muted-foreground shrink-0">Serves:</span>
                          <span className="font-medium">{vendor.serviceAreas}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {vendor.deliveryAvailable && (
                          <Badge className="border-0 bg-emerald-100 text-emerald-700">
                            <Check className="size-3" /> Delivery
                          </Badge>
                        )}
                        {vendor.pickupAvailable && (
                          <Badge className="border-0 bg-emerald-100 text-emerald-700">
                            <Check className="size-3" /> Pickup
                          </Badge>
                        )}
                        {!vendor.deliveryAvailable && !vendor.pickupAvailable && (
                          <span className="text-xs text-muted-foreground">Contact for delivery options</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold">
                      <Clock className="size-4 text-brand" /> Business Info
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      {vendor.openHours && (
                        <p className="flex items-center gap-2">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{vendor.openHours}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{vendor.yearsActive} year{vendor.yearsActive !== 1 ? "s" : ""} in business</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Zap className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">Responds {vendor.responseTime}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{vendor.completedBookings} completed bookings</span>
                      </p>
                    </div>
                    {/* Contact actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.whatsapp && (
                        <a
                          href={`https://wa.me/${vendor.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackClick("whatsapp_click")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1da851]"
                        >
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </a>
                      )}
                      {vendor.website && (
                        <a
                          href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackClick("website_click")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted/80"
                        >
                          <Globe className="size-3.5" /> Website
                        </a>
                      )}
                      <button
                        onClick={() => {
                          trackClick("contact_click");
                          document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
                      >
                        <Send className="size-3.5" /> Contact
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 8c. AI FAQ ──────────────────────────────────────── */}
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
                  Frequently Asked Questions
                </h2>
                <AIFAQ vendorId={vendor.id} />
              </section>
            </div>

            {/* ── Right column: Sticky quote form + estimator ──────────── */}
            <aside id="quote-form" className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <InstantQuoteEstimator
                vendorId={vendor.id}
                currency={vendor.currency}
                basePrice={vendor.basePrice}
              />
              <QuoteForm vendor={vendor} />
            </aside>
          </div>
        </div>

        {/* ── 9. SIMILAR VENDORS ──────────────────────────────────── */}
        {similarVendors.length > 0 && (
          <section className="border-t border-border bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                You might also like
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Other {catDisplay.label} you may be interested in.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {similarVendors.map((v, i) => (
                  <VendorCard key={v.id} vendor={v} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      {/* ── Josh AI — vendor-scoped assistant ───────────────────── */}
      <VendorAIChat
        vendorId={vendor.id}
        vendorName={vendor.name}
        vendorCategory={vendor.category}
        vendorCity={vendor.city}
      />

      {/* ── Lightbox ────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            aria-label="Previous"
            className="absolute left-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="size-6" />
          </button>
          <img
            src={gallery[lightboxIndex]}
            alt={`${vendor.name} photo ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            aria-label="Next"
            className="absolute right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="size-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
            {lightboxIndex + 1} / {gallery.length}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Product card for public display ──────────────────────────────────────
function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const includes: string[] = (product as any).includes
    ? (typeof (product as any).includes === "string"
      ? JSON.parse((product as any).includes as string)
      : (product as any).includes)
    : [];
  const dietaryTags: string[] = (product as any).dietaryTags
    ? (typeof (product as any).dietaryTags === "string"
      ? JSON.parse((product as any).dietaryTags as string)
      : (product as any).dietaryTags)
    : [];
  const images: string[] = product.images ?? (product.image ? [product.image] : []);
  const packageType = (product as any).packageType || "standard";
  const capacity = (product as any).capacity;
  const duration = (product as any).duration;
  const comparePrice = (product as any).comparePrice;
  const discountPercent = (product as any).discountPercent;
  const offerType = (product as any).offerType || "none";
  const offerLabel = (product as any).offerLabel;
  const offerExpiresAt = (product as any).offerExpiresAt;
  const freeItemDescription = (product as any).freeItemDescription;
  const bundleDescription = (product as any).bundleDescription;
  const bundleDiscount = (product as any).bundleDiscount;
  const isFlashDeal = (product as any).isFlashDeal;
  const flashDealEndsAt = (product as any).flashDealEndsAt;
  const exclusiveMemberOffer = (product as any).exclusiveMemberOffer;
  const countdownEnd = offerType === "flash" ? flashDealEndsAt : offerExpiresAt;
  const hasDiscount = comparePrice && Number(comparePrice) > product.price;

  return (
    <Link href={`/product/${product.slug}`} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
      {images.length > 0 && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <ProductBadge badge={(product as any).badge} />
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-bold capitalize",
              packageType === "premium" ? "bg-amber-500 text-white" :
              packageType === "standard" ? "bg-blue-500 text-white" :
              "bg-muted text-muted-foreground"
            )}>{packageType}</span>
            {hasDiscount && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">{discountPercent || Math.round(((Number(comparePrice) - product.price) / Number(comparePrice)) * 100)}% OFF</span>
            )}
            {isFlashDeal && (
              <span className="animate-pulse rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">⚡ FLASH</span>
            )}
          </div>
        </div>
      )}
      {/* Offer banner */}
      {offerType !== "none" && offerLabel && (
        <div className={cn(
          "px-3 py-1 text-[10px] font-semibold text-white",
          offerType === "flash" ? "bg-red-600" :
          offerType === "limited_time" ? "bg-orange-500" :
          offerType === "free_item" ? "bg-green-500" :
          offerType === "bundle" ? "bg-purple-500" : "bg-muted"
        )}>
          {offerType === "flash" && "⚡ "}{offerType === "limited_time" && "⏰ "}{offerType === "free_item" && "🎁 "}{offerType === "bundle" && "📦 "}{offerLabel}
        </div>
      )}
      {/* Countdown */}
      {countdownEnd && (
        <div className="border-b border-border px-3 py-1">
          <CountdownTimer endsAt={countdownEnd} variant={offerType === "flash" ? "flash" : "default"} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 font-bold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          {capacity && <span>Up to {capacity} guests</span>}
          {duration && <span>{duration}</span>}
        </div>
        {includes.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {includes.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Check className="size-3 text-brand" /> {item}
              </li>
            ))}
          </ul>
        )}
        {freeItemDescription && (
          <p className="mt-2 text-[11px] font-medium text-green-600">🎁 {freeItemDescription}</p>
        )}
        {bundleDescription && (
          <p className="mt-1 text-[11px] font-medium text-purple-600">📦 {bundleDescription} — Save {bundleDiscount}%</p>
        )}
        {dietaryTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {dietaryTags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-brand-soft px-1.5 py-0.5 text-[9px] font-medium text-brand-soft-foreground">{tag}</span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-1.5">
            {hasDiscount && (
              <span className="text-[11px] text-muted-foreground line-through">{symbol}{Number(comparePrice).toLocaleString()}</span>
            )}
            <span className="text-sm font-bold text-brand">{symbol}{product.price.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-[10px] font-semibold text-green-600">Save {discountPercent || Math.round(((Number(comparePrice) - product.price) / Number(comparePrice)) * 100)}%</span>
            )}
            {exclusiveMemberOffer && (
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] font-bold text-amber-700">🔒 MEMBER</span>
            )}
          </div>
          <a href="#quote-form" className="rounded-lg bg-brand px-3 py-1 text-[11px] font-semibold text-brand-foreground">
            Enquire
          </a>
        </div>
      </div>
    </Link>
  );
}

// ── Menu item component ─────────────────────────────────────────────
function ProductMenuItem({ product, currency }: { product: Product; currency: string }) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const tags: string[] = [];
  if (product.eggless) tags.push("🥗 Vegetarian");
  if (product.sameDay) tags.push("⚡ Same-day");
  if (product.customOrder) tags.push("🎨 Custom");

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{product.description}</p>
        )}
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="shrink-0 font-bold tabular-nums text-brand">
        {symbol}{product.price.toLocaleString("en-US")}
      </p>
    </div>
  );
}

// ── Service item component ──────────────────────────────────────────
function ServiceItem({ product, currency }: { product: Product; currency: string }) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{product.name}</p>
        {product.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{product.description}</p>
        )}
        {product.productType && (
          <Badge variant="secondary" className="mt-1.5 border-0 text-[10px]">
            {product.productType}
          </Badge>
        )}
      </div>
      <p className="shrink-0 font-bold tabular-nums text-brand">
        From {symbol}{product.price.toLocaleString("en-US")}
      </p>
    </div>
  );
}

// ── Quote form ──────────────────────────────────────────────────────
function QuoteForm({ vendor }: { vendor: VendorWithRelations }) {
  const createBooking = useCreateBooking();
  const [done, setDone] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    whatsapp: "",
    eventType: "",
    eventDate: "",
    guests: "",
    budget: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.name.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.eventType &&
    form.eventDate &&
    form.guests;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createBooking.mutateAsync({
        vendorId: vendor.id,
        name: form.name.trim(),
        email: form.email.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate,
        eventCity: vendor.city,
        guests: parseInt(form.guests, 10) || 0,
        budget: form.budget.trim() || "Not specified",
        message: form.message.trim() || `Enquiry for ${form.eventType}`,
      });
      setDone(true);
      toast.success("Quote request sent!", {
        description: `${vendor.name} will respond shortly.`,
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-soft p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
          <PartyPopper className="size-7" />
        </div>
        <h3 className="mt-3 text-lg font-bold">Quote sent to {vendor.name}! ✅</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          They typically reply within {vendor.responseTime}. We&apos;ll notify you by
          email when they respond.
        </p>
        {vendor.whatsapp && (
          <a
            href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(
              `Hi ${vendor.name}, I just sent you a quote request on FindMyBites × PimpMyParty...`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
          >
            <MessageCircle className="size-4" />
            Contact on WhatsApp
          </a>
        )}
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={() => {
            setDone(false);
            setForm({ name: "", email: "", whatsapp: "", eventType: "", eventDate: "", guests: "", budget: "", message: "" });
          }}
        >
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div>
        <p className="flex items-center gap-1.5 text-lg font-bold">
          <Zap className="size-4 text-brand" />
          Request a quote
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Free · No commitment</p>
      </div>

      <Field label="Your name" required>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="h-10" />
      </Field>
      <Field label="Your email" required>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@email.com" className="h-10" />
      </Field>
      <Field label="Your WhatsApp">
        <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+44 7700 900123" className="h-10" inputMode="tel" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Event type" required>
          <Select value={form.eventType} onValueChange={(v) => set("eventType", v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date" required>
          <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="h-10" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Guests" required>
          <Input type="number" min={1} value={form.guests} onChange={(e) => set("guests", e.target.value)} placeholder="50" className="h-10" />
        </Field>
        <Field label="Budget">
          <Input type="text" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="$1,000" className="h-10" />
        </Field>
      </div>
      <Field label="Message">
        <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder={`Tell ${vendor.name} about your event...`} rows={3} className="resize-none" />
      </Field>

      <Button type="submit" disabled={createBooking.isPending || !valid} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {createBooking.isPending ? (<><Loader2 className="size-4 animate-spin" /> Sending…</>) : (<><Send className="size-4" /> Send Quote Request</>)}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Shield className="size-3" />
        Your details go directly to {vendor.name} only
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
