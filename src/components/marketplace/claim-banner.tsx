"use client";

import * as React from "react";
import { Store, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * ClaimBanner — shows "Own this business? Claim this listing" on
 * admin-created, unclaimed business pages.
 *
 * The public should NEVER know whether a listing was admin-created.
 * This banner only appears when the listing is unclaimed AND has a valid
 * claim token. It links to /claim/[token] where the owner can verify
 * and claim the business.
 */
export function ClaimBanner({ claimToken }: { claimToken: string | null | undefined }) {
  const router = useRouter();

  if (!claimToken) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Store className="size-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Own this business? Claim this listing to manage your profile, products, and enquiries.
          </p>
        </div>
        <button
          onClick={() => router.push(`/claim/${claimToken}`)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          Claim this listing
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
