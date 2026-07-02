"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  Store,
  Ticket,
  Inbox,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "pending"
  | "confirmed"
  | "accepted"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded";

interface BookingDetails {
  id: string;
  bookingNumber: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventType: string;
  bookingDate: string;
  bookingTime: string;
  address: string;
  city: string;
  guests: number;
  budget: number;
  currency: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

interface CustomerBookingsProps {
  email: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  const value = (amount ?? 0) / 100;
  return `\u20B9${value.toLocaleString("en-IN", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
}

function formatDate(dateString: string): string {
  try {
    if (!dateString) return "\u2014";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString ?? "\u2014";
  }
}

function formatTime(timeString: string): string {
  if (!timeString) return "\u2014";
  // Accept "HH:MM" (24h) and convert to 12h with am/pm.
  const match = timeString.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeString;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rejected: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  refunded: "bg-purple-100 text-purple-700 border-purple-200",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const label = status.replace(/_/g, " ");
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize whitespace-nowrap",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      )}
    >
      {label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking card
// ─────────────────────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: BookingDetails;
  index: number;
}

function BookingCard({ booking, index }: BookingCardProps) {
  const amount = booking.totalAmount || booking.budget;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/bookings/${booking.id}`}
        className="block rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-[#FF6B35]/40 hover:shadow-md sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                <Ticket className="size-3.5 text-[#FF6B35]" />
                {booking.bookingNumber}
              </span>
              <StatusBadge status={booking.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Store className="size-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {booking.vendorName || "Vendor"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {formatDate(booking.bookingDate)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" />
                {formatTime(booking.bookingTime)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" />
                {booking.city || "\u2014"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                {booking.eventType || "Event"}
              </span>
              <span className="text-foreground">
                Amount:{" "}
                <span className="font-semibold">{formatAmount(amount)}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center">
      <Inbox className="size-10 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium text-foreground">
        No bookings here
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function CustomerBookings({ email }: CustomerBookingsProps) {
  const [bookings, setBookings] = React.useState<BookingDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!email) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/bookings/customer/${encodeURIComponent(email)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load bookings");
        if (!cancelled) setBookings((json?.bookings ?? []) as BookingDetails[]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load bookings";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const { upcoming, completed, cancelled: cancelledBookings } =
    React.useMemo(() => {
      const upcomingList: BookingDetails[] = [];
      const completedList: BookingDetails[] = [];
      const cancelledList: BookingDetails[] = [];

      const q = search.trim().toLowerCase();
      const matches = (b: BookingDetails) => {
        if (!q) return true;
        return (
          b.customerName.toLowerCase().includes(q) ||
          b.bookingNumber.toLowerCase().includes(q) ||
          (b.vendorName ?? "").toLowerCase().includes(q) ||
          (b.eventType ?? "").toLowerCase().includes(q)
        );
      };

      for (const b of bookings) {
        if (!matches(b)) continue;
        if (b.status === "completed") completedList.push(b);
        else if (b.status === "cancelled") cancelledList.push(b);
        else if (b.status === "rejected") cancelledList.push(b);
        else upcomingList.push(b);
      }
      return {
        upcoming: upcomingList,
        completed: completedList,
        cancelled: cancelledList,
      };
    }, [bookings, search]);

  const counts = {
    upcoming: upcoming.length,
    completed: completed.length,
    cancelled: cancelledBookings.length,
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookings, vendor, or event"
          className="pl-9"
        />
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="upcoming">
            Upcoming
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
              {counts.upcoming}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
              {counts.completed}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
              {counts.cancelled}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Upcoming */}
        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <CardsSkeleton />
          ) : upcoming.length === 0 ? (
            <EmptyState message="You have no upcoming bookings right now." />
          ) : (
            <div className="space-y-3">
              {upcoming.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="mt-4">
          {loading ? (
            <CardsSkeleton />
          ) : completed.length === 0 ? (
            <EmptyState message="Your completed bookings will show up here." />
          ) : (
            <div className="space-y-3">
              {completed.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cancelled */}
        <TabsContent value="cancelled" className="mt-4">
          {loading ? (
            <CardsSkeleton />
          ) : cancelledBookings.length === 0 ? (
            <EmptyState message="No cancelled bookings to display." />
          ) : (
            <div className="space-y-3">
              {cancelledBookings.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CustomerBookings;
