"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  UserX,
  TrendingUp,
  RefreshCcw,
  Crown,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * AdminSubscriptions — Admin subscription management dashboard (Step 8).
 *
 * Shows: Total Active Vendors, Expiring in 7 Days, Expired Vendors,
 * Monthly Revenue, Renewals This Month.
 *
 * Allows manual extension or cancellation of subscriptions.
 *
 * Fetches from /api/admin/subscriptions
 */

interface AdminReport {
  totalActiveVendors: number;
  expiringIn7Days: number;
  expiredVendors: number;
  monthlyRevenue: { amount: number; currency: string; count: number };
  renewalsThisMonth: number;
}

interface ExpiringSub {
  subscriptionId: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorEmail: string | null;
  vendorCity: string;
  planName: string;
  planTier: string;
  billingCycle: string;
  planExpiresAt: string;
  daysRemaining: number;
}

interface ExpiredSub {
  subscriptionId: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorEmail: string | null;
  planName: string;
  planExpiresAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  "vendor-pro": "Baker Pro",
  "business": "Business",
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency + " ";
  return `${symbol}${(amount / 100).toLocaleString("en-IN")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminSubscriptions() {
  const [report, setReport] = React.useState<AdminReport | null>(null);
  const [expiring, setExpiring] = React.useState<ExpiringSub[]>([]);
  const [expired, setExpired] = React.useState<ExpiredSub[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) return;
      const data = await res.json();
      setReport(data.report);
      setExpiring(data.expiring ?? []);
      setExpired(data.expired ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (action: "extend" | "cancel", subscriptionId: string, days?: number) => {
    setActionLoading(subscriptionId);
    try {
      await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, subscriptionId, days }),
      });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!report) return null;

  const stats = [
    {
      label: "Active Vendors",
      value: report.totalActiveVendors,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Expiring (7 days)",
      value: report.expiringIn7Days,
      icon: CalendarClock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Expired",
      value: report.expiredVendors,
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(report.monthlyRevenue.amount, report.monthlyRevenue.currency),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Renewals (Month)",
      value: report.renewalsThisMonth,
      icon: RefreshCcw,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("grid size-9 place-items-center rounded-full", stat.bg)}>
                <stat.icon className={cn("size-4", stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Expiring soon table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="size-5 text-amber-600" />
          <h3 className="font-semibold text-foreground">Expiring Soon (within 7 days)</h3>
          <Badge className="bg-amber-100 text-amber-700">{expiring.length}</Badge>
        </div>

        {expiring.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No subscriptions expiring soon.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Vendor</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Plan</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">City</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Expires</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Days Left</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map(sub => (
                  <tr key={sub.subscriptionId} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-2">
                      <a href={`/vendor/${sub.vendorSlug}`} className="font-medium text-foreground hover:underline">
                        {sub.vendorName}
                      </a>
                      {sub.vendorEmail && (
                        <div className="text-[10px] text-muted-foreground">{sub.vendorEmail}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-xs">{PLAN_LABELS[sub.planName] ?? sub.planName}</span>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground text-xs">{sub.vendorCity}</td>
                    <td className="py-2.5 px-2 text-muted-foreground text-xs">{formatDate(sub.planExpiresAt)}</td>
                    <td className="py-2.5 px-2">
                      <span className={cn(
                        "font-bold text-xs",
                        sub.daysRemaining <= 3 ? "text-red-600" : "text-amber-600"
                      )}>
                        {sub.daysRemaining}d
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          disabled={actionLoading === sub.subscriptionId}
                          onClick={() => handleAction("extend", sub.subscriptionId, 30)}
                        >
                          +30 days
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] text-red-600 hover:text-red-700"
                          disabled={actionLoading === sub.subscriptionId}
                          onClick={() => handleAction("cancel", sub.subscriptionId)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expired table */}
      {expired.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserX className="size-5 text-red-600" />
            <h3 className="font-semibold text-foreground">Expired Subscriptions</h3>
            <Badge className="bg-red-100 text-red-700">{expired.length}</Badge>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Vendor</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Plan</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Expired On</th>
                  <th className="py-2 px-2 font-medium text-xs uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expired.map(sub => (
                  <tr key={sub.subscriptionId} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-2">
                      <a href={`/vendor/${sub.vendorSlug}`} className="font-medium text-foreground hover:underline">
                        {sub.vendorName}
                      </a>
                    </td>
                    <td className="py-2.5 px-2 text-xs">{PLAN_LABELS[sub.planName] ?? sub.planName}</td>
                    <td className="py-2.5 px-2 text-muted-foreground text-xs">{formatDate(sub.planExpiresAt)}</td>
                    <td className="py-2.5 px-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        disabled={actionLoading === sub.subscriptionId}
                        onClick={() => handleAction("extend", sub.subscriptionId, 30)}
                      >
                        <Crown className="size-3 mr-1" />
                        Reactivate (+30d)
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
