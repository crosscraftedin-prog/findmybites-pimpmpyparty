"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, BadgeCheck, Clock, Heart, MessageCircle } from "lucide-react";
import type { Vendor } from "@/lib/types";
import { getCategoryMigrated } from "@/lib/constants";
import { formatPrice, countryCodeToFlag } from "@/lib/format";
import { CategoryIcon } from "./icon";
import { VendorImage } from "./vendor-image";
import { StarRating } from "./star-rating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function VendorCard({ vendor, index = 0 }: { vendor: Vendor; index?: number }) {
  const cat = getCategoryMigrated(vendor.category);
  const [liked, setLiked] = React.useState(false);
  const href = `/vendor/${vendor.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-border hover:shadow-xl"
    >
      <Link href={href} className="flex w-full flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <VendorImage
            src={vendor.heroImage}
            alt={vendor.name}
            accent={cat?.accent ?? "from-amber-400 to-orange-500"}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            categoryIcon={<CategoryIcon name={cat?.icon ?? "UtensilsCrossed"} className="size-14" />}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* top badges */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            <div className="flex flex-wrap gap-1.5">
              {vendor.featured && (
                <Badge className="border-0 bg-brand text-brand-foreground shadow-sm">
                  Featured
                </Badge>
              )}
              {cat && (
                <Badge
                  variant="secondary"
                  className="border-0 bg-white/90 text-foreground backdrop-blur"
                >
                  <CategoryIcon name={cat.icon} className="size-3" />
                  {cat.label}
                </Badge>
              )}
            </div>
          </div>

          {/* price chip */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            from {formatPrice(vendor.basePrice, vendor.currency)}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-bold leading-tight">{vendor.name}</h3>
            {vendor.verified && (
              <BadgeCheck className="size-4 shrink-0 text-brand" />
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {vendor.tagline}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {countryCodeToFlag(vendor.countryCode)} {vendor.city}, {vendor.country}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <StarRating
              rating={vendor.rating}
              size={14}
              showValue
              count={vendor.reviewCount}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {vendor.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-soft-foreground"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            Responds {vendor.responseTime}
            <span className="mx-1">•</span>
            {vendor.yearsActive} yrs active
          </div>
        </div>
      </Link>

      {/* Floating action buttons (outside the Link so they don't navigate) */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-end gap-1.5">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              setLiked((v) => !v);
            }
          }}
          className={cn(
            "pointer-events-auto grid size-8 cursor-pointer place-items-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white",
            liked ? "text-rose-500" : "text-muted-foreground"
          )}
          aria-label="Save vendor"
        >
          <Heart className={cn("size-4", liked && "fill-rose-500")} />
        </span>
        {vendor.whatsapp && (
          <a
            href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(
              `Hi ${vendor.name}, I found you on FindMyBites × PimpMyParty and I'd like to enquire about your services.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="pointer-events-auto grid size-8 place-items-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform hover:scale-110"
            aria-label="Contact on WhatsApp"
          >
            <MessageCircle className="size-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
