"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star, MapPin, BadgeCheck, Truck, Clock, Users, Sparkles,
  Check, Heart, Share2, ChevronLeft, Utensils, Calendar, Package as PackageIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/marketplace/site-header";
import { SiteFooter } from "@/components/marketplace/site-footer";
import { VendorImage } from "@/components/marketplace/vendor-image";
import { StarRating } from "@/components/marketplace/star-rating";
import { LivePriceCalculator } from "@/components/marketplace/live-price-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PackageDetailClientProps {
  pkg: any;
}

export function PackageDetailClient({ pkg }: PackageDetailClientProps) {
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [saved, setSaved] = React.useState(false);
  const [guests, setGuests] = React.useState(pkg.minGuests || 50);
  const [total, setTotal] = React.useState(0);

  const allImages = React.useMemo(() => {
    const imgs = [...(pkg.images || [])];
    if (pkg.image && !imgs.includes(pkg.image)) imgs.unshift(pkg.image);
    return imgs.length > 0 ? imgs : ["/vendors/catering.png"];
  }, [pkg.images, pkg.image]);

  const pricePerGuest = pkg.pricePerHead ?? pkg.price ?? 0;
  const info = pkg.productInfo || {};
  const includes = info.includes || info.highlights || [];
  const menuItems = info.menuItems ? String(info.menuItems).split("\n").filter(Boolean) : [];
  const occasionTags = info.occasionTags || [];
  const cuisine = info.cuisine || [];
  const foodType = info.foodType || "Both";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Back button */}
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <Link href="/packages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> Back to Packages
          </Link>
        </div>

        {/* Hero Image */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            <VendorImage src={allImages[selectedImage]} alt={pkg.name} className="h-full w-full" accent="from-purple-400 to-pink-500" />
            {/* Image nav */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {allImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      idx === selectedImage ? "w-8 bg-white" : "w-2 bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
            {/* Save + Share */}
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                onClick={() => setSaved(!saved)}
                className="grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                <Heart className={cn("size-5", saved && "fill-rose-500 text-rose-500")} />
              </button>
              <button className="grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70">
                <Share2 className="size-5" />
              </button>
            </div>
          </div>

          {/* Thumbnail gallery */}
          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    idx === selectedImage ? "border-brand" : "border-transparent"
                  )}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content + Sidebar */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left: Package Info */}
            <div className="space-y-6">
              {/* Title + Vendor */}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{pkg.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {pkg.vendor && (
                    <Link href={`/vendor/${pkg.vendor.slug}`} className="flex items-center gap-2 text-sm hover:underline">
                      <img
                        src={pkg.vendor.avatarImage || "/vendors/catering.png"}
                        alt={pkg.vendor.name}
                        className="size-8 rounded-full object-cover"
                      />
                      <span className="font-medium">{pkg.vendor.name}</span>
                      {pkg.vendor.verified && <BadgeCheck className="size-4 text-blue-500" />}
                    </Link>
                  )}
                  {pkg.vendor?.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{pkg.vendor.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({pkg.vendor.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick info badges */}
              <div className="flex flex-wrap gap-2">
                {pkg.vendor?.city && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="size-3" /> {pkg.vendor.city}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Utensils className="size-3" /> {foodType}
                </Badge>
                {cuisine.map((c: string) => (
                  <Badge key={c} variant="outline" className="gap-1">{c}</Badge>
                ))}
                {pkg.deliveryAvailable && (
                  <Badge variant="outline" className="gap-1 text-emerald-600">
                    <Truck className="size-3" /> Delivery
                  </Badge>
                )}
                {pkg.pickupAvailable && (
                  <Badge variant="outline" className="gap-1">Pickup</Badge>
                )}
                {occasionTags.map((o: string) => (
                  <Badge key={o} variant="secondary">{o}</Badge>
                ))}
              </div>

              {/* Description */}
              {pkg.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">{pkg.description}</p>
                </div>
              )}

              {/* Package Includes */}
              {includes.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-base font-bold">Package Includes</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {includes.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="grid size-5 place-items-center rounded-full bg-emerald-100">
                          <Check className="size-3 text-emerald-600" />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {menuItems.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-base font-bold">Menu</h3>
                  <div className="space-y-1">
                    {menuItems.map((item: string, idx: number) => (
                      <p key={idx} className="text-sm text-muted-foreground">{item}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Card */}
              {pkg.vendor && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="mb-3 text-base font-bold">About the Vendor</h3>
                  <Link href={`/vendor/${pkg.vendor.slug}`} className="flex items-center gap-3 hover:bg-muted/30 rounded-lg p-2 -m-2">
                    <img
                      src={pkg.vendor.avatarImage || "/vendors/catering.png"}
                      alt={pkg.vendor.name}
                      className="size-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{pkg.vendor.name}</span>
                        {pkg.vendor.verified && <BadgeCheck className="size-4 text-blue-500" />}
                      </div>
                      {pkg.vendor.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {pkg.vendor.rating.toFixed(1)} · {pkg.vendor.reviewCount} reviews
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{pkg.vendor.city}, {pkg.vendor.country}</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Right: Booking Sidebar (sticky on desktop) */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <LivePriceCalculator
                pricePerGuest={pricePerGuest}
                currency={pkg.currency}
                minGuests={pkg.minGuests || 10}
                onGuestsChange={setGuests}
                onTotalChange={setTotal}
              />

              {/* Quick stats */}
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
                {pkg.minGuests && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" /> Minimum Guests</span>
                    <span className="font-medium">{pkg.minGuests}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><Truck className="size-4" /> Delivery</span>
                  <span className="font-medium">{pkg.deliveryAvailable ? "Available" : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground"><PackageIcon className="size-4" /> Customization</span>
                  <span className="font-medium">Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Book button (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card p-3 lg:hidden">
        <Button className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
          <Calendar className="size-4" /> Book · {pkg.currency === "INR" ? "₹" : ""}{total > 0 ? total.toLocaleString() : (pricePerGuest * (pkg.minGuests || 10)).toLocaleString()}
        </Button>
      </div>

      <SiteFooter />
    </div>
  );
}
