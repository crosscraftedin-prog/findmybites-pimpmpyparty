"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Star, MapPin, Zap, Clock, Shield, Users, Calendar, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompareVendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  categoryLabel: string;
  tagline: string;
  city: string;
  country: string;
  countryCode: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  basePrice: number;
  currency: string;
  currencySymbol: string;
  heroImage: string;
  avatarImage: string;
  featured: boolean;
  verified: boolean;
  responseTime: string;
  yearsActive: number;
  completedBookings: number;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  serviceRadiusKm: number | null;
  tags: string[];
  topProducts: { id: string; name: string; slug: string; price: number; image: string | null }[];
}

interface VendorComparisonProps {
  vendorIds: string[];
  onClose: () => void;
}

export function VendorComparison({ vendorIds, onClose }: VendorComparisonProps) {
  const [vendors, setVendors] = React.useState<CompareVendor[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (vendorIds.length < 2) return;
    setLoading(true);
    fetch(`/api/vendors/compare?ids=${vendorIds.join(",")}&t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        setVendors(d.vendors ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorIds]);

  const rows: { label: string; key: (v: CompareVendor) => React.ReactNode; icon?: React.ElementType; bestHigh?: boolean }[] = [
    { label: "Rating", key: (v) => `${v.rating.toFixed(1)} ⭐ (${v.reviewCount})`, icon: Star, bestHigh: true },
    { label: "Starting Price", key: (v) => `${v.currencySymbol}${v.basePrice.toLocaleString()}` },
    { label: "Price Range", key: (v) => v.priceRange },
    { label: "Location", key: (v) => `${v.city}, ${v.country}`, icon: MapPin },
    { label: "Response Time", key: (v) => v.responseTime, icon: Zap },
    { label: "Years Active", key: (v) => `${v.yearsActive} years`, icon: Clock },
    { label: "Completed Bookings", key: (v) => v.completedBookings.toLocaleString(), icon: Shield },
    { label: "Delivery", key: (v) => v.deliveryAvailable ? "✓ Available" : "✗ Not available", icon: Package },
    { label: "Pickup", key: (v) => v.pickupAvailable ? "✓ Available" : "✗ Not available" },
    { label: "Service Radius", key: (v) => v.serviceRadiusKm ? `${v.serviceRadiusKm} km` : "Worldwide" },
    { label: "Verified", key: (v) => v.verified ? "✓ Verified" : "Unverified", icon: Shield },
    { label: "Featured", key: (v) => v.featured ? "⭐ Elite" : "Standard" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="my-8 w-full max-w-6xl rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Compare Vendors</h2>
            <p className="text-sm text-muted-foreground">Side-by-side comparison of {vendors.length} vendors</p>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-accent">
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading comparison…</div>
        ) : vendors.length < 2 ? (
          <div className="p-12 text-center text-muted-foreground">Need at least 2 vendors to compare.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Vendor headers */}
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 w-40 bg-background p-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                    Feature
                  </th>
                  {vendors.map((v) => (
                    <th key={v.id} className="min-w-[200px] p-4 text-left align-top">
                      <Link href={`/vendor/${v.slug}`} className="block">
                        {v.avatarImage && (
                          <img src={v.avatarImage} alt={v.name} className="mb-2 size-12 rounded-xl object-cover" />
                        )}
                        <p className="font-bold leading-tight">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.categoryLabel}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {v.rating.toFixed(1)} ({v.reviewCount})
                        </div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              {/* Comparison rows */}
              <tbody>
                {rows.map((row, i) => {
                  const values = vendors.map(row.key);
                  const numValues = values.map((v) => {
                    const match = String(v).match(/[\d.]+/);
                    return match ? parseFloat(match[0]) : 0;
                  });
                  const bestVal = row.bestHigh ? Math.max(...numValues) : Math.min(...numValues);
                  return (
                    <tr key={i} className={cn("border-b border-border/50", i % 2 === 1 && "bg-muted/20")}>
                      <td className="sticky left-0 z-10 bg-background p-4 text-xs font-semibold text-muted-foreground">
                        {row.icon && <row.icon className="mr-1 inline size-3" />}
                        {row.label}
                      </td>
                      {vendors.map((v, vi) => {
                        const val = values[vi];
                        const numVal = numValues[vi];
                        const isBest = numVal === bestVal && numVal > 0;
                        return (
                          <td key={v.id} className={cn("p-4 text-sm", isBest && "bg-emerald-50 font-bold text-emerald-700")}>
                            {val}
                            {isBest && <Check className="ml-1 inline size-3" />}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Top products row */}
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-background p-4 text-xs font-semibold text-muted-foreground">
                    <Package className="mr-1 inline size-3" /> Top Products
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="p-4">
                      <div className="space-y-2">
                        {v.topProducts.map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            className="flex items-center gap-2 rounded-lg border border-border p-2 hover:bg-accent"
                          >
                            {p.image && <img src={p.image} alt={p.name} className="size-8 rounded object-cover" />}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium">{p.name}</p>
                              <p className="text-xs font-bold text-brand">{v.currencySymbol}{((p as any).offerPrice || p.price).toLocaleString()}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Action row */}
                <tr>
                  <td className="sticky left-0 z-10 bg-background p-4 text-xs font-semibold text-muted-foreground">
                    Action
                  </td>
                  {vendors.map((v) => (
                    <td key={v.id} className="p-4">
                      <Link href={`/vendor/${v.slug}`}>
                        <Button size="sm" className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                          Visit Store <ArrowRight className="size-3" />
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
