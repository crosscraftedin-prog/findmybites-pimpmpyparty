"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Star, Zap, Clock, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TrustBadges — unified badge component for vendor trust signals.
 * Used on vendor cards, vendor profiles, and search results.
 */

interface TrustBadgesProps {
  verified?: boolean;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
  responseTime?: string;
  yearsActive?: number;
  isNew?: boolean;
  size?: "sm" | "md";
}

export function TrustBadges({
  verified, featured, rating, reviewCount, responseTime, yearsActive, isNew, size = "sm",
}: TrustBadgesProps) {
  const badges: { icon: any; label: string; color: string; bg: string }[] = [];

  if (verified) {
    badges.push({ icon: BadgeCheck, label: "Verified", color: "text-blue-600", bg: "bg-blue-50" });
  }
  if (featured) {
    badges.push({ icon: Star, label: "Featured", color: "text-amber-600", bg: "bg-amber-50" });
  }
  if (isNew) {
    badges.push({ icon: Sparkles, label: "New", color: "text-purple-600", bg: "bg-purple-50" });
  }
  if (rating && rating >= 4.5 && (reviewCount ?? 0) >= 10) {
    badges.push({ icon: Star, label: "Top Rated", color: "text-emerald-600", bg: "bg-emerald-50" });
  }
  if (responseTime && responseTime.toLowerCase().includes("under")) {
    badges.push({ icon: Zap, label: "Fast Response", color: "text-orange-600", bg: "bg-orange-50" });
  }
  if (yearsActive && yearsActive >= 3) {
    badges.push({ icon: Clock, label: `${yearsActive}+ yrs`, color: "text-gray-600", bg: "bg-gray-50" });
  }

  if (badges.length === 0) return null;

  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 4).map((b, i) => {
        const Icon = b.icon;
        return (
          <span key={i} className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium", b.bg, b.color, textSize)}>
            <Icon className={iconSize} />
            {b.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * SecurePaymentBadge — shown on booking/checkout pages.
 */
export function SecurePaymentBadge() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Shield className="size-3.5 text-emerald-600" />
      <span>Secure Payment</span>
    </div>
  );
}
