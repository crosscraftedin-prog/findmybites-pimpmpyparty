"use client";

import * as React from "react";
import { LifeBuoy, MessageCircle, Plus, AlertCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SupportWidgetProps {
  onNavigate: (tab: string) => void;
}

/**
 * Compact support widget for the dashboard Overview.
 * Shows: need help CTA, open ticket count, unread badge, quick actions.
 */
export function SupportWidget({ onNavigate }: SupportWidgetProps) {
  const [stats, setStats] = React.useState({ total: 0, open: 0, unread: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/vendor/support/faqs")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.stats) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Need Help?</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Get support from our team — we typically reply within a few hours.</p>
        </div>
        {stats.unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {stats.unread}
          </span>
        )}
      </div>

      {!loading && stats.total > 0 && (
        <div className="mt-3 flex items-center gap-4 rounded-lg bg-muted/30 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{stats.total}</span> tickets
          </span>
          {stats.open > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-medium">{stats.open}</span> open
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onNavigate("support")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-3.5 w-3.5" />
          Open Support Ticket
        </button>
        {stats.total > 0 && (
          <button
            onClick={() => onNavigate("support")}
            className="flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            View Tickets
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
