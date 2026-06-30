"use client";

import * as React from "react";
import { BadgeCheck, Zap, Truck, Palette, Award, Clock, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorWithRelations } from "@/lib/types";

/**
 * VendorHighlights — displays trust badges based on vendor data.
 * Dynamically computes which badges to show from real vendor fields.
 */
export function VendorHighlights({ vendor }: { vendor: VendorWithRelations }) {
  const badges: { icon: React.ElementType; label: string; color: string }[] = [];

  if (vendor.verified) {
    badges.push({ icon: BadgeCheck, label: "Verified", color: "text-emerald-600 bg-emerald-50" });
  }
  if (vendor.featured) {
    badges.push({ icon: Award, label: "Elite Vendor", color: "text-amber-600 bg-amber-50" });
  }
  if (vendor.responseTime) {
    badges.push({ icon: Zap, label: `Responds ${vendor.responseTime}`, color: "text-brand bg-brand-soft" });
  }
  if (vendor.deliveryAvailable) {
    badges.push({ icon: Truck, label: "Delivery Available", color: "text-blue-600 bg-blue-50" });
  }
  if (vendor.completedBookings > 50) {
    badges.push({ icon: Shield, label: `${vendor.completedBookings}+ Orders`, color: "text-purple-600 bg-purple-50" });
  }
  if (vendor.yearsActive >= 3) {
    badges.push({ icon: Clock, label: `${vendor.yearsActive}+ Years`, color: "text-slate-600 bg-slate-50" });
  }
  if (vendor.rating >= 4.5) {
    badges.push({ icon: Star, label: "Top Rated", color: "text-amber-600 bg-amber-50" });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => {
        const Icon = b.icon;
        return (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              b.color
            )}
          >
            <Icon className="size-3" />
            {b.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * FollowButton — lets customers follow/unfollow a vendor.
 * Works for both logged-in users (supabase) and anonymous visitors (visitor hash).
 */
export function FollowButton({ vendorId }: { vendorId: string }) {
  const [following, setFollowing] = React.useState(false);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/follow?vendorId=${vendorId}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        setFollowing(d.following ?? false);
        setFollowerCount(d.followerCount ?? 0);
      })
      .catch(() => {});
  }, [vendorId]);

  const toggle = async () => {
    setLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch("/api/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      const d = await res.json();
      setFollowing(d.following ?? false);
      setFollowerCount((c) => (d.following ? c + 1 : Math.max(0, c - 1)));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        following
          ? "bg-muted text-muted-foreground hover:bg-muted/80"
          : "bg-brand text-brand-foreground hover:bg-brand/90"
      )}
    >
      {following ? "✓ Following" : "+ Follow"}
      {followerCount > 0 && (
        <span className="text-[10px] opacity-70">({followerCount})</span>
      )}
    </button>
  );
}

/**
 * InstantQuoteEstimator — lets customers get an instant quote estimate
 * based on event type, guests, and budget. Uses the vendor's products
 * to recommend a package.
 */
export function InstantQuoteEstimator({
  vendorId,
  currency,
  basePrice,
}: {
  vendorId: string;
  currency: string;
  basePrice: number;
}) {
  const [guests, setGuests] = React.useState("50");
  const [eventType, setEventType] = React.useState("Birthday");
  const [estimate, setEstimate] = React.useState<number | null>(null);

  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "AED" ? "AED" : currency + " ";

  const calculate = () => {
    const g = parseInt(guests, 10) || 0;
    if (g === 0) return;
    // Simple estimate: base price × guests factor
    const perHead = Math.max(basePrice / 10, 5);
    const est = Math.round(perHead * g * (eventType === "Wedding" ? 2 : eventType === "Corporate" ? 1.5 : 1));
    setEstimate(est);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        <Zap className="size-4 text-brand" /> Instant Quote Estimator
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
        >
          <option>Birthday</option>
          <option>Wedding</option>
          <option>Corporate</option>
          <option>Anniversary</option>
          <option>Kids Party</option>
        </select>
        <input
          type="number"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Guests"
          min={1}
          className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
        />
      </div>
      <button
        onClick={calculate}
        className="mt-2 w-full rounded-lg bg-brand py-2 text-xs font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Get Estimate
      </button>
      {estimate !== null && (
        <div className="mt-3 rounded-lg bg-brand-soft p-3 text-center">
          <p className="text-[10px] font-medium text-muted-foreground">Estimated cost</p>
          <p className="text-xl font-extrabold text-brand">
            {symbol}{estimate.toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            For {guests} guests · {eventType}
          </p>
          <button
            onClick={() => document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-2 text-[11px] font-semibold text-brand hover:underline"
          >
            Request exact quote →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ProductBadge — renders a badge for a product (Featured, Best Seller, New, etc.)
 */
const BADGE_STYLES: Record<string, { label: string; className: string }> = {
  featured: { label: "★ Featured", className: "bg-amber-500 text-white" },
  bestseller: { label: "🔥 Best Seller", className: "bg-rose-500 text-white" },
  new: { label: "✨ New", className: "bg-emerald-500 text-white" },
  seasonal: { label: "🎄 Seasonal", className: "bg-blue-500 text-white" },
  limited: { label: "⏰ Limited Time", className: "bg-purple-500 text-white" },
};

export function ProductBadge({ badge }: { badge?: string | null }) {
  if (!badge || !BADGE_STYLES[badge]) return null;
  const style = BADGE_STYLES[badge];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", style.className)}>
      {style.label}
    </span>
  );
}
