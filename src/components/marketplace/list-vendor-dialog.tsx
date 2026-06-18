"use client";

import * as React from "react";
import { Store, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMarketplace } from "@/lib/store";
import { ECOSYSTEM_META } from "@/lib/constants";
import { CreateVendorForm, CreateVendorSuccess } from "./create-vendor-form";
import type { Vendor } from "@/lib/types";

export function ListVendorDialog() {
  const open = useMarketplace((s) => s.listVendorOpen);
  const close = useMarketplace((s) => s.closeListVendor);
  const ecosystem = useMarketplace((s) => s.ecosystem);
  const openVendor = useMarketplace((s) => s.openVendor);

  const [created, setCreated] = React.useState<Vendor | null>(null);

  // Reset the success state whenever the dialog is closed.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setCreated(null), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleView = () => {
    if (!created) return;
    const slug = created.slug;
    close();
    // open the vendor detail modal for the newly created listing
    setTimeout(() => openVendor(slug), 150);
  };

  const handleAgain = () => setCreated(null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">List your business</DialogTitle>
        <DialogDescription className="sr-only">
          Create a new business listing on the marketplace.
        </DialogDescription>

        {/* Header band */}
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-brand-soft to-background px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
              <Store className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-bold leading-tight">
                {created ? "You're live!" : "List your business"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {created
                  ? "Your listing is now visible worldwide."
                  : `Join ${ECOSYSTEM_META[ecosystem].label} — it's free and takes 2 minutes.`}
              </p>
            </div>
            <Badge className="ml-auto hidden border-0 bg-brand-soft text-brand-soft-foreground sm:inline-flex">
              <Sparkles className="size-3" />
              {ECOSYSTEM_META[ecosystem].label}
            </Badge>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="max-h-[80vh] overflow-y-auto">
          <div className="p-5 sm:p-6">
            {created ? (
              <CreateVendorSuccess
                vendor={created}
                onView={handleView}
                onAgain={handleAgain}
              />
            ) : (
              <CreateVendorForm
                ecosystem={ecosystem}
                onCreated={(v) => setCreated(v)}
              />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
