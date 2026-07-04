"use client";

import * as React from "react";
import { Mail, Sparkles, Loader2, Copy, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { copyToClipboard } from "./marketing-helpers";

const TEMPLATES = [
  { value: "new_product", label: "New Product" },
  { value: "festival", label: "Festival Greetings" },
  { value: "special_offer", label: "Special Offer" },
  { value: "thank_you", label: "Customer Thank You" },
  { value: "booking_reminder", label: "Booking Reminder" },
  { value: "re_engagement", label: "Re-engagement" },
];

interface EmailCampaign { id: string; template: string; subject: string; preheader: string | null; body: string; status: string; sentAt: string | null; openedCount: number; clickedCount: number; }

export function EmailCampaignManager() {
  const [template, setTemplate] = React.useState("new_product");
  const [productName, setProductName] = React.useState("");
  const [festival, setFestival] = React.useState("");
  const [offer, setOffer] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ subject: string; preheader: string; body: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [history, setHistory] = React.useState<EmailCampaign[]>([]);

  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/marketing/campaigns");
      // We don't have a separate email list endpoint; reuse the analytics data.
      // For now show empty until an email endpoint exists.
    } catch {}
  }, []);

  const generate = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/vendor/marketing/ai/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, productName, festival, offer, save: true }),
      });
      const json = await res.json();
      if (json.email) { setResult(json.email); toast.success("Email generated & saved as draft"); }
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  const copy = async () => {
    if (!result) return;
    if (await copyToClipboard(`Subject: ${result.subject}\n\n${result.body}`)) { setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4" /> Email Campaigns</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">AI-generated newsletters for every occasion.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Product / Festival / Offer (optional)</Label>
            <Input value={productName || festival || offer} onChange={(e) => { setProductName(e.target.value); setFestival(e.target.value); setOffer(e.target.value); }} placeholder="e.g. Diwali, Chocolate Cake, 20% off" />
          </div>
        </div>

        <Button className="mt-3 w-full" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Generate Email
        </Button>
      </div>

      {result && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Generated Email</h4>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">Subject</Label>
              <div className="text-sm font-medium">{result.subject}</div>
            </div>
            {result.preheader && (
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Preheader</Label>
                <div className="text-xs text-muted-foreground">{result.preheader}</div>
              </div>
            )}
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">Body</Label>
              <Textarea readOnly rows={10} value={result.body} className="resize-none text-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
