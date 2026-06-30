"use client";

import * as React from "react";
import {
  Mail,
  MessageCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  Reply,
  FileText,
  CreditCard,
  Bell,
  CheckCheck,
  Loader2,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_enquiry"
  | "new_message"
  | "quote_accepted"
  | "deposit_received"
  | "booking_confirmed"
  | "vendor_replied"
  | "new_quote"
  | "payment_received"
  | "concierge_assigned"
  | "new_signup"
  | "pending_approval"
  | "ai_flagged"
  | string; // tolerate unknown types from the backend

interface Notification {
  id: string;
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  vendorId: string | null;
  productId: string | null;
  bookingId: string | null;
  quoteId: string | null;
  conversationId: string | null;
  actionUrl: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsProps {
  vendorId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification type → icon + colour mapping
// ─────────────────────────────────────────────────────────────────────────────

interface TypeMeta {
  icon: LucideIcon;
  /** Tailwind classes for the icon container background + icon colour. */
  chipClass: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  new_enquiry: {
    icon: Mail,
    chipClass: "bg-blue-50 text-blue-600",
  },
  new_message: {
    icon: MessageCircle,
    chipClass: "bg-violet-50 text-violet-600",
  },
  quote_accepted: {
    icon: CheckCircle2,
    chipClass: "bg-emerald-50 text-emerald-600",
  },
  deposit_received: {
    icon: DollarSign,
    chipClass: "bg-teal-50 text-teal-600",
  },
  booking_confirmed: {
    icon: Calendar,
    chipClass: "bg-green-50 text-green-600",
  },
  vendor_replied: {
    icon: Reply,
    chipClass: "bg-amber-50 text-amber-600",
  },
  new_quote: {
    icon: FileText,
    chipClass: "bg-indigo-50 text-indigo-600",
  },
  payment_received: {
    icon: CreditCard,
    chipClass: "bg-emerald-50 text-emerald-600",
  },
};

const DEFAULT_META: TypeMeta = {
  icon: Bell,
  chipClass: "bg-slate-100 text-slate-600",
};

function metaFor(type: string): TypeMeta {
  return TYPE_META[type] ?? DEFAULT_META;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Notifications({ vendorId: _vendorId }: NotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [markingAll, setMarkingAll] = React.useState(false);

  const fetchList = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?role=vendor", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications?: Notification[];
        unreadCount?: number;
      };
      setNotifications(data.notifications ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // ── Mark single as read + navigate ──
  const handleClick = async (n: Notification) => {
    // Optimistically mark as read in the UI
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) =>
          x.id === n.id
            ? { ...x, read: true, readAt: new Date().toISOString() }
            : x,
        ),
      );
      try {
        await fetch("/api/notifications/read?role=vendor", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
      } catch {
        // silent — optimistic UI is best-effort
      }
    }

    if (n.actionUrl) {
      // Internal URLs go through the Next router; external go via window.
      if (/^https?:\/\//i.test(n.actionUrl)) {
        window.open(n.actionUrl, "_blank", "noopener,noreferrer");
      } else {
        router.push(n.actionUrl);
      }
    }
  };

  // ── Mark all as read ──
  const handleMarkAll = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    const prev = notifications;
    // Optimistic update
    setNotifications((cur) =>
      cur.map((n) =>
        n.read ? n : { ...n, read: true, readAt: new Date().toISOString() },
      ),
    );
    try {
      const res = await fetch("/api/notifications/read?role=vendor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      toast.success("All notifications marked as read");
    } catch (err) {
      // Rollback
      setNotifications(prev);
      toast.error(
        err instanceof Error ? err.message : "Failed to mark as read",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Stay on top of new enquiries, quotes, and bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="border-0 bg-brand text-brand-foreground">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleMarkAll()}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Mark all as read
          </Button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="rounded-xl border border-border bg-card">
        <ScrollArea className="max-h-[calc(100vh-14rem)]">
          {loading ? (
            <NotificationListSkeleton />
          ) : notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => void handleClick(n)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification item
// ─────────────────────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const meta = metaFor(notification.type);
  const Icon = meta.icon;
  const unread = !notification.read;
  const clickable = !!notification.actionUrl;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
          unread ? "bg-brand-soft/30" : "",
          clickable ? "hover:bg-accent/50 cursor-pointer" : "cursor-default",
        )}
      >
        {/* Icon chip */}
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            meta.chipClass,
          )}
        >
          <Icon className="size-4" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm leading-tight",
                unread ? "font-bold" : "font-semibold text-foreground/90",
              )}
            >
              {notification.title}
            </p>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {timeAgo(notification.createdAt)}
            </span>
          </div>

          {notification.message && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {notification.message}
            </p>
          )}

          {/* Type label */}
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {notification.type.replace(/_/g, " ")}
          </p>
        </div>

        {/* Unread indicator */}
        {unread && (
          <span
            aria-label="Unread"
            className="mt-1 size-2 shrink-0 rounded-full bg-brand"
          />
        )}
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty + loading states
// ─────────────────────────────────────────────────────────────────────────────

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-brand-soft">
        <Inbox className="size-6 text-brand" />
      </div>
      <p className="mt-3 text-sm font-semibold">You&apos;re all caught up</p>
      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
        New enquiries, messages, and booking updates will appear here.
      </p>
    </div>
  );
}

function NotificationListSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}
