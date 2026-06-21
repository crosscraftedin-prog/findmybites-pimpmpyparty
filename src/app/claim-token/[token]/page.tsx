"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ClaimTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { user, loading: authLoading } = useClaimAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?returnTo=/claim-token/${token}`);
    }
  }, [token, user, authLoading, router]);

  const accept = async () => {
    if (!user) return;
    setSubmitting(true);
    setErrorMsg(null);

    // Resolve the token to get vendor_id
    const { data: vData, error: vErr } = await supabaseBrowser.rpc(
      "resolve_invite_token",
      { p_token: token }
    );
    if (vErr || !vData) {
      setErrorMsg(vErr?.message || "Token is invalid, expired, or already used.");
      setSubmitting(false);
      return;
    }

    // Submit the claim
    const { error } = await supabaseBrowser.rpc("submit_claim", {
      p_vendor_id: vData,
      p_method: "invite_token",
      p_phone: null,
      p_token: token,
    });
    setSubmitting(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    toast.success("Claim submitted — awaiting admin review");
    router.push("/claim-status");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Resolving…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F9F8F6] py-16">
      <div className="mx-auto max-w-xl px-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Invite token
          </p>
          <h1 className="mt-2 text-3xl font-black">One-click claim</h1>
          <p className="mt-2 text-muted-foreground">
            You're about to use an admin-issued invite token to claim ownership of
            a business.
          </p>
          <code className="mt-4 block break-all rounded-md bg-stone-100 p-2 text-xs">
            {token}
          </code>

          {errorMsg && (
            <div className="mt-4 text-sm text-[#B04646]">{errorMsg}</div>
          )}

          <Button
            onClick={accept}
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-[#C65D47] py-3 hover:bg-[#A94F3C]"
          >
            {submitting ? "Submitting…" : "Accept & submit claim"}
          </Button>
        </div>
      </div>
    </div>
  );
}
