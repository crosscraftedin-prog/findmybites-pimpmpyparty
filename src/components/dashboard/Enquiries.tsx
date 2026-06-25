"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Mail,
  Archive,
  ExternalLink,
  Inbox,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Booking } from "@/lib/types";

interface EnquiriesProps {
  bookings: (Booking & { vendorName: string })[];
}

type FilterTab = "all" | "new" | "replied" | "archived";

export function Enquiries({ bookings }: EnquiriesProps) {
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(new Set());

  const filtered = bookings.filter((b) => {
    if (filter === "all") return !archivedIds.has(b.id);
    if (filter === "new") return b.status === "pending" && !archivedIds.has(b.id);
    if (filter === "archived") return archivedIds.has(b.id);
    return !archivedIds.has(b.id);
  });

  const archive = (id: string) => {
    setArchivedIds((prev) => new Set(prev).add(id));
    toast.success("Enquiry archived");
  };

  const shareListing = () => {
    const url = `${window.location.origin}/vendor/${bookings[0]?.vendorName ?? ""}`;
    navigator.clipboard?.writeText(url);
    toast.success("Listing link copied to clipboard!");
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight">
        Enquiries &amp; Quote Requests
      </h1>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(["all", "new", "replied", "archived"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
              filter === tab
                ? "bg-brand text-brand-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Enquiries list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((b) => (
            <EnquiryCard
              key={b.id}
              booking={b}
              onArchive={() => archive(b.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <Inbox className="size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold">No enquiries yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Share your listing to start getting enquiries from customers.
          </p>
          <Button
            onClick={shareListing}
            className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Share2 className="size-4" />
            Share My Listing
          </Button>
        </div>
      )}
    </div>
  );
}

function EnquiryCard({
  booking,
  onArchive,
}: {
  booking: Booking;
  onArchive: () => void;
}) {
  const isNew = booking.status === "pending";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {/* Avatar initials */}
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {booking.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-bold">{booking.name}</p>
            <div className="flex shrink-0 items-center gap-2">
              {isNew && (
                <Badge className="border-0 bg-brand text-[10px] text-brand-foreground">
                  New
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {timeAgo(booking.createdAt)}
              </span>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{booking.eventType}</span>
            <span>· {new Date(booking.eventDate).toLocaleDateString()}</span>
            <span>· {booking.guests} guests</span>
            <span>· {booking.budget}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
            {booking.message}
          </p>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`mailto:${booking.email}?subject=Re: Your enquiry for ${booking.eventType}&body=Hi ${booking.name}, thanks for your enquiry about ${booking.eventType}...`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              <Mail className="size-3.5" />
              Reply by Email
            </a>
            <button
              onClick={onArchive}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <Archive className="size-3.5" />
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}
