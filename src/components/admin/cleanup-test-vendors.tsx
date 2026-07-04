"use client";

import * as React from "react";
import { Loader2, Trash2, X, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TestVendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  city: string;
  country: string;
  createdAt: string;
  approved: boolean;
  matchedOn: string;
}

interface CleanupTestVendorsProps {
  onClose: () => void;
  onCleaned: () => void;
}

/**
 * Modal that previews vendors matching test/demo/sample/temp/dummy name
 * patterns, then deletes them all with a reason for the audit log.
 */
export function CleanupTestVendors({ onClose, onCleaned }: CleanupTestVendorsProps) {
  const [loading, setLoading] = React.useState(true);
  const [vendors, setVendors] = React.useState<TestVendor[]>([]);
  const [reason, setReason] = React.useState("");
  const [cleaning, setCleaning] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");

  // Load preview
  React.useEffect(() => {
    fetch("/api/admin/vendors/cleanup-preview")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setVendors(d.vendors || []); })
      .catch(() => toast.error("Failed to load preview"))
      .finally(() => setLoading(false));
  }, []);

  const canClean = confirmText === "CLEANUP" && reason.trim().length >= 4 && !cleaning && vendors.length > 0;

  const handleClean = async () => {
    if (!canClean) return;
    setCleaning(true);
    try {
      const res = await fetch("/api/admin/vendors/cleanup-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || `Cleaned up ${json.summary?.success || 0} test vendors`);
        onCleaned();
        onClose();
      } else {
        toast.error(json.error || "Cleanup failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !cleaning) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold">Cleanup Test Vendors</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Vendors whose names contain <code className="font-mono">test, demo, sample, temp, dummy</code>
            </p>
          </div>
          <button onClick={onClose} disabled={cleaning} className="grid size-7 place-items-center rounded-full hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium">No test vendors found</p>
              <p className="text-xs text-muted-foreground">Your marketplace is clean — no vendors match the test/demo/sample patterns.</p>
            </div>
          ) : (
            <>
              {/* Warning */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span><strong>{vendors.length} vendors</strong> will be permanently deleted along with all their data (products, bookings, reviews, storage files).</span>
              </div>

              {/* Vendor list */}
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {vendors.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 rounded p-1.5 text-xs hover:bg-accent">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded text-[9px] font-medium",
                      v.ecosystem === "FINDMYBITES" ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    )}>{v.matchedOn.slice(0, 3).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{v.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{v.city}, {v.country} · {v.approved ? "Approved" : "Pending"}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reason <span className="text-red-500">*</span></Label>
                <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Removing test/demo data before launch" disabled={cleaning} />
              </div>

              {/* Type CLEANUP */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Type <code className="rounded bg-muted px-1 py-0.5 font-mono text-amber-600 dark:text-amber-400">CLEANUP</code> to confirm <span className="text-red-500">*</span>
                </Label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="CLEANUP"
                  disabled={cleaning}
                  autoComplete="off"
                  className={cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    confirmText && confirmText !== "CLEANUP" && "border-red-500")}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && vendors.length > 0 && (
          <div className="flex gap-2 border-t border-border p-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={cleaning}>Cancel</Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              onClick={handleClean}
              disabled={!canClean}
            >
              {cleaning ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Cleaning…</> : <><Trash2 className="mr-1.5 h-4 w-4" /> Delete {vendors.length} vendors</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
