"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Store, ShieldCheck, ArrowRight } from "lucide-react";

export default function ClaimTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { user, loading: authLoading } = useClaimAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [vendorName, setVendorName] = React.useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = React.useState(false);

  // Check if user is signed in; if not, show sign-in prompt
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNeedsLogin(true);
      // Store the return URL so after sign-in, user comes back here
      try {
        localStorage.setItem("fmb-pmp:auth-intent", `claim-token:${token}`);
      } catch {}
    } else {
      setNeedsLogin(false);
    }
  }, [token, user, authLoading]);

  // Auto-claim when user signs in
  React.useEffect(() => {
    if (user && !submitting && !errorMsg) {
      accept();
    }
  }, [user]);

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

    // Get vendor name for display
    try {
      const { data: vInfo } = await supabaseBrowser
        .from("Vendor")
        .select("name")
        .eq("id", vData)
        .maybeSingle();
      if (vInfo?.name) setVendorName(vInfo.name);
    } catch {}

    // Submit the claim
    const { data: claimId, error: claimErr } = await supabaseBrowser.rpc("submit_claim", {
      p_vendor_id: vData,
      p_method: "invite_token",
      p_phone: null,
      p_token: token,
    });
    if (claimErr) {
      setErrorMsg(claimErr.message);
      setSubmitting(false);
      return;
    }

    // AUTO-APPROVE: Since admin created this business and sent the invite,
    // auto-approve the claim so the vendor can go straight to their dashboard.
    if (claimId) {
      const approveRes = await fetch("/api/claim/auto-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });

      if (approveRes.ok) {
        setSubmitting(false);
        toast.success("Business claimed! Welcome aboard!");
        router.push("/dashboard");
        return;
      }

      // If auto-approve fails, fall back to manual review
      setSubmitting(false);
      toast.success("Claim submitted — awaiting admin review");
      router.push("/claim-status");
      return;
    }

    setSubmitting(false);
    toast.success("Claim submitted — awaiting admin review");
    router.push("/claim-status");
  };

  const handleSignIn = async () => {
    // Store the intent so after Google OAuth redirect, user comes back here
    try {
      localStorage.setItem("fmb-pmp:auth-intent", `claim-token:${token}`);
    } catch {}

    // Directly trigger Google OAuth (not the modal dialog which only exists on homepage)
    setSubmitting(true);
    try {
      await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not signed in — show sign-in prompt
  if (needsLogin) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#C65D47]/10">
            <Store className="size-6 text-[#C65D47]" />
          </div>
          <h1 className="text-2xl font-black">Claim Your Business</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You've been invited to claim your business listing on FindMyBites × PimpMyParty.
            Sign in with Google to get started.
          </p>
          <Button
            onClick={handleSignIn}
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-[#1A1A1A] py-3 text-white hover:bg-black"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                Sign in to Continue
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            After signing in, you'll be redirected back here automatically.
          </p>
        </div>
      </div>
    );
  }

  // Signed in — show claiming progress
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#8B9D83]/10">
          <ShieldCheck className="size-6 text-[#8B9D83]" />
        </div>

        {submitting ? (
          <>
            <h1 className="text-2xl font-black">Claiming your business…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {vendorName ? `Setting up "${vendorName}" for you` : "Please wait..."}
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="size-8 animate-spin text-[#C65D47]" />
            </div>
          </>
        ) : errorMsg ? (
          <>
            <h1 className="text-2xl font-black">Claim Failed</h1>
            <div className="mt-3 rounded-lg border border-[#B04646]/30 bg-[#B04646]/5 p-3 text-sm text-[#B04646]">
              {errorMsg}
            </div>
            <Button
              onClick={() => router.push("/")}
              className="mt-4 w-full rounded-full bg-[#1A1A1A] py-3 text-white hover:bg-black"
            >
              Go to Homepage
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black">Almost done!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting you to your dashboard…
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="size-8 animate-spin text-[#8B9D83]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

