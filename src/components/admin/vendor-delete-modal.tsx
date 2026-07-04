"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VendorDeleteModalProps {
  /** Single vendor name, or null when closed */
  vendorName: string | null;
  /** For bulk mode: count of vendors */
  bulkCount?: number;
  /** Vendors being deleted (names, for display) */
  vendorNames?: string[];
  onClose: () => void;
  onDeleted: () => void;
  /** Called with { reason } → performs the actual deletion via API */
  deleteAction: (reason: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

/**
 * Dangerous-action confirmation modal.
 * The admin must type DELETE (case-sensitive) to enable the button,
 * and provide a reason for the audit log.
 */
export function VendorDeleteModal({
  vendorName, bulkCount, vendorNames, onClose, onDeleted, deleteAction,
}: VendorDeleteModalProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const isOpen = Boolean(vendorName || (bulkCount && bulkCount > 0));

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setReason("");
      setDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canDelete = confirmText === "DELETE" && reason.trim().length >= 4 && !deleting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const result = await deleteAction(reason.trim());
      if (result.success) {
        toast.success(result.message || "Vendor deleted successfully");
        onDeleted();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete vendor");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const title = bulkCount && bulkCount > 1
    ? `Delete ${bulkCount} vendors`
    : `Delete "${vendorName}"`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onClose(); }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-red-600 dark:text-red-400">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">This action is permanent and cannot be undone.</p>
          </div>
          <button onClick={onClose} disabled={deleting} className="grid size-7 place-items-center rounded-full hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          {/* What gets deleted */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
            <p className="font-semibold">This will permanently delete:</p>
            <ul className="mt-1.5 space-y-0.5">
              <li>• Vendor profile & all listing data</li>
              <li>• All products & product images</li>
              <li>• Gallery photos</li>
              <li>• All reviews</li>
              <li>• All bookings (legacy + V2)</li>
              <li>• Wishlist references & followers</li>
              <li>• Analytics, marketing campaigns, referrals</li>
              <li>• All files in Supabase Storage</li>
            </ul>
          </div>

          {/* Vendor names (bulk mode) */}
          {vendorNames && vendorNames.length > 1 && (
            <div className="max-h-24 overflow-y-auto rounded-lg border border-border p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Vendors ({vendorNames.length})</p>
              <ul className="space-y-0.5">
                {vendorNames.slice(0, 20).map((n, i) => (
                  <li key={i} className="truncate text-xs">• {n}</li>
                ))}
                {vendorNames.length > 20 && <li className="text-[10px] text-muted-foreground">…and {vendorNames.length - 20} more</li>}
              </ul>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="delete-reason" className="text-xs font-medium">
              Reason for deletion <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="delete-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Spam listing, duplicate, vendor request, test data…"
              disabled={deleting}
            />
            <p className="text-[10px] text-muted-foreground">Recorded in the admin audit log.</p>
          </div>

          {/* Type DELETE confirmation */}
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm" className="text-xs font-medium">
              Type <code className="rounded bg-muted px-1 py-0.5 font-mono text-red-600 dark:text-red-400">DELETE</code> to confirm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={deleting}
              autoComplete="off"
              className={cn(confirmText && confirmText !== "DELETE" && "border-red-500")}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {deleting ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 className="mr-1.5 h-4 w-4" /> Delete permanently</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
