"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, Heart, Store, Star, Bell, User, MapPin, MessageCircle,
  Loader2, Package, ChevronRight, Trash2, Phone, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/marketplace/site-header";
import { LocationBanner } from "@/components/marketplace/location-banner";

interface Booking {
  id: string;
  bookingNumber: string;
  vendorName: string;
  vendorSlug: string;
  eventType: string;
  bookingDate: string;
  city: string;
  status: string;
  totalAmount: number;
  currency: string;
}

interface WishlistItem {
  id: string;
  entityType: string;
  entityId: string;
  vendorId: string | null;
  vendorName?: string;
  vendorSlug?: string;
  productName?: string;
  productSlug?: string;
  image?: string;
  price?: number;
  currency?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-gray-100 text-gray-700",
  in_progress: "bg-indigo-100 text-indigo-700",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", GBP: "£", AED: "AED", EUR: "€",
};

export function CustomerDashboard({ userEmail, userName, userImage }: { userEmail: string; userName: string; userImage: string }) {
  const [tab, setTab] = React.useState("bookings");
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch(`/api/bookings/customer/${encodeURIComponent(userEmail)}`).then(r => r.ok ? r.json() : { bookings: [] }).catch(() => ({ bookings: [] })),
      fetch("/api/wishlist/list").then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
    ]).then(([bookingData, wishData]) => {
      setBookings(bookingData.bookings || []);
      setWishlist(wishData.items || []);
      setLoading(false);
    });
  }, [userEmail]);

  const upcomingBookings = bookings.filter(b => ["pending", "confirmed", "accepted", "in_progress"].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === "completed");
  const cancelledBookings = bookings.filter(b => ["cancelled", "rejected"].includes(b.status));

  const savedVendors = wishlist.filter(w => w.entityType === "vendor");
  const savedProducts = wishlist.filter(w => w.entityType === "product");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <LocationBanner />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          {/* Profile Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="size-16 overflow-hidden rounded-full bg-muted">
              {userImage ? (
                <img src={userImage} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="size-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userName}</h1>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Bookings", val: bookings.length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Upcoming", val: upcomingBookings.length, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Saved", val: wishlist.length, icon: Heart, color: "text-red-600", bg: "bg-red-50" },
              { label: "Completed", val: completedBookings.length, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={cn("rounded-xl border border-border p-3", s.bg)}>
                  <Icon className={cn("size-4 mb-1", s.color)} />
                  <p className={cn("text-xl font-bold", s.color)}>{s.val}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="bookings" className="gap-1"><Calendar className="size-3.5" /> Bookings</TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-1"><Heart className="size-3.5" /> Wishlist ({wishlist.length})</TabsTrigger>
              <TabsTrigger value="vendors" className="gap-1"><Store className="size-3.5" /> Saved Vendors ({savedVendors.length})</TabsTrigger>
              <TabsTrigger value="profile" className="gap-1"><User className="size-3.5" /> Profile</TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-4 space-y-4">
              {loading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" /></div>
              ) : bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <Calendar className="mx-auto size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">No bookings yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Browse vendors and book your first event!</p>
                  <Link href="/"><Button className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">Browse Vendors</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Upcoming ({upcomingBookings.length})</h3>
                  {upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                  {completedBookings.length > 0 && (
                    <>
                      <h3 className="pt-4 text-sm font-semibold">Completed ({completedBookings.length})</h3>
                      {completedBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                    </>
                  )}
                  {cancelledBookings.length > 0 && (
                    <>
                      <h3 className="pt-4 text-sm font-semibold">Cancelled ({cancelledBookings.length})</h3>
                      {cancelledBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="mt-4">
              {loading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" /></div>
              ) : savedProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <Heart className="mx-auto size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">No saved products</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tap the heart icon on products to save them here.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedProducts.map(item => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.image && <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{item.productName || "Product"}</p>
                        {item.vendorName && <p className="text-xs text-muted-foreground">{item.vendorName}</p>}
                        {item.price && <p className="mt-1 text-sm font-bold text-brand">{CURRENCY_SYMBOLS[item.currency || "INR"]}{item.price.toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Vendors Tab */}
            <TabsContent value="vendors" className="mt-4">
              {loading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" /></div>
              ) : savedVendors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <Store className="mx-auto size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">No saved vendors</p>
                  <p className="mt-1 text-xs text-muted-foreground">Follow vendors to see them here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedVendors.map(v => (
                    <Link key={v.id} href={`/vendor/${v.vendorSlug || v.entityId}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-brand/10">
                          <Store className="size-5 text-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{v.vendorName || "Vendor"}</p>
                          <p className="text-xs text-muted-foreground">Saved {new Date(v.id).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold">Account Information</h3>
                <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={userName} readOnly className="mt-1 bg-muted/50" /></div>
                <div><Label className="text-xs text-muted-foreground">Email</Label><Input value={userEmail} readOnly className="mt-1 bg-muted/50" /></div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Notification Preferences</h3>
                <div className="space-y-2">
                  {["Booking updates", "Vendor replies", "Review reminders", "Offers & recommendations"].map(n => (
                    <label key={n} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="size-4 rounded border-border" />
                      {n}
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const symbol = CURRENCY_SYMBOLS[booking.currency] || booking.currency + " ";
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{booking.vendorName}</p>
            <Badge className={cn("rounded-full px-2 py-0.5 text-[9px] uppercase", STATUS_STYLES[booking.status] || "bg-gray-100 text-gray-700")}>
              {booking.status}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {booking.eventType} · {booking.city} · {new Date(booking.bookingDate).toLocaleDateString()}
          </p>
          <p className="mt-1 text-sm font-bold text-brand">
            {symbol}{(booking.totalAmount / 100).toLocaleString()}
          </p>
        </div>
        <Link href={`/vendor/${booking.vendorSlug}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
      </div>
    </motion.div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("block text-xs font-medium", className)}>{children}</label>;
}
