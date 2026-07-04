"use client";

import * as React from "react";
import {
  Share2, Sparkles, Loader2, Copy, Check, Instagram, Facebook, MessageCircle,
  Twitter, Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { copyToClipboard } from "./marketing-helpers";
import type { Vendor } from "@/lib/types";

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
  { value: "threads", label: "Threads", icon: Share2, color: "text-black dark:text-white" },
  { value: "twitter", label: "X (Twitter)", icon: Twitter, color: "text-black dark:text-white" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  { value: "pinterest", label: "Pinterest", icon: Share2, color: "text-red-600" },
];

const TOPIC_PRESETS = [
  "Festival Promotion", "Product Launch", "Special Offer", "Behind the Scenes",
  "Customer Testimonial", "New Arrival", "Weekend Special", "Wedding Season",
];

export function SocialMediaGenerator({ vendor }: { vendor: Vendor }) {
  const [platform, setPlatform] = React.useState("instagram");
  const [topic, setTopic] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [offer, setOffer] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ caption: string; hashtags: string[] } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const generate = async () => {
    if (!topic.trim()) { toast.error("Enter a topic or pick a preset"); return; }
    setLoading(true); setResult(null); setCopied(false);
    try {
      const res = await fetch("/api/vendor/marketing/ai/social", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, topic, productName, offer }),
      });
      const json = await res.json();
      if (json.caption) { setResult(json); toast.success("Post generated"); }
      else toast.error("Generation failed");
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  const copyAll = async () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    if (await copyToClipboard(text)) { setCopied(true); toast.success("Copied to clipboard"); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Share2 className="h-4 w-4" /> Social Media Generator</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">AI-generated captions + hashtags for every platform.</p>

        {/* Platform selector */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] font-medium transition",
                  platform === p.value ? "border-primary ring-1 ring-primary" : "border-border hover:bg-accent"
                )}
              >
                <Icon className={cn("h-4 w-4", p.color)} />
                {p.label.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {/* Topic presets */}
        <div className="mt-3">
          <Label className="text-xs">Quick topics</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {TOPIC_PRESETS.map((t) => (
              <button key={t} onClick={() => setTopic(t)} className="rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-accent">{t}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Topic / Theme</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Diwali Special Sweets" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Product name (optional)</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Kaju Katli" />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs">Offer (optional)</Label>
          <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="e.g. 20% off this week" />
        </div>

        <Button className="mt-3 w-full" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          Generate Post
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold capitalize">{platform} Post</h4>
            <Button variant="outline" size="sm" onClick={copyAll}>
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <Textarea readOnly rows={6} value={result.caption} className="resize-none text-sm" />
          {result.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.hashtags.map((h) => (
                <Badge key={h} variant="secondary" className="text-[11px] text-blue-600 dark:text-blue-400">{h}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
