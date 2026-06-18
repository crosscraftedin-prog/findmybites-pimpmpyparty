"use client";

import * as React from "react";
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
import { useMarketplace } from "@/lib/store";
import { useVendor, useReviews } from "@/lib/queries";
import { getCategory } from "@/lib/constants";
import { formatPrice, countryCodeToFlag } from "@/lib/format";
import { CategoryIcon } from "./icon";
import { VendorImage } from "./vendor-image";
import { StarRating } from "./star-rating";
import { ReviewList } from "./review-list";
import { ReviewForm } from "./review-form";
import { BookingForm } from "./booking-form";

export function VendorModal() {
  const slug = useMarketplace((s) => s.selectedVendorSlug);
  const closeVendor = useMarketplace((s) => s.closeVendor);
  const { data: vendor, isLoading } = useVendor(slug);
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews(
    vendor?.id ?? null
  );

  const cat = vendor ? getCategory(vendor.category) : undefined;
  const reviews = reviewsData?.reviews ?? vendor?.reviews ?? [];

  return (
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
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {cat && (
                    <Badge className="border-0 bg-white/90 text-foreground backdrop-blur">
                      <CategoryIcon name={cat.icon} className="size-3" />
                      {cat.label}
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
                {/* Stat strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat
                    icon={<CalendarPlus className="size-4" />}
                    label="From"
                    value={formatPrice(vendor.basePrice, vendor.currency)}
                  />
                  <Stat
                    icon={<Clock className="size-4" />}
                    label="Responds"
                    value={vendor.responseTime}
                  />
                  <Stat
                    icon={<Calendar className="size-4" />}
                    label="Active"
                    value={`${vendor.yearsActive} yrs`}
                  />
                  <Stat
                    icon={<Users className="size-4" />}
                    label="Bookings"
                    value={String(vendor.completedBookings)}
                  />
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

                {/* Tabs */}
                <Tabs defaultValue="book" className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="book">
                      <CalendarPlus className="size-4" />
                      Book this vendor
                    </TabsTrigger>
                    <TabsTrigger value="reviews">
                      <MessageSquareQuote className="size-4" />
                      Reviews ({vendor.reviewCount})
                    </TabsTrigger>
                  </TabsList>

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
