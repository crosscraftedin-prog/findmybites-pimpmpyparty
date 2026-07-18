"use client";

import * as React from "react";
import {
  CreditCard, Check, X, Download, RefreshCw, Calendar, DollarSign,
  TrendingUp, AlertCircle, Loader2, Crown, Zap, Clock, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLAN_FEATURES, getDisplayName } from "@/lib/billing";
import type { PlanTier } from "@/lib/billing/types";

/**
 * VendorBillingCenter — Complete billing page for vendors.
 *
 * Shows: Current Plan, Plan Benefits, Renewal Date, Billing Cycle,
 * Auto Renew Status, Invoices, Payment History, Upgrade/Cancel.
 *
 * Fetches from:
 *   GET /api/subscriptions/[vendorId]
 *   GET /api/vendor/invoices (future)
 */

interface SubscriptionInfo {
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

interface PaymentEntry {
  id: string;
  invoiceNumber: string | null;
  date: string;
  planName: string;
  billingCycle: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentType: string;
  provider: string;
}

export function VendorBillingCenter({ vendorId }: { vendorId: string }) {
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = React.useState<PaymentEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/subscriptions/${vendorId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setSubscription(d?.subscription || null);
        setPayments(d?.paymentHistory || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading billing information…</div>;
  }

  const tier = (subscription?.planTier || "free") as PlanTier;
  const features = PLAN_FEATURES[tier];

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="overflow-hidden p-0">
        <div className={cn(
          "p-5 text-white",
          tier === "business" ? "bg-gradient-to-br from-purple-600 to-pink-600" :
          tier === "pro" ? "bg-gradient-to-br from-emerald-600 to-blue-600" :
          "bg-gradient-to-br from-gray-600 to-gray-700"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">Current Plan</p>
              <h2 className="text-2xl font-extrabold">{getDisplayName(tier)}</h2>
              {subscription && !subscription.isExpired && (
                <p className="mt-1 text-sm opacity-90">
                  {subscription.billingCycle === "yearly" ? "Yearly" : "Monthly"} ·
                  Renews {subscription.planExpiresAt ? new Date(subscription.planExpiresAt).toLocaleDateString() : "—"}
                </p>
              )}
            </div>
            {tier !== "free" && subscription && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide opacity-80">Amount</p>
                <p className="text-xl font-extrabold">
                  {subscription.currency === "INR" ? "₹" : "$"}
                  {(subscription.amountPaid / 100).toFixed(0)}
                </p>
                <p className="text-xs opacity-80">
                  Auto-renew: {subscription.provider === "razorpay_subscriptions" ? "✅ On" : "❌ Off"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        {subscription && (
          <div className="flex items-center gap-4 border-t border-border px-5 py-3 text-sm">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "size-2 rounded-full",
                subscription.status === "active" ? "bg-emerald-500" :
                subscription.status === "expired" ? "bg-rose-500" :
                subscription.status === "past_due" ? "bg-amber-500" :
                "bg-gray-400"
              )} />
              <span className="font-medium capitalize">{subscription.status}</span>
            </div>
            {subscription.daysRemaining > 0 && !subscription.isExpired && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3.5" /> {subscription.daysRemaining} days remaining
              </span>
            )}
            {subscription.isExpiringSoon && (
              <Badge variant="outline" className="text-amber-600">⚠️ Expiring soon</Badge>
            )}
          </div>
        )}
      </Card>

      {/* Plan Benefits */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-bold">Your Plan Includes</h3>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <FeatureItem label="Products" value={features.maxProducts === Infinity ? "Unlimited" : features.maxProducts.toString()} />
          <FeatureItem label="Gallery Images" value={features.maxGalleryImages === Infinity ? "Unlimited" : features.maxGalleryImages.toString()} />
          <FeatureItem label="AI Requests/Day" value={features.maxAiRequestsPerDay.toString()} />
          <FeatureItem label="Analytics" value={features.analytics ? "✅" : "❌"} />
          <FeatureItem label="AI Tools" value={features.aiTools ? "✅" : "❌"} />
          <FeatureItem label="Priority Search" value={features.prioritySearch ? "✅" : "❌"} />
          <FeatureItem label="Verified Badge" value={features.verifiedBadge ? "✅" : "❌"} />
          <FeatureItem label="Marketing Tools" value={features.marketingTools ? "✅" : "❌"} />
          <FeatureItem label="Video Upload" value={features.videoUpload ? "✅" : "❌"} />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {tier === "free" && (
          <Button className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
            <Crown className="size-4" /> Upgrade to Pro
          </Button>
        )}
        {tier === "pro" && (
          <Button className="gap-1.5 bg-purple-600 text-white hover:bg-purple-700">
            <Crown className="size-4" /> Upgrade to Business
          </Button>
        )}
        {tier !== "free" && subscription && !subscription.isExpired && (
          <Button variant="outline" className="gap-1.5">
            <RefreshCw className="size-4" /> Renew Now
          </Button>
        )}
        {tier !== "free" && subscription && subscription.provider === "razorpay_subscriptions" && (
          <Button variant="outline" className="gap-1.5 text-rose-600 hover:bg-rose-50">
            <X className="size-4" /> Cancel Auto-Renew
          </Button>
        )}
      </div>

      {/* Payment History */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <FileText className="size-4 text-brand" /> Payment History
        </h3>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Plan</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border/40">
                    <td className="py-2 text-muted-foreground">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 capitalize">{p.planName} {p.billingCycle}</td>
                    <td className="py-2 font-medium">
                      {p.currency === "INR" ? "₹" : "$"}{(p.amount / 100).toFixed(0)}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        p.paymentStatus === "captured" && "text-emerald-600",
                        p.paymentStatus === "failed" && "text-rose-600",
                      )}>
                        {p.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {p.invoiceNumber && (
                        <button className="text-xs text-brand hover:underline">
                          <Download className="inline size-3" /> {p.invoiceNumber}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default VendorBillingCenter;
