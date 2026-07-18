/**
 * Archived on 2026-07-14
 * Reason: Zero runtime references found during production audit.
 * Preserved for future features.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Search,
  Inbox,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface VendorDashboardStats {
  newCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  revenue: number;
  bookings: BookingDetails[];
}

interface VendorBookingsDashboardProps {
  vendorId: string;
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

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  index?: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold text-foreground sm:text-2xl">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10",
            iconBg
          )}
        >
          <Icon className={cn("size-4 sm:size-5", iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeletons
// ─────────────────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function VendorBookingsDashboard({ vendorId }: VendorBookingsDashboardProps) {
  const router = useRouter();
  const [data, setData] = React.useState<VendorDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/vendor/${vendorId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load bookings");
        if (!cancelled) setData(json as VendorDashboardStats);
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
  }, [vendorId]);

  const stats = React.useMemo(() => {
    if (!data) {
      return [
        {
          icon: Bell,
          label: "New",
          value: 0,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
        },
        {
          icon: CalendarDays,
          label: "Today",
          value: 0,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          icon: CalendarClock,
          label: "Upcoming",
          value: 0,
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
        },
        {
          icon: CheckCircle2,
          label: "Completed",
          value: 0,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
        },
        {
          icon: XCircle,
          label: "Cancelled",
          value: 0,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
        },
        {
          icon: IndianRupee,
          label: "Revenue",
          value: "\u20B90",
          iconBg: "bg-[#FF6B35]/10",
          iconColor: "text-[#FF6B35]",
        },
      ];
    }
    return [
      {
        icon: Bell,
        label: "New",
        value: data.newCount,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
      {
        icon: CalendarDays,
        label: "Today",
        value: data.todayCount,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      {
        icon: CalendarClock,
        label: "Upcoming",
        value: data.upcomingCount,
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
      },
      {
        icon: CheckCircle2,
        label: "Completed",
        value: data.completedCount,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        icon: XCircle,
        label: "Cancelled",
        value: data.cancelledCount,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
      },
      {
        icon: IndianRupee,
        label: "Revenue",
        value: formatAmount(data.revenue),
        iconBg: "bg-[#FF6B35]/10",
        iconColor: "text-[#FF6B35]",
      },
    ];
  }, [data]);

  const filteredBookings = React.useMemo(() => {
    if (!data?.bookings) return [];
    const q = search.trim().toLowerCase();
    return data.bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.customerName.toLowerCase().includes(q) ||
        b.bookingNumber.toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Stat cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} index={i} {...stat} />
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or booking #"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {filteredBookings.length} booking
          {filteredBookings.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Bookings table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center">
          <Inbox className="size-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">No bookings found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "New booking requests will appear here."}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4">Booking #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((b) => (
                <TableRow
                  key={b.id}
                  onClick={() => router.push(`/bookings/${b.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="pl-4 font-mono text-xs font-medium text-foreground">
                    <Link
                      href={`/bookings/${b.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-[#FF6B35] hover:underline"
                    >
                      {b.bookingNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {b.customerName || "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.eventType || "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(b.bookingDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.city || "\u2014"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3.5" />
                      {b.guests ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {formatAmount(b.totalAmount || b.budget)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Loading overlay for refetches */}
      {!loading && data && (
        <div className="sr-only" aria-live="polite">
          {filteredBookings.length} bookings visible
        </div>
      )}
    </div>
  );
}

export default VendorBookingsDashboard;
