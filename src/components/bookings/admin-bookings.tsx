"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  TrendingUp,
  XCircle,
  IndianRupee,
  Wallet,
  Search,
  Inbox,
  Users,
  MoreHorizontal,
  Ban,
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface BookingAnalytics {
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  conversionRate: number;
  cancellationRate: number;
  averageBookingValue: number;
  totalRevenue: number;
  topVendors: {
    vendorId: string;
    vendorName: string;
    bookingCount: number;
    revenue: number;
  }[];
}

interface AdminBookingsResponse {
  bookings: BookingDetails[];
  count: number;
  analytics: BookingAnalytics;
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

function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
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

// ─────────────────────────────────────────────────────────────────────────────
// Analytics card
// ─────────────────────────────────────────────────────────────────────────────

interface AnalyticsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  index?: number;
}

function AnalyticsCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  index = 0,
}: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-bold text-foreground sm:text-xl">
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

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-7">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action dialogs
// ─────────────────────────────────────────────────────────────────────────────

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails | null;
  onConfirm: (reason: string) => Promise<void>;
  submitting: boolean;
}

function CancelDialog({
  open,
  onOpenChange,
  booking,
  onConfirm,
  submitting,
}: CancelDialogProps) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel booking</DialogTitle>
          <DialogDescription>
            Cancel{" "}
            <span className="font-mono text-xs font-semibold text-foreground">
              {booking?.bookingNumber}
            </span>{" "}
            for {booking?.customerName ?? "this customer"}. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation, scheduling conflict..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Keep booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <Ban className="size-4" />
                Cancel booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails | null;
  onConfirm: (newVendorId: string) => Promise<void>;
  submitting: boolean;
}

function ReassignDialog({
  open,
  onOpenChange,
  booking,
  onConfirm,
  submitting,
}: ReassignDialogProps) {
  const [newVendorId, setNewVendorId] = React.useState("");

  React.useEffect(() => {
    if (open) setNewVendorId("");
  }, [open]);

  const trimmed = newVendorId.trim();
  const valid = trimmed.length > 0;

  const handleConfirm = async () => {
    if (!valid) return;
    await onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign booking</DialogTitle>
          <DialogDescription>
            Transfer{" "}
            <span className="font-mono text-xs font-semibold text-foreground">
              {booking?.bookingNumber}
            </span>{" "}
            from{" "}
            <span className="font-medium text-foreground">
              {booking?.vendorName || "current vendor"}
            </span>{" "}
            to another vendor. The original vendor will lose access to this
            booking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-vendor-id">New vendor ID</Label>
          <Input
            id="new-vendor-id"
            value={newVendorId}
            onChange={(e) => setNewVendorId(e.target.value)}
            placeholder="e.g. cm5abc123def456..."
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Paste the unique vendor ID of the new owner. You can find this in
            the vendor management section.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Close
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !valid}
            className="bg-[#FF6B35] hover:bg-[#e85a2a]"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              <>
                <ArrowLeftRight className="size-4" />
                Reassign booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function AdminBookings() {
  const [data, setData] = React.useState<AdminBookingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refetching, setRefetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [cityFilter, setCityFilter] = React.useState("");

  // Debounced fetch params
  const debouncedSearch = useDebouncedValue(search, 350);
  const debouncedCity = useDebouncedValue(cityFilter, 350);

  // Action dialog state
  const [cancelTarget, setCancelTarget] = React.useState<BookingDetails | null>(
    null
  );
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelSubmitting, setCancelSubmitting] = React.useState(false);

  const [reassignTarget, setReassignTarget] =
    React.useState<BookingDetails | null>(null);
  const [reassignOpen, setReassignOpen] = React.useState(false);
  const [reassignSubmitting, setReassignSubmitting] = React.useState(false);

  const fetchData = React.useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) {
        setRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (debouncedCity) params.set("city", debouncedCity);
        const qs = params.toString();
        const url = `/api/admin/bookings${qs ? `?${qs}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load bookings");
        setData(json as AdminBookingsResponse);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load bookings";
        setError(message);
      } finally {
        if (opts.silent) setRefetching(false);
        else setLoading(false);
      }
    },
    [debouncedSearch, debouncedCity, statusFilter]
  );

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCancel = React.useCallback(
    async (reason: string) => {
      if (!cancelTarget) return;
      setCancelSubmitting(true);
      try {
        const res = await fetch(`/api/admin/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancel",
            bookingId: cancelTarget.id,
            reason: reason || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to cancel booking");
        }
        toast.success(`Booking ${cancelTarget.bookingNumber} cancelled`);
        setCancelOpen(false);
        setCancelTarget(null);
        await fetchData({ silent: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to cancel booking";
        toast.error(message);
      } finally {
        setCancelSubmitting(false);
      }
    },
    [cancelTarget, fetchData]
  );

  const handleReassign = React.useCallback(
    async (newVendorId: string) => {
      if (!reassignTarget) return;
      setReassignSubmitting(true);
      try {
        const res = await fetch(
          `/api/admin/bookings/${reassignTarget.id}/reassign`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newVendorId }),
          }
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to reassign booking");
        }
        toast.success(
          `Booking ${reassignTarget.bookingNumber} reassigned to new vendor`
        );
        setReassignOpen(false);
        setReassignTarget(null);
        await fetchData({ silent: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to reassign booking";
        toast.error(message);
      } finally {
        setReassignSubmitting(false);
      }
    },
    [reassignTarget, fetchData]
  );

  const openCancel = (booking: BookingDetails) => {
    setCancelTarget(booking);
    setCancelOpen(true);
  };

  const openReassign = (booking: BookingDetails) => {
    setReassignTarget(booking);
    setReassignOpen(true);
  };

  // ── Derived analytics cards ──────────────────────────────────────────────

  const analyticsCards = React.useMemo(() => {
    const a = data?.analytics;
    return [
      {
        icon: CalendarDays,
        label: "Today",
        value: a?.todayCount ?? 0,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      {
        icon: CalendarRange,
        label: "This Week",
        value: a?.thisWeekCount ?? 0,
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
      },
      {
        icon: CalendarClock,
        label: "This Month",
        value: a?.thisMonthCount ?? 0,
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
      },
      {
        icon: TrendingUp,
        label: "Conversion",
        value: formatPercent(a?.conversionRate ?? 0),
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        icon: XCircle,
        label: "Cancellation",
        value: formatPercent(a?.cancellationRate ?? 0),
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
      },
      {
        icon: IndianRupee,
        label: "Avg Value",
        value: formatAmount(a?.averageBookingValue ?? 0),
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
      {
        icon: Wallet,
        label: "Total Revenue",
        value: formatAmount(a?.totalRevenue ?? 0),
        iconBg: "bg-[#FF6B35]/10",
        iconColor: "text-[#FF6B35]",
      },
    ];
  }, [data]);

  const bookings = data?.bookings ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Analytics */}
      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-7">
          {analyticsCards.map((card, i) => (
            <AnalyticsCard key={card.label} index={i} {...card} />
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
              placeholder="Search customer, booking #, email"
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
          <div className="relative sm:max-w-[200px]">
            <Input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter by city"
              className="w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground sm:text-sm">
            {count} booking{count === 1 ? "" : "s"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData({ silent: true })}
            disabled={refetching}
          >
            {refetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
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
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center">
          <Inbox className="size-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No bookings found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || statusFilter !== "all" || cityFilter
              ? "Try adjusting your filters."
              : "New bookings will appear here."}
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
                <TableHead>Vendor</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-4 font-mono text-xs font-medium text-foreground">
                    {b.bookingNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {b.customerName || "\u2014"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {b.customerEmail || "\u2014"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Store className="size-3.5 text-muted-foreground/70" />
                      {b.vendorName || "\u2014"}
                    </span>
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${b.bookingNumber}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          {b.bookingNumber}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            openReassign(b);
                          }}
                        >
                          <ArrowLeftRight className="size-4" />
                          Reassign vendor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            openCancel(b);
                          }}
                          disabled={b.status === "cancelled"}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Ban className="size-4" />
                          Cancel booking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Action dialogs */}
      <CancelDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelTarget(null);
        }}
        booking={cancelTarget}
        onConfirm={handleCancel}
        submitting={cancelSubmitting}
      />
      <ReassignDialog
        open={reassignOpen}
        onOpenChange={(open) => {
          setReassignOpen(open);
          if (!open) setReassignTarget(null);
        }}
        booking={reassignTarget}
        onConfirm={handleReassign}
        submitting={reassignSubmitting}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default AdminBookings;
