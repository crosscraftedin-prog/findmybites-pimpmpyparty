"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Mail, Store, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketplace } from "@/lib/store";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { supabaseBrowser } from "@/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function SignInDialog() {
  const open = useMarketplace((s) => s.authDialogOpen);
  const close = useMarketplace((s) => s.closeAuthDialog);
  const intent = useMarketplace((s) => s.authIntent);
  const setIntent = useMarketplace((s) => s.setAuthIntent);
  const { session } = useSupabaseSession();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState<"google" | "email" | null>(null);

  // Execute a pending auth intent. Called either:
  //  - from the sign-in dialog (email sign-in, no page reload)
  //  - on page load after Google OAuth redirect (intent was persisted to localStorage)
  const executeIntent = React.useCallback(
    (intentStr: string) => {
      if (intentStr === "list-vendor") {
        useMarketplace.getState().openListVendor();
      } else if (intentStr === "admin") {
        useMarketplace.getState().openAdmin();
      } else if (intentStr === "vendor-dashboard" || intentStr === "vendor-login") {
        useMarketplace.getState().openVendorDashboard();
      } else if (intentStr.startsWith("edit-vendor:")) {
        const slug = intentStr.replace("edit-vendor:", "");
        useMarketplace.getState().openEditVendor(slug);
      }
    },
    []
  );

  // When the session becomes authenticated, run the pending intent.
  // This handles BOTH cases:
  //  1. Email sign-in (dialog is open, intent is in the store)
  //  2. Google OAuth redirect (page reloaded, intent is in localStorage only)
  React.useEffect(() => {
    if (!session?.user) return;

    // check the store first (email sign-in path)
    if (intent) {
      close();
      setIntent(null);
      setTimeout(() => executeIntent(intent), 200);
      return;
    }

    // check localStorage (Google OAuth redirect path — store was lost on reload)
    try {
      const stored = localStorage.getItem("fmb-pmp:auth-intent");
      if (stored) {
        localStorage.removeItem("fmb-pmp:auth-intent");
        close();
        setTimeout(() => executeIntent(stored), 300);
      }
    } catch {
      // ignore
    }
  }, [session, intent, close, setIntent, executeIntent]);

  const onGoogle = async () => {
    setLoading("google");
    try {
      await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      // the browser redirects to Google — we don't reach here
    } catch {
      toast.error("Google sign-in failed.");
      setLoading(null);
    }
  };

  const onEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Please enter a valid email.");
      return;
    }
    setLoading("email");
    try {
      // try sign-in first; if the user doesn't exist, sign them up
      const { error: signInError } =
        await supabaseBrowser.auth.signInWithPassword({
          email: email.trim(),
          password: password || "demo-password-12345",
        });

      if (signInError) {
        // user doesn't exist yet → sign up
        const { error: signUpError } =
          await supabaseBrowser.auth.signUp({
            email: email.trim(),
            password: password || "demo-password-12345",
          });
        if (signUpError) throw signUpError;
        toast.success("Account created! Check your email to confirm.", {
          description: "Or sign in again if email confirmation is disabled.",
        });
      } else {
        toast.success("Signed in!");
      }
      // the auth state change listener will close the dialog + run intent
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Sign-in failed."
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogTitle className="sr-only">Vendor sign-in</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in to list or manage your business.
        </DialogDescription>

        {/* Header */}
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-brand-soft to-background px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">
                Vendor / Admin sign-in
              </h2>
              <p className="text-xs text-muted-foreground">
                For listing your business or managing the marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {/* Google button */}
          <Button
            onClick={onGoogle}
            disabled={loading !== null}
            variant="outline"
            className="h-12 w-full justify-center gap-3 rounded-xl border-border bg-white text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            {loading === "google" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={onEmailSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Password{" "}
                <span className="font-normal text-muted-foreground">
                  (optional for demo)
                </span>
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for demo sign-in"
                className="h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={loading !== null}
              className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {loading === "email" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  Sign in / Sign up
                </>
              )}
            </Button>
          </form>

          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
            <span>
              We only use your email to link your business listings. No spam,
              ever. You can sign out anytime from the header.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
