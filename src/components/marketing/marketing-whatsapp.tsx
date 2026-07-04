"use client";

import * as React from "react";
import { MessageCircle, Sparkles, Loader2, Copy, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { copyToClipboard } from "./marketing-helpers";

const TYPES = [
  { value: "promo", label: "Promotional Message" },
  { value: "festival", label: "Festival Greetings" },
  { value: "new_product", label: "New Product Announcement" },
  { value: "booking_reminder", label: "Booking Reminder" },
  { value: "payment_reminder", label: "Payment Reminder" },
];

export function WhatsAppMarketing() {
  const [type, setType] = React.useState("promo");
  const [productName, setProductName] = React.useState("");
  const [offer, setOffer] = React.useState("");
  const [festival, setFestival] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const generate = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/vendor/marketing/ai/whatsapp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, productName, offer, festival, customerName }),
      });
      const json = await res.json();
      if (json.message) { setResult(json.message); toast.success("Message generated"); }
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  const copy = async () => {
    if (!result) return;
    if (await copyToClipboard(result)) { setCopied(true); toast.success("Copied to clipboard"); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp Marketing</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">AI-generated promotional messages with one-tap copy.</p>

        <div className="mt-3 space-y-1.5">
          <Label className="text-xs">Message type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Customer name (optional)</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Priya" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Product / Offer / Festival</Label>
            <Input value={productName || offer || festival} onChange={(e) => { setProductName(e.target.value); setOffer(e.target.value); setFestival(e.target.value); }} placeholder="e.g. Chocolate Cake, 20% off" />
          </div>
        </div>

        <Button className="mt-3 w-full" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Generate WhatsApp Message
        </Button>
      </div>

      {result && (
        <div className="rounded-xl border bg-emerald-50 p-4 dark:bg-emerald-950/20">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Generated Message</h4>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm dark:bg-background">{result}</div>
          <a href={`https://wa.me/?text=${encodeURIComponent(result)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex">
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Open in WhatsApp
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
