"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, RefreshCw, Copy, Check, Pencil, X, Save, Wand2,
  Image as ImageIcon, Camera, CheckCircle2, ArrowRight, Target,
  TrendingUp, Star, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  WRITING_STYLES, type WritingStyle, type AiBusinessProfile,
  type AiImageAnalysis, type AiRecommendation,
} from "@/lib/ai/listing-types";
import type { Vendor } from "@/lib/types";

interface SetupAssistantProps {
  vendor: Vendor;
  onSaved?: () => void;
}

const CATEGORIES_FOOD = ["bakers-bakery", "caterers", "chef-staff", "food-trucks", "dessert-makers", "specialty-food"];
const CATEGORIES_PARTY = ["event-planners", "decorators", "djs", "photographers", "venues", "florists", "entertainers"];

export function SetupAssistant({ vendor, onSaved }: SetupAssistantProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [minFields, setMinFields] = React.useState({
    businessName: vendor.name || "",
    marketplace: vendor.ecosystem || "FINDMYBITES",
    category: vendor.category || "",
    subcategory: vendor.subcategory || "",
    country: vendor.country || "",
    state: vendor.state || "",
    city: vendor.city || "",
    whatsapp: vendor.whatsapp || "",
    logoUrl: vendor.avatarImage || "",
  });

  const [style, setStyle] = React.useState<WritingStyle>("professional");
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<AiBusinessProfile | null>(null);
  const [editingField, setEditingField] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [imageAnalysis, setImageAnalysis] = React.useState<AiImageAnalysis | null>(null);
  const [imageLoading, setImageLoading] = React.useState(false);

  const [recs, setRecs] = React.useState<AiRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = React.useState(false);

  const canGenerate = minFields.businessName?.trim() && minFields.category;

  const generate = async (selectedStyle?: WritingStyle) => {
    if (!canGenerate) { toast.error("Please fill in business name and category first"); return; }
    const useStyle = selectedStyle || style;
    setLoading(true); setProfile(null);
    try {
      const res = await fetch("/api/vendor/ai/setup-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_profile", style: useStyle, ...minFields }),
      });
      const data = await res.json();
      if (res.ok && data.description) { setProfile(data); toast.success(`Generated ${WRITING_STYLES.find((s) => s.value === useStyle)?.label} profile`); }
      else { toast.error(data.error || "AI generation failed"); }
    } catch (err: any) { toast.error(err.message || "Failed to generate"); } finally { setLoading(false); }
  };

  const analyzeImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    setImageLoading(true);
    try {
      const res = await fetch("/api/vendor/ai/setup-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze_image", imageUrl }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) { setImageAnalysis(data.analysis); toast.success("Image analyzed"); }
    } catch { toast.error("Image analysis failed"); } finally { setImageLoading(false); }
  };

  const loadRecs = React.useCallback(async () => {
    setRecsLoading(true);
    try {
      const res = await fetch("/api/vendor/ai/setup-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recommendations" }),
      });
      const data = await res.json();
      if (res.ok) setRecs(data.recommendations || []);
    } catch {} finally { setRecsLoading(false); }
  }, []);

  const copyField = async (field: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopiedField(field); toast.success("Copied"); setTimeout(() => setCopiedField(null), 2000); }
    catch { toast.error("Copy failed"); }
  };

  const startEdit = (field: string, value: string) => { setEditingField(field); setEditValue(value); };
  const saveEdit = (field: string) => { if (!profile) return; setProfile({ ...profile, [field]: editValue }); setEditingField(null); toast.success("Updated"); };

  const saveAll = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: minFields.businessName, ecosystem: minFields.marketplace,
          category: minFields.category, subcategory: minFields.subcategory,
          country: minFields.country, state: minFields.state, city: minFields.city,
          whatsapp: minFields.whatsapp, avatarImage: minFields.logoUrl,
          description: profile.description, tagline: profile.tagline,
          metaTitle: profile.seoTitle, metaDescription: profile.metaDescription,
          tags: profile.tags,
        }),
      });
      if (res.ok) { toast.success("Profile saved!"); onSaved?.(); loadRecs(); }
      else { const e = await res.json().catch(() => ({})); toast.error(e.error || "Save failed"); }
    } catch { toast.error("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Wand2 className="h-6 w-6 text-primary" /> AI Business Setup Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Complete your business profile in under 2 minutes with AI assistance.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <h2 className="text-sm font-semibold">Business Information</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Business Name *</Label>
                  <Input value={minFields.businessName} onChange={(e) => setMinFields((f) => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Govada Events & Catering" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Marketplace *</Label>
                  <Select value={minFields.marketplace} onValueChange={(v) => setMinFields((f) => ({ ...f, marketplace: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINDMYBITES">FindMyBites (Food)</SelectItem>
                      <SelectItem value="PIMPMYPARTY">PimpMyParty (Events)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category *</Label>
                  <Select value={minFields.category} onValueChange={(v) => setMinFields((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(minFields.marketplace === "FINDMYBITES" ? CATEGORIES_FOOD : CATEGORIES_PARTY).map((c) => (
                        <SelectItem key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Subcategory</Label>
                  <Input value={minFields.subcategory} onChange={(e) => setMinFields((f) => ({ ...f, subcategory: e.target.value }))} placeholder="e.g. Wedding Planner" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Country</Label>
                  <Input value={minFields.country} onChange={(e) => setMinFields((f) => ({ ...f, country: e.target.value }))} placeholder="e.g. India" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">State</Label>
                  <Input value={minFields.state} onChange={(e) => setMinFields((f) => ({ ...f, state: e.target.value }))} placeholder="e.g. Telangana" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">City</Label>
                  <Input value={minFields.city} onChange={(e) => setMinFields((f) => ({ ...f, city: e.target.value }))} placeholder="e.g. Hyderabad" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">WhatsApp Number</Label>
                  <Input value={minFields.whatsapp} onChange={(e) => setMinFields((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="e.g. +91 9052681374" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Business Logo</Label>
                  <div className="flex items-center gap-2">
                    {minFields.logoUrl ? (
                      <img src={minFields.logoUrl} alt="Logo" className="size-10 rounded-lg object-cover" />
                    ) : (
                      <div className="grid size-10 place-items-center rounded-lg border-2 border-dashed"><ImageIcon className="size-4 text-muted-foreground" /></div>
                    )}
                    <Input value={minFields.logoUrl} onChange={(e) => setMinFields((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="Paste image URL" className="text-xs" />
                    {minFields.logoUrl && (
                      <Button type="button" size="sm" variant="outline" onClick={() => analyzeImage(minFields.logoUrl)} disabled={imageLoading}>
                        {imageLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {imageAnalysis && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-violet-50 dark:bg-violet-950/20 p-4 space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-violet-500" /> AI Image Analysis</h4>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div><span className="text-muted-foreground">Brand theme:</span> <span className="font-medium">{imageAnalysis.brandTheme}</span></div>
                  <div><span className="text-muted-foreground">Personality:</span> <span className="font-medium">{imageAnalysis.brandPersonality.join(", ")}</span></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Colors:</span>
                    {imageAnalysis.primaryColors.map((c, i) => (<span key={i} className="size-4 rounded-full border" style={{ background: c }} title={c} />))}
                  </div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Cover layout:</span> <span className="font-medium">{imageAnalysis.coverLayoutSuggestion}</span></div>
                </div>
              </motion.div>
            )}

            <Button onClick={() => { setStep(2); generate(); }} disabled={!canGenerate || loading} className="w-full" size="lg">
              {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Sparkles className="mr-2 size-5" />} Generate My Business Profile
            </Button>
            {!canGenerate && <p className="text-center text-xs text-muted-foreground">Enter a business name and select a category to continue</p>}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowRight className="size-4 rotate-180" /> Edit basic info
              </button>
              <div className="flex flex-wrap gap-1.5">
                {WRITING_STYLES.map((s) => (
                  <button key={s.value} onClick={() => { setStyle(s.value); if (profile) generate(s.value); }} disabled={loading} title={s.desc}
                    className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
                      style === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && !profile && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-12">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">AI is writing your business profile…</p>
                <p className="text-xs text-muted-foreground">Generating description, SEO, keywords, tags, services, FAQ & more</p>
              </div>
            )}

            {profile && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => generate()} disabled={loading} variant="outline" size="sm">
                    {loading ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />} Regenerate
                  </Button>
                  <Button onClick={saveAll} disabled={saving} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {saving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Save className="mr-1.5 size-3.5" />} Save all to profile
                  </Button>
                </div>

                <div className="space-y-3">
                  <EditableField label="Business Description" field="description" value={profile.description} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={800} multiline />
                  <EditableField label="Short Description" field="shortDescription" value={profile.shortDescription} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={160} multiline />
                  <EditableField label="Tagline" field="tagline" value={profile.tagline} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={60} />
                  <EditableField label="SEO Title" field="seoTitle" value={profile.seoTitle} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={60} />
                  <EditableField label="Meta Description" field="metaDescription" value={profile.metaDescription} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={160} multiline />
                  <ListField label="SEO Keywords" items={profile.keywords} field="keywords" onCopy={copyField} />
                  <ListField label="Suggested Tags" items={profile.tags} field="tags" onCopy={copyField} badgeColor="default" />
                  <ListField label="Services Offered" items={profile.services} field="services" onCopy={copyField} badgeColor="emerald" />
                  <ListField label="Why Choose Us" items={profile.whyChooseUs} field="whyChooseUs" onCopy={copyField} badgeColor="amber" />
                  <ListField label="Business Highlights" items={profile.highlights} field="highlights" onCopy={copyField} badgeColor="violet" />
                  <EditableField label="Customer Promise" field="customerPromise" value={profile.customerPromise} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={300} multiline />
                  <EditableField label="Social Media Bio" field="socialBio" value={profile.socialBio} editing={editingField} editValue={editValue} setEditValue={setEditValue} onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingField(null)} copied={copiedField} onCopy={copyField} maxLength={150} />
                  <div className="rounded-xl border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">FAQ ({profile.faq.length})</span>
                      <button onClick={() => copyField("faq", profile.faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n"))} className="grid size-7 place-items-center rounded-md hover:bg-accent">
                        {copiedField === "faq" ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {profile.faq.map((f, i) => (
                        <div key={i} className="rounded-lg bg-muted/30 p-3">
                          <p className="text-sm font-medium">{f.question}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{f.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={saveAll} disabled={saving} className="w-full" size="lg">
                  {saving ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Save className="mr-2 size-5" />} Save all to my profile
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {step === 2 && profile && (
        <RecommendationsPanel recs={recs} recsLoading={recsLoading} onLoadRecs={loadRecs} />
      )}
    </div>
  );
}

function EditableField({
  label, field, value, editing, editValue, setEditValue, onStartEdit, onSaveEdit, onCancelEdit, copied, onCopy, maxLength, multiline,
}: {
  label: string; field: string; value: string;
  editing: string | null; editValue: string; setEditValue: (v: string) => void;
  onStartEdit: (field: string, value: string) => void; onSaveEdit: (field: string) => void; onCancelEdit: () => void;
  copied: string | null; onCopy: (field: string, value: string) => void; maxLength?: number; multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
        <div className="flex gap-1">
          <button onClick={() => onCopy(field, value)} title="Copy" className="grid size-7 place-items-center rounded-md hover:bg-accent">
            {copied === field ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </button>
          {editing === field ? (
            <>
              <button onClick={() => onSaveEdit(field)} title="Save" className="grid size-7 place-items-center rounded-md hover:bg-accent"><Check className="size-3.5 text-emerald-500" /></button>
              <button onClick={onCancelEdit} title="Cancel" className="grid size-7 place-items-center rounded-md hover:bg-accent"><X className="size-3.5" /></button>
            </>
          ) : (
            <button onClick={() => onStartEdit(field, value)} title="Edit" className="grid size-7 place-items-center rounded-md hover:bg-accent"><Pencil className="size-3.5" /></button>
          )}
        </div>
      </div>
      {editing === field ? (
        multiline ? <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={3} maxLength={maxLength} className="text-sm" /> : <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} maxLength={maxLength} className="text-sm" />
      ) : (
        <p className="text-sm">{value}</p>
      )}
      {maxLength && <p className="mt-1 text-right text-[10px] text-muted-foreground">{value.length}/{maxLength}</p>}
    </div>
  );
}

function ListField({ label, items, field, onCopy, badgeColor = "secondary" }: {
  label: string; items: string[]; field: string; onCopy: (f: string, v: string) => void;
  badgeColor?: "secondary" | "emerald" | "amber" | "violet" | "default";
}) {
  const colors: Record<string, string> = {
    secondary: "bg-muted text-foreground",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    default: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  };
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">{label} ({items.length})</span>
        <button onClick={() => onCopy(field, items.join(", "))} title="Copy" className="grid size-7 place-items-center rounded-md hover:bg-accent"><Copy className="size-3.5" /></button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (<Badge key={i} variant="secondary" className={cn("text-[11px]", colors[badgeColor])}>{item}</Badge>))}
      </div>
    </div>
  );
}

function RecommendationsPanel({ recs, recsLoading, onLoadRecs }: {
  recs: AiRecommendation[]; recsLoading: boolean; onLoadRecs: () => void;
}) {
  React.useEffect(() => { onLoadRecs(); }, [onLoadRecs]);
  const priorityIcon = { high: Star, medium: TrendingUp, low: Crown };
  const priorityColor = { high: "text-red-500", medium: "text-amber-500", low: "text-violet-500" };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-primary" /> AI Recommendations</h3>
        <Button variant="ghost" size="sm" onClick={onLoadRecs} disabled={recsLoading}>
          {recsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        </Button>
      </div>
      {recs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recommendations right now — your profile looks great!</p>
      ) : (
        <div className="space-y-2">
          {recs.map((r) => {
            const Icon = r.done ? CheckCircle2 : priorityIcon[r.priority];
            return (
              <div key={r.id} className={cn("flex items-start gap-2 rounded-lg border p-3", r.done && "opacity-50")}>
                <Icon className={cn("mt-0.5 size-4 shrink-0", r.done ? "text-emerald-500" : priorityColor[r.priority])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                  {!r.done && <p className="mt-0.5 text-[11px] font-medium text-primary">{r.action}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
