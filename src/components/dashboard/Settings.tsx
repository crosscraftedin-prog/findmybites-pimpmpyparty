"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types";

interface SettingsProps {
  vendor: Vendor;
  userEmail: string;
}

export function Settings({ vendor, userEmail }: SettingsProps) {
  const router = useRouter();
  const { user, signOut } = useClaimAuth();
  const [displayName, setDisplayName] = React.useState(vendor.name);
  const [saving, setSaving] = React.useState(false);
  const [listingVisible, setListingVisible] = React.useState(true);
  const [showWhatsapp, setShowWhatsapp] = React.useState(true);
  const [emailEnquiry, setEmailEnquiry] = React.useState(true);
  const [emailWeekly, setEmailWeekly] = React.useState(true);
  const [emailUpdates, setEmailUpdates] = React.useState(false);
  const [whatsappNotif, setWhatsappNotif] = React.useState(true);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${vendor.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete listing");
      toast.success("Listing deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete listing");
    }
    setSaving(false);
  };

  const handleCloseAccount = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Account Settings</h1>

      {/* A) Profile */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold">Profile</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Display name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Email (read-only)</Label>
            <Input
              value={userEmail}
              disabled
              className="h-10 bg-muted text-muted-foreground"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Email is managed by your Google account and cannot be changed here.
            </p>
          </div>
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      {/* B) Notifications */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold">Notifications</h2>
        <div className="space-y-3">
          <ToggleRow
            label="Email me when I get an enquiry"
            checked={emailEnquiry}
            onChange={setEmailEnquiry}
          />
          <ToggleRow
            label="Email me weekly performance summary"
            checked={emailWeekly}
            onChange={setEmailWeekly}
          />
          <ToggleRow
            label="Email me platform updates"
            checked={emailUpdates}
            onChange={setEmailUpdates}
          />
          <ToggleRow
            label="WhatsApp notifications for new enquiries"
            checked={whatsappNotif}
            onChange={setWhatsappNotif}
          />
        </div>
      </div>

      {/* C) Privacy */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-bold">Privacy</h2>
        <div className="space-y-3">
          <ToggleRow
            label="Make listing visible"
            description="Turn off to pause your listing without deleting it"
            checked={listingVisible}
            onChange={setListingVisible}
          />
          <ToggleRow
            label="Show WhatsApp number publicly"
            checked={showWhatsapp}
            onChange={setShowWhatsapp}
          />
        </div>
      </div>

      {/* D) Danger zone */}
      <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          <h2 className="text-base font-bold text-destructive">Danger Zone</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="text-sm font-semibold">Delete my listing</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your vendor listing and all associated data.
              </p>
            </div>
            {confirmDelete ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteListing}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Confirm Delete"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="text-sm font-semibold">Close my account</p>
              <p className="text-xs text-muted-foreground">
                Sign out and close your FindMyBites account.
              </p>
            </div>
            {confirmClose ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCloseAccount}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmClose(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmClose(true)}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <Label className="text-xs font-semibold">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
