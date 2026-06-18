"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminBookings,
  useUpdateBookingStatus,
  useDeleteBooking,
} from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
};

export function AdminBookings() {
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isFetching } = useAdminBookings({
    status,
    page,
    pageSize: 20,
  });
  const updateStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();

  const bookings = data?.bookings ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const setStatus_ = (id: string, s: "confirmed" | "declined" | "pending") => {
    updateStatus.mutate(
      { id, status: s },
      {
        onSuccess: () => toast.success(`Booking ${s}.`),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this booking permanently?")) return;
    deleteBooking.mutate(id, {
      onSuccess: () => toast.success("Booking deleted."),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[180px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {isFetching && !isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" /> Updating…
            </span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{total}</span>{" "}
              {total === 1 ? "booking" : "bookings"}
            </>
          )}
        </p>
      </div>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Vendor</th>
              <th className="px-4 py-3 text-left font-semibold">Event</th>
              <th className="px-4 py-3 text-left font-semibold">Guests</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{b.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {b.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{b.vendorCity}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.eventType}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {b.eventDate} · {b.eventCity}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3.5" />
                      {b.guests}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        STATUS_STYLE[b.status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {b.status !== "confirmed" && (
                        <button
                          title="Confirm"
                          onClick={() => setStatus_(b.id, "confirmed")}
                          className="grid size-8 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                          disabled={updateStatus.isPending}
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                      {b.status !== "declined" && (
                        <button
                          title="Decline"
                          onClick={() => setStatus_(b.id, "declined")}
                          className="grid size-8 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                          disabled={updateStatus.isPending}
                        >
                          <X className="size-4" />
                        </button>
                      )}
                      <button
                        title="Delete"
                        onClick={() => onDelete(b.id)}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
                        disabled={deleteBooking.isPending}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card list (mobile) */}
      <div className="space-y-3 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : bookings.map((b) => (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.eventType} · {b.vendorName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      STATUS_STYLE[b.status]
                    )}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {b.eventDate} · {b.eventCity} · {b.guests} guests · {timeAgo(b.createdAt)}
                </p>
                <div className="mt-2 flex gap-1.5">
                  {b.status !== "confirmed" && (
                    <Button size="sm" variant="outline" className="h-8 flex-1 text-emerald-600" onClick={() => setStatus_(b.id, "confirmed")}>
                      <Check className="size-3.5" /> Confirm
                    </Button>
                  )}
                  {b.status !== "declined" && (
                    <Button size="sm" variant="outline" className="h-8 flex-1 text-rose-600" onClick={() => setStatus_(b.id, "declined")}>
                      <X className="size-3.5" /> Decline
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8" onClick={() => onDelete(b.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
