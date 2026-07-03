"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Store, ShieldCheck, ArrowRight, PartyPopper } from "lucide-react";

/**
 * /activate/[token]
 *
 * Vendor activation page. Works identically for:
 *   - Admin-invited vendors (invite_type='admin')
 *   - Organic signups approved by admin (invite_type='organic')
 *
 * Flow:
 *   1. If not signed in → show Google sign-in prompt
 *   2. After Google OAuth → validate token via resolve_invite_token RPC
 *   3. Submit claim via submit_claim RPC (creates vendor_claim record)
 *   4. Auto-approve via /api/claim/auto-approve (links owner_user_id, sets verified+approved)
 *   5. Redirect to /dashboard
 *
 * The vendor never sees the word "claim" — this is a clean activation flow.
 */
export default function ActivatePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { user, loading: authLoading } = useClaimAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [vendorName, setVendorName] = React.useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = React.useState(false);

  // Check if user is signed in
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNeedsLogin(true);
      try {
        localStorage.setItem("fmb-pmp:auth-intent", `activate:${token}`);
      } catch {}
    } else {
      setNeedsLogin(false);
    }
  }, [token, user, authLoading]);

  const activate = React.useCallback(async () => {
    if (!user) return;
    setSubmitting(true);
    setErrorMsg(null);

    // Resolve the token to get vendor_id
    const { data: vData, error: vErr } = await supabaseBrowser.rpc(
      "resolve_invite_token",
      { p_token: token }
    );
    if (vErr || !vData) {
      setErrorMsg(vErr?.message || "This activation link is invalid, expired, or has already been used.");
      setSubmitting(false);
      return;
    }

    // Get vendor name for display
    try {
      const { data: vInfo } = await supabaseBrowser
        .from("vendor_listings")
        .select("name")
        .eq("id", vData)
        .maybeSingle();
      if (vInfo?.name) setVendorName(vInfo.name);
    } catch {}

    // Submit the claim (links the vendor to this user)
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

    // Auto-approve: link owner_user_id, set verified+approved, redirect to dashboard
    if (claimId) {
      const approveRes = await fetch("/api/claim/auto-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });

      if (approveRes.ok) {
        setSubmitting(false);
        toast.success("Account activated! Welcome aboard!");
        router.push("/dashboard");
        return;
      }

      // If auto-approve fails, fall back to manual review
      setSubmitting(false);
      toast.success("Activation submitted — we'll have you in your dashboard shortly.");
      router.push("/dashboard");
      return;
    }

    setSubmitting(false);
    toast.success("Activation submitted — we'll have you in your dashboard shortly.");
    router.push("/dashboard");
  }, [user, token, router]);

  // Auto-activate when user signs in
  React.useEffect(() => {
    if (user && !submitting && !errorMsg) {
      activate();
    }
  }, [user, activate, submitting, errorMsg]);

  const handleSignIn = async () => {
    try {
      localStorage.setItem("fmb-pmp:auth-intent", `activate:${token}`);
    } catch {}

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
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#FF6B35]/10">
            <PartyPopper className="size-6 text-[#FF6B35]" />
          </div>
          <h1 className="text-2xl font-black">Activate Your Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You've been invited to join FindMyBites × PimpMyParty.
            Sign in with Google to activate your account and access your dashboard.
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

  // Signed in — show activation progress
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#8B9D83]/10">
          <ShieldCheck className="size-6 text-[#8B9D83]" />
        </div>

        {submitting ? (
          <>
            <h1 className="text-2xl font-black">Activating your account…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {vendorName ? `Setting up "${vendorName}" for you` : "Please wait..."}
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="size-8 animate-spin text-[#FF6B35]" />
            </div>
          </>
        ) : errorMsg ? (
          <>
            <h1 className="text-2xl font-black">Activation Failed</h1>
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
