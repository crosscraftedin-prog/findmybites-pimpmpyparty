/**
 * Archived on 2026-07-14
 * Reason: Zero runtime references found during production audit.
 * Preserved for future features.
 */
"use client";

import * as React from "react";
import { Download, Receipt, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * BillingHistory — Vendor billing history table (Step 6).
 *
 * Shows: Date, Plan, Amount, Payment ID, Order ID, Status, Invoice Number,
 * Payment Method — newest first.
 *
 * Fetches from /api/subscriptions/[vendorId] (paymentHistory field)
 */

interface PaymentHistoryEntry {
  id: string;
  invoiceNumber: string | null;
  date: string;
  planName: string;
  billingCycle: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  orderId: string;
  paymentId: string;
  paymentMethod: string | null;
  paymentType: string;
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

const METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
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

export function BillingHistory({ vendorId }: { vendorId: string }) {
  const [history, setHistory] = React.useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/subscriptions/${vendorId}`);
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.paymentHistory ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="h-6 w-40 rounded bg-muted mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Receipt className="size-5 text-[#FF6B35]" />
          <h3 className="font-semibold text-foreground">Billing History</h3>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={loadHistory}>
            <RefreshCw className="size-3.5 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10">
          <Receipt className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No payments yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your payment history will appear here after your first subscription.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Plan</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Amount</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Method</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Invoice</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {history.map((payment) => (
                <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-2 text-foreground whitespace-nowrap">
                    {formatDate(payment.date)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-foreground">
                      {PLAN_LABELS[payment.planName] ?? payment.planName}
                    </div>
                    <div className="text-[10px] text-muted-foreground capitalize">
                      {payment.billingCycle}
                    </div>
                  </td>
                  <td className="py-3 px-2 font-medium text-foreground whitespace-nowrap">
                    {formatAmount(payment.amount, payment.currency)}
                  </td>
                  <td className="py-3 px-2">
                    <span className={cn(
                      "text-xs capitalize",
                      payment.paymentType === "renewal" ? "text-blue-600" : "text-emerald-600"
                    )}>
                      {payment.paymentType}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground text-xs">
                    {payment.paymentMethod ? (METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod) : "—"}
                  </td>
                  <td className="py-3 px-2">
                    {payment.invoiceNumber ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {payment.invoiceNumber}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-2">
                    {payment.paymentStatus === "captured" ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="size-3 mr-1" />
                        Captured
                      </Badge>
                    ) : payment.paymentStatus === "failed" ? (
                      <Badge className="bg-red-100 text-red-700">
                        <XCircle className="size-3 mr-1" />
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{payment.paymentStatus}</Badge>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {payment.paymentId.slice(0, 14)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
