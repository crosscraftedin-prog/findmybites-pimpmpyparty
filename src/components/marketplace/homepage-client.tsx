"use client";

import * as React from "react";
import { CompareBar } from "@/components/marketplace/recently-viewed-compare";
import { VendorComparison } from "@/components/marketplace/vendor-comparison";

/**
 * Client-side wrapper for CompareBar + VendorComparison.
 * These need client state (compareIds) but are the ONLY client logic on the page.
 */
export function HomepageClient({ compareIds: initial }: { compareIds: string[] | null }) {
  const [compareIds, setCompareIds] = React.useState<string[] | null>(initial);
  return (
    <>
      <CompareBar onCompare={(ids) => setCompareIds(ids)} />
      {compareIds && (
        <VendorComparison vendorIds={compareIds} onClose={() => setCompareIds(null)} />
      )}
    </>
  );
}
