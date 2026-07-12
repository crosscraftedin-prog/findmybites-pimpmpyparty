"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Store, CheckCircle2, Clock, XCircle, Loader2, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

/**
 * /claim/[token] — public claim page.
 *
 * Shows the business name and whether the claim link is valid.
 * If the user is logged in, they can click "Claim this business".
 * If not logged in, they're prompted to sign in first.
 *
 * After claiming, shows "pending admin approval" message.
 */
export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, loading: sessionLoading } = useSupabaseSession();

  const [loading, setLoading] = React.useState(true);
  const [valid, setValid] = React.useState(false);
  const [vendorName, setVendorName] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [claiming, setClaiming] = React.useState(false);
  const [claimed, setClaimed] = React.useState(false);
  const [error, setError] = React.useState("");

  // Validate the claim token on mount
  React.useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/claim/${token}`);
        const data = await res.json();
        if (data.valid) {
          setValid(true);
          setVendorName(data.vendorName || "this business");
        } else {
          setValid(false);
          setReason(data.reason || "Invalid claim link");
        }
      } catch {
        setValid(false);
        setReason("Failed to validate claim link");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleClaim = async () => {
    if (!user) return;
    setClaiming(true);
    setError("");
    try {
      const res = await fetch(`/api/claim/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorName: user.user_metadata?.full_name || user.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaimed(true);
      } else {
        setError(data.error || "Failed to submit claim");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-brand/10">
            <Store className="size-7 text-brand" />
          </div>
          <h1 className="text-xl font-bold">Claim Your Business</h1>
        </div>

        {/* Invalid / expired */}
        {!valid && !claimed && (
          <div className="text-center">
            <XCircle className="mx-auto mb-3 size-12 text-red-500" />
            <h2 className="text-lg font-semibold">Link Invalid</h2>
            <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
            <Button className="mt-4 w-full" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          </div>
        )}

        {/* Valid — show business info + claim button */}
        {valid && !claimed && (
          <div>
            <div className="mb-4 rounded-lg border border-brand-border bg-brand-soft/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">You're claiming</p>
              <p className="mt-1 text-lg font-bold text-foreground">{vendorName}</p>
            </div>

            {user ? (
              <>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  You're signed in as <span className="font-medium text-foreground">{user.email}</span>.
                  Click below to submit your claim. An admin will review and approve it.
                </p>
                <Button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {claiming ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Claim This Business
                </Button>
                {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
              </>
            ) : (
              <>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Sign in to verify your identity and claim this business.
                </p>
                <Button
                  onClick={() => router.push(`/?claim-token=${token}`)}
                  className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  <LogIn className="size-4" />
                  Sign In to Claim
                </Button>
              </>
            )}
          </div>
        )}

        {/* Claimed — pending approval */}
        {claimed && (
          <div className="text-center">
            <Clock className="mx-auto mb-3 size-12 text-amber-500" />
            <h2 className="text-lg font-semibold">Claim Submitted!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your claim for <span className="font-medium">{vendorName}</span> has been submitted.
              Our team will review and approve it shortly. You'll receive an email once approved.
            </p>
            <Button className="mt-4 w-full gap-2" onClick={() => router.push("/")}>
              Go to Homepage
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
