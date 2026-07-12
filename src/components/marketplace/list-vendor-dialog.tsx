"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Store, Sparkles, Pencil, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useMarketplace } from "@/lib/store";
import { ECOSYSTEM_META } from "@/lib/constants";
import { useVendor } from "@/lib/queries";
import { CreateVendorForm, CreateVendorSuccess } from "./create-vendor-form";
import { QuickOnboardingForm } from "./quick-onboarding-form";
import type { Vendor } from "@/lib/types";

export function ListVendorDialog() {
  const open = useMarketplace((s) => s.listVendorOpen);
  const close = useMarketplace((s) => s.closeListVendor);
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const openVendor = useMarketplace((s) => s.openVendor);
  const editingSlug = useMarketplace((s) => s.editingSlug);

  const router = useRouter();

  // fetch the vendor being edited (only when editingSlug is set)
  const { data: editingVendorData } = useVendor(editingSlug);
  const editingVendor = editingSlug ? editingVendorData ?? null : null;
  const isEditing = !!editingSlug;

  const [created, setCreated] = React.useState<Vendor | null>(null);
  const [updated, setUpdated] = React.useState(false);

  // Reset transient state whenever the dialog closes.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setCreated(null);
        setUpdated(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Hide floating AI widget while the business listing dialog is open ──
  React.useEffect(() => {
    if (open) {
      window.dispatchEvent(new Event("fullscreen-overlay-open"));
    } else {
      window.dispatchEvent(new Event("fullscreen-overlay-close"));
    }
  }, [open]);

  const handleView = () => {
    if (!created) return;
    const slug = created.slug;
    close();
    setTimeout(() => openVendor(slug), 150);
  };

  // One account → one business: after publishing, send the vendor to their
  // dashboard rather than offering to create another business.
  const handleGoToDashboard = () => {
    close();
    setTimeout(() => router.push("/dashboard"), 150);
  };

  const handleUpdated = (v: Vendor) => {
    setUpdated(true);
    // stash the updated vendor so the success screen can show it
    setCreated(v);
  };

  const handleViewUpdated = () => {
    if (!created) return;
    const slug = created.slug;
    close();
    setTimeout(() => openVendor(slug), 150);
  };

  const showSuccess = isEditing ? updated : !!created;
  // For a newly created vendor the header should reflect the actual approval
  // state (Pending Approval / Live) instead of always claiming "You're live!".
  const createdApproved = created?.approved === true;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">
          {isEditing ? "Edit your business" : "List your business"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing
            ? "Update your business listing."
            : "Create a new business listing on the marketplace."}
        </DialogDescription>

        {/* Header band — compact */}
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-brand-soft to-background px-5 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground shadow-sm">
              {isEditing ? <Pencil className="size-4" /> : <Store className="size-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-bold leading-tight">
                {showSuccess
                  ? isEditing
                    ? "Updated!"
                    : createdApproved
                      ? "You're live!"
                      : "Submitted!"
                  : isEditing
                    ? "Edit your business"
                    : "List your business"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {showSuccess
                  ? isEditing
                    ? "Your changes have been saved."
                    : createdApproved
                      ? "Your listing is now visible worldwide."
                      : "Your listing is pending admin approval."
                  : isEditing
                    ? `Update your ${ECOSYSTEM_META[ecosystem].label} listing.`
                    : `Join ${ECOSYSTEM_META[ecosystem].label} — it's free and takes 2 minutes.`}
              </p>
            </div>
            {showSuccess && !isEditing ? (
              <Badge
                className={`ml-auto hidden border-0 sm:inline-flex ${
                  createdApproved
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {createdApproved ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <Clock className="size-3" />
                )}
                {createdApproved ? "Live" : "Pending Approval"}
              </Badge>
            ) : (
              <Badge className="ml-auto hidden border-0 bg-brand-soft text-brand-soft-foreground sm:inline-flex">
                <Sparkles className="size-3" />
                {ECOSYSTEM_META[ecosystem].label}
              </Badge>
            )}
          </div>
        </div>

        {/* Body — QuickOnboardingForm manages its own scroll + sticky footer.
            Other forms (edit, success) use a simple scrollable container. */}
        {!isEditing && !created ? (
          <QuickOnboardingForm
            ecosystem={ecosystem}
            onCreated={(v) => setCreated(v)}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="p-5 sm:p-6">
              {!isEditing && created ? (
                <CreateVendorSuccess
                  vendor={created}
                  onView={handleView}
                  onGoToDashboard={handleGoToDashboard}
                />
              ) : isEditing && updated && created ? (
                <EditSuccess
                  vendor={created}
                  onView={handleViewUpdated}
                  onAgain={() => {
                    setUpdated(false);
                    setCreated(null);
                  }}
                />
              ) : (
                <CreateVendorForm
                  ecosystem={ecosystem}
                  onCreated={(v) => setCreated(v)}
                  editingVendor={editingVendor}
                  onUpdated={handleUpdated}
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditSuccess({
  vendor,
  onView,
  onAgain,
}: {
  vendor: Vendor;
  onView: () => void;
  onAgain: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border bg-brand-soft p-8 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg">
        <Pencil className="size-8" />
      </div>
      <h3 className="mt-4 text-xl font-bold">Changes saved! ✅</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{vendor.name}</span> has
        been updated and is live on the marketplace.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onView}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-transform hover:scale-105"
        >
          View my listing
        </button>
        <button
          onClick={onAgain}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          Keep editing
        </button>
      </div>
    </div>
  );
}
