/**
 * Archived on 2026-07-14
 * Reason: Zero runtime references found during production audit.
 * Preserved for future features.
 */
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown, Clock, AlertTriangle, CheckCircle2, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SubscriptionDashboard — Vendor subscription status widget (Step 2).
 *
 * Shows: Current Plan, Plan Status, Start Date, Expiry Date, Days Remaining,
 * a progress bar, and a "Renew Plan" button when fewer than 10 days remain.
 *
 * Fetches from /api/subscriptions/[vendorId]
 */

interface ActiveSubscriptionInfo {
  subscriptionId: string;
  vendorId: string;
  planName: string;
  planTier: string;
  billingCycle: string;
  status: string;
  planStartedAt: string;
  planExpiresAt: string;
  nextRenewalDate: string | null;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  amountPaid: number;
  currency: string;
  provider: string;
}

const PLAN_LABELS: Record<string, string> = {
  "vendor-pro": "Baker Pro",
  "business": "Business",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  AED: "AED",
};

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  return `${symbol}${(amount / 100).toFixed(0)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionDashboard({
  vendorId,
  onRenew,
}: {
  vendorId: string;
  onRenew?: () => void;
}) {
  const [subscription, setSubscription] = React.useState<ActiveSubscriptionInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadSubscription = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/subscriptions/${vendorId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSubscription(data.subscription ?? null);
    } catch {
      // silent — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  React.useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="h-6 w-48 rounded bg-muted mb-4" />
        <div className="h-4 w-32 rounded bg-muted mb-2" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
    );
  }

  // No active subscription — show free plan
  if (!subscription || subscription.isExpired) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid size-10 place-items-center rounded-full bg-muted">
            <Clock className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Current Plan</h3>
            <p className="text-sm text-muted-foreground">Free</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {subscription?.isExpired
            ? "Your subscription has expired. Upgrade to restore premium features."
            : "Upgrade to unlock premium features like priority search, verified badge, and AI tools."}
        </p>
        <Button onClick={onRenew} className="w-full bg-[#FF6B35] hover:bg-[#e85a2a]">
          <Crown className="size-4 mr-2" />
          {subscription?.isExpired ? "Renew Plan" : "Upgrade Plan"}
        </Button>
      </div>
    );
  }

  const planLabel = PLAN_LABELS[subscription.planName] ?? subscription.planName;
  const daysRemaining = subscription.daysRemaining;
  const totalDays = subscription.billingCycle === "yearly" ? 365 : 30;
  const progressPercent = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));
  const showRenewButton = subscription.isExpiringSoon; // < 10 days

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      {/* Header: Plan name + status badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{planLabel}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {subscription.billingCycle} billing
            </p>
          </div>
        </div>
        <Badge
          className={cn(
            "capitalize",
            subscription.status === "active" && "bg-emerald-100 text-emerald-700",
            subscription.status === "expired" && "bg-red-100 text-red-700",
            subscription.status === "cancelled" && "bg-gray-100 text-gray-700"
          )}
        >
          {subscription.status === "active" && <CheckCircle2 className="size-3 mr-1" />}
          {subscription.status}
        </Badge>
      </div>

      {/* Dates grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Start Date
          </p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1">
            <Calendar className="size-3 text-muted-foreground" />
            {formatDate(subscription.planStartedAt)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Expiry Date
          </p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1">
            <Calendar className="size-3 text-muted-foreground" />
            {formatDate(subscription.planExpiresAt)}
          </p>
        </div>
      </div>

      {/* Days remaining + progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Days Remaining</span>
          <span
            className={cn(
              "text-sm font-bold",
              daysRemaining <= 3 && "text-red-600",
              daysRemaining <= 10 && daysRemaining > 3 && "text-amber-600",
              daysRemaining > 10 && "text-emerald-600"
            )}
          >
            {daysRemaining} days
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              "h-full rounded-full",
              daysRemaining <= 3 ? "bg-red-500" : daysRemaining <= 10 ? "bg-amber-500" : "bg-emerald-500"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {subscription.isExpiringSoon
            ? `Expires in ${daysRemaining} days — renew now to avoid losing premium features`
            : `Expires in ${daysRemaining} days`}
        </p>
      </div>

      {/* Amount paid */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-3 border-t border-border">
        <span>Last payment</span>
        <span className="font-medium text-foreground">
          {formatAmount(subscription.amountPaid, subscription.currency)}
        </span>
      </div>

      {/* Renew button (shown when < 10 days remain) */}
      {showRenewButton && (
        <Button
          onClick={onRenew}
          className="w-full bg-[#FF6B35] hover:bg-[#e85a2a]"
        >
          <RefreshCw className="size-4 mr-2" />
          Renew Plan
        </Button>
      )}

      {/* Expiry warning banner */}
      {daysRemaining <= 3 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Your plan expires soon. Premium features (verified badge, priority search, AI tools) will be locked after expiry. Your listing stays published.
          </p>
        </div>
      )}
    </motion.div>
  );
}
