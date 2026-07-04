"use client";

import * as React from "react";
import { QrCode, Download, Loader2, Store, Package, MessageCircle, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";

const QR_TYPES = [
  { value: "vendor", label: "Vendor Profile", icon: Store },
  { value: "product", label: "Product", icon: Package },
  { value: "whatsapp", label: "WhatsApp Chat", icon: MessageCircle },
  { value: "booking", label: "Booking Page", icon: Calendar },
  { value: "review", label: "Google Review", icon: Star },
];

export function QrCodeGenerator({ vendor }: { vendor: Vendor }) {
  const [type, setType] = React.useState("vendor");
  const [format, setFormat] = React.useState<"png" | "svg">("png");
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const generate = async () => {
    setLoading(true); setDataUrl(null);
    try {
      const res = await fetch(`/api/vendor/marketing/qr?type=${type}&format=${format}`);
      if (format === "svg") {
        const svg = await res.text();
        setDataUrl(`data:image/svg+xml;base64,${btoa(svg)}`);
      } else {
        const json = await res.json();
        setDataUrl(json.dataUrl);
      }
    } catch { toast.error("Failed to generate QR"); } finally { setLoading(false); }
  };

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${type}-${vendor.slug}.${format}`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><QrCode className="h-4 w-4" /> QR Code Generator</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Generate QR codes for your profile, products, WhatsApp, and reviews.</p>

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {QR_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[10px] font-medium transition ${type === t.value ? "border-primary ring-1 ring-primary" : "border-border hover:bg-accent"}`}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <QrCode className="mr-1.5 h-4 w-4" />}
            Generate QR
          </Button>
          <div className="flex gap-1 rounded-lg border p-1">
            {(["png", "svg"] as const).map((f) => (
              <button key={f} onClick={() => setFormat(f)} className={`rounded-md px-3 py-1 text-xs font-medium uppercase ${format === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {dataUrl && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6">
          <img src={dataUrl} alt="Generated QR code" className="h-56 w-56" />
          <Button onClick={download} variant="outline">
            <Download className="mr-1.5 h-4 w-4" /> Download {format.toUpperCase()}
          </Button>
        </div>
      )}
    </div>
  );
}
