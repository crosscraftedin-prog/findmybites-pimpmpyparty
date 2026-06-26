"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useClaimAuth } from "@/hooks/use-claim-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Phone, KeyRound, Loader2 } from "lucide-react";

export default function ClaimPage() {
  const params = useParams<{ vendorId: string }>();
  const router = useRouter();
  const vendorId = params.vendorId;
  const { user, profile, refreshProfile, loading: authLoading } = useClaimAuth();

  const [vendor, setVendor] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [phone, setPhone] = React.useState("");
  const [token, setToken] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpStage, setOtpStage] = React.useState<"idle" | "sent" | "verified">("idle");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?returnTo=/claim/${vendorId}`);
      return;
    }
    async function load() {
      const { data } = await supabaseBrowser
        .from("vendor_listings")
        .select("*")
        .eq("id", vendorId)
        .maybeSingle();
      setVendor(data);
      setLoading(false);
      if (data?.whatsapp) setPhone("+" + data.whatsapp.replace(/^\+/, ""));
    }
    load();
  }, [vendorId, user, authLoading, router]);

  const sendOtp = async () => {
    if (!phone) return toast.error("Enter a phone number");
    setSubmitting(true);
    const { error } = await supabaseBrowser.auth.signInWithOtp({ phone });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      setOtpStage("sent");
      toast.success("Verification code sent");
    }
  };

  const verifyOtp = async () => {
    setSubmitting(true);
    const { error } = await supabaseBrowser.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setOtpStage("verified");
    await refreshProfile();
    toast.success("Phone verified");
  };

  const submitOtpClaim = async () => {
    setSubmitting(true);
    const { error } = await supabaseBrowser.rpc("submit_claim", {
      p_vendor_id: vendorId,
      p_method: "otp",
      p_phone: phone,
      p_token: null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Claim submitted — awaiting admin review");
    router.push("/claim-status");
  };

  const submitTokenClaim = async () => {
    if (!token.trim()) return toast.error("Paste the invite token");
    setSubmitting(true);
    const { error } = await supabaseBrowser.rpc("submit_claim", {
      p_vendor_id: vendorId,
      p_method: "invite_token",
      p_phone: null,
      p_token: token.trim(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Claim submitted — awaiting admin review");
    router.push("/claim-status");
  };

  if (authLoading || loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" /> Loading…
      </div>
    );

  if (!vendor)
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-black">Vendor not found</h1>
      </div>
    );

  if (vendor.ownership_status === "claimed")
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-black">This business is already verified</h1>
        <p className="mt-2 text-muted-foreground">
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F9F8F6] py-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Step 1 of 1 · Verification
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">
          Claim <span className="text-[#C65D47]">{vendor.name}</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {profile?.full_name || user?.email}
          </span>
          . Choose how you'd like to verify ownership.
        </p>

        <div className="mt-10 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <Tabs defaultValue="otp" className="w-full">
            <TabsList className="mb-6 grid grid-cols-2">
              <TabsTrigger value="otp">
                <Phone size={14} strokeWidth={1.75} className="mr-1.5" /> Phone OTP
              </TabsTrigger>
              <TabsTrigger value="token">
                <KeyRound size={14} strokeWidth={1.75} className="mr-1.5" /> Invite token
              </TabsTrigger>
            </TabsList>

            <TabsContent value="otp" className="space-y-4">
              <div>
                <Label htmlFor="claim-phone">Business phone (with country code)</Label>
                <Input
                  id="claim-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919999999999"
                  disabled={otpStage !== "idle"}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Must match the WhatsApp number we have on file for this listing.
                </p>
              </div>

              {otpStage === "idle" && (
                <Button
                  onClick={sendOtp}
                  disabled={submitting}
                  className="rounded-full bg-[#1A1A1A] px-6 hover:bg-black"
                >
                  Send verification code
                </Button>
              )}

              {otpStage === "sent" && (
                <div className="space-y-3">
                  <Label htmlFor="claim-otp">Enter the 6-digit code</Label>
                  <Input
                    id="claim-otp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={verifyOtp}
                      disabled={submitting}
                      className="rounded-full bg-[#C65D47] px-6 hover:bg-[#A94F3C]"
                    >
                      Verify code
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setOtpStage("idle")}
                      className="rounded-full"
                    >
                      Use different number
                    </Button>
                  </div>
                </div>
              )}

              {otpStage === "verified" && (
                <div className="rounded-xl border border-[#8B9D83]/30 bg-[#8B9D83]/10 p-4">
                  <p className="inline-flex items-center gap-2 font-medium text-[#5d6e57]">
                    <ShieldCheck size={16} /> Phone verified. Submit your claim for
                    admin review.
                  </p>
                  <Button
                    onClick={submitOtpClaim}
                    disabled={submitting}
                    className="mt-3 rounded-full bg-[#C65D47] px-6 hover:bg-[#A94F3C]"
                  >
                    Submit claim
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="token" className="space-y-4">
              <div>
                <Label htmlFor="claim-token">Admin invite token</Label>
                <Input
                  id="claim-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the token from your invite link"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Tokens are single-use and time-limited.
                </p>
              </div>
              <Button
                onClick={submitTokenClaim}
                disabled={submitting}
                className="rounded-full bg-[#C65D47] px-6 hover:bg-[#A94F3C]"
              >
                Submit claim
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
