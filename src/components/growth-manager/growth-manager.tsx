"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Send, Copy, Check,
  Search, Package, Star, Megaphone, Mail, MessageCircle, DollarSign,
  Calendar, Users, BookOpen, Bot, AlertTriangle, CheckCircle2, ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";

type Tab = "daily" | "actions" | "coach" | "seo" | "products" | "reviews" | "price" | "social" | "email" | "whatsapp" | "demand" | "competitors" | "library";

const TABS: { id: Tab; label: string; icon: React.ElementType; group: string }[] = [
  { id: "daily", label: "Daily Report", icon: Sparkles, group: "Overview" },
  { id: "actions", label: "Growth Actions", icon: Zap, group: "Overview" },
  { id: "coach", label: "AI Coach", icon: Bot, group: "Overview" },
  { id: "seo", label: "SEO Manager", icon: Search, group: "Optimize" },
  { id: "products", label: "Product Optimizer", icon: Package, group: "Optimize" },
  { id: "reviews", label: "Review Manager", icon: Star, group: "Optimize" },
  { id: "price", label: "Price Advisor", icon: DollarSign, group: "Optimize" },
  { id: "social", label: "Social Studio", icon: Megaphone, group: "Create" },
  { id: "email", label: "Email Writer", icon: Mail, group: "Create" },
  { id: "whatsapp", label: "WhatsApp Writer", icon: MessageCircle, group: "Create" },
  { id: "demand", label: "Demand Forecast", icon: Calendar, group: "Insights" },
  { id: "competitors", label: "Competitor Watch", icon: Users, group: "Insights" },
  { id: "library", label: "Content Library", icon: BookOpen, group: "Insights" },
];

interface GrowthManagerProps { vendor: Vendor; onNavigate: (tab: string) => void; }

export function GrowthManager({ vendor, onNavigate }: GrowthManagerProps) {
  const [tab, setTab] = React.useState<Tab>("daily");

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Bot className="h-6 w-6 text-primary" /> AI Growth Manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your virtual business manager — daily reports, growth actions, and AI-powered optimization.</p>
      </div>

      <ScrollArea className="mb-6 w-full pb-1">
        <div className="flex w-max gap-4">
          {["Overview", "Optimize", "Create", "Insights"].map((group) => (
            <div key={group} className="flex flex-col gap-1.5">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</span>
              <div className="flex gap-1.5">
                {TABS.filter((t) => t.group === group).map((t) => {
                  const Icon = t.icon; const active = tab === t.id;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition whitespace-nowrap",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent")}>
                      <Icon className="h-4 w-4" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "daily" && <DailyReportTab />}
          {tab === "actions" && <GrowthActionsTab onNavigate={onNavigate} />}
          {tab === "coach" && <ChatCoachTab vendor={vendor} />}
          {tab === "seo" && <SeoManagerTab />}
          {tab === "products" && <ProductOptimizerTab vendor={vendor} />}
          {tab === "reviews" && <ReviewManagerTab vendor={vendor} />}
          {tab === "price" && <PriceAdvisorTab />}
          {tab === "social" && <SocialStudioTab vendor={vendor} />}
          {tab === "email" && <EmailWriterTab />}
          {tab === "whatsapp" && <WhatsAppWriterTab />}
          {tab === "demand" && <DemandForecastTab />}
          {tab === "competitors" && <CompetitorWatchTab />}
          {tab === "library" && <ContentLibraryTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Loading() { return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</div>; }

// ── Daily Report ──
function DailyReportTab() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/vendor/growth-manager/daily-report").then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (!data) return <Empty text="Unable to load your daily report." />;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-gradient-to-br from-brand-soft/50 to-background p-5">
        <h2 className="text-xl font-bold">{data.greeting}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's how your business performed yesterday.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {data.insights.map((insight: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-3 text-center">
            <p className="text-lg font-bold">{insight.split(" ").slice(0, -1).join(" ")}</p>
            <p className="text-[10px] text-muted-foreground">{insight.split(" ").slice(-1)}</p>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" /> AI Summary</h3>
        <p className="mt-2 text-sm text-muted-foreground">{data.aiSummary}</p>
        {data.topProduct && <p className="mt-2 text-xs font-medium">🏆 Top product: {data.topProduct}</p>}
        <p className="mt-1 text-xs font-medium">🕐 Peak search hours: {data.peakHours}</p>
      </div>
    </div>
  );
}

// ── Growth Actions ──
function GrowthActionsTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [actions, setActions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/vendor/success-center").then(r => r.ok ? r.json() : null).then(d => { if (d?.recommendations) setActions(d.recommendations); }).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (actions.length === 0) return <Empty text="No growth actions right now — your profile is in great shape!" />;
  const pc = { high: "text-red-600 bg-red-100 dark:bg-red-950/40", medium: "text-amber-600 bg-amber-100 dark:bg-amber-950/40", low: "text-blue-600 bg-blue-100 dark:bg-blue-950/40" };
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Actionable tasks to grow your business</h2>
      {actions.map((a, i) => (
        <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold", pc[a.priority as keyof typeof pc])}>{a.priority === "high" ? "★" : a.priority === "medium" ? "↑" : "•"}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="text-sm font-semibold">{a.title}</p><Badge variant="outline" className="text-[9px]">{a.rankingIncrease}</Badge></div>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
            <p className="mt-1 text-xs font-medium text-emerald-600">{a.expectedImpact}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onNavigate(a.fixTab)} className="shrink-0">{a.fixAction} <ArrowRight className="ml-1 size-3" /></Button>
        </motion.div>
      ))}
    </div>
  );
}

// ── AI Chat Coach ──
function ChatCoachTab({ vendor }: { vendor: Vendor }) {
  const [messages, setMessages] = React.useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: `Hi! I'm Josh, your AI business coach. Ask me anything about growing ${vendor.name} — "What should I improve?", "How do I get more bookings?", "Create a Diwali campaign", etc.` }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setMessages(m => [...m, { role: "user", content: userMsg }]); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/vendor/growth-manager/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMsg }) });
      const data = await res.json();
      if (data.reply) setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">{["What should I improve?", "How do I get more bookings?", "Create a Diwali campaign", "Improve my SEO"].map(s => <button key={s} onClick={() => setInput(s)} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">{s}</button>)}</div>
      <div ref={scrollRef} className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border bg-card p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", m.role === "user" ? "bg-brand" : "bg-gradient-to-br from-amber-500 to-purple-600")}>{m.role === "user" ? "You" : "AI"}</span>
            <div className={cn("max-w-[75%] rounded-2xl p-3 text-sm", m.role === "user" ? "rounded-tr-sm bg-brand text-brand-foreground" : "rounded-tl-sm bg-muted")}><p className="whitespace-pre-wrap">{m.content}</p></div>
          </div>
        ))}
        {loading && <div className="flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      </div>
      <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
        <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask Josh anything about your business…" rows={1} className="min-h-[40px] resize-none border-0 bg-transparent focus-visible:ring-0" />
        <Button size="icon" onClick={send} disabled={loading || !input.trim()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button>
      </div>
    </div>
  );
}

// ── SEO Manager ──
function SeoManagerTab() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/vendor/marketing/seo").then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (!data) return <Empty text="Unable to load SEO data." />;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={cn(data.score >= 70 ? "text-emerald-500" : data.score >= 40 ? "text-amber-500" : "text-red-500")} strokeDasharray={`${(data.score / 100) * 150.8} 150.8`} />
          </svg>
          <span className="absolute text-sm font-bold">{data.score}</span>
        </div>
        <div><h3 className="text-sm font-semibold">SEO Score</h3><p className="text-xs text-muted-foreground">{data.checks?.filter((c: any) => c.passed).length || 0}/{data.checks?.length || 0} checks passed</p></div>
      </div>
      <div className="space-y-2">
        {data.checks?.map((c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
            {c.passed ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" />}
            <span className="flex-1">{c.label}</span>{c.detail && <span className="text-xs text-muted-foreground">{c.detail}</span>}
          </div>
        ))}
      </div>
      {data.suggestions?.length > 0 && (
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-4">
          <h4 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-200">Suggestions</h4>
          <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-300">{data.suggestions.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

// ── Product Optimizer ──
function ProductOptimizerTab({ vendor }: { vendor: Vendor }) {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [optimizing, setOptimizing] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Record<string, any>>({});
  React.useEffect(() => { fetch("/api/vendor/products?limit=20").then(r => r.ok ? r.json() : null).then(d => { if (d?.products) setProducts(d.products); }).finally(() => setLoading(false)); }, []);

  const optimize = async (productId: string) => {
    setOptimizing(productId);
    try { const res = await fetch("/api/vendor/growth-manager/product-optimize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) }); const data = await res.json(); if (res.ok) setResults(r => ({ ...r, [productId]: data })); else toast.error(data.error); } catch { toast.error("Failed"); } finally { setOptimizing(null); }
  };

  if (loading) return <Loading />;
  if (products.length === 0) return <Empty text="No products to optimize yet." />;
  return (
    <div className="space-y-3">
      {products.map((p) => {
        const result = results[p.id];
        return (
          <div key={p.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {p.image && <img loading="lazy" src={p.image} alt={p.name} className="size-10 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.views || 0} views · {p.orderCount || 0} orders</p></div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {result && <span className={cn("text-2xl font-bold", result.score >= 80 ? "text-emerald-600" : result.score >= 50 ? "text-amber-600" : "text-red-600")}>{result.score}<span className="text-xs text-muted-foreground">/100</span></span>}
                <Button size="sm" variant="outline" onClick={() => optimize(p.id)} disabled={optimizing === p.id}>{optimizing === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{result ? "Re-analyze" : "Optimize"}</Button>
              </div>
            </div>
            {result && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {result.suggestions.map((s: string, i: number) => <div key={i} className="flex items-center gap-2 text-xs"><span className="size-1.5 rounded-full bg-amber-500" /> {s}</div>)}
                {result.improvedTitle && <div className="rounded-lg bg-muted/30 p-2 text-xs"><p className="font-semibold text-muted-foreground">Suggested title:</p><p className="mt-0.5">{result.improvedTitle}</p></div>}
                {result.improvedDescription && <div className="rounded-lg bg-muted/30 p-2 text-xs"><p className="font-semibold text-muted-foreground">Suggested description:</p><p className="mt-0.5">{result.improvedDescription}</p></div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Review Manager ──
function ReviewManagerTab({ vendor }: { vendor: Vendor }) {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [replies, setReplies] = React.useState<Record<string, { reply: string; style: string }>>({});
  const [generating, setGenerating] = React.useState<string | null>(null);
  React.useEffect(() => { fetch(`/api/reviews?vendorId=${vendor.id}`).then(r => r.ok ? r.json() : null).then(d => { if (d?.reviews) setReviews(d.reviews.slice(0, 10)); }).finally(() => setLoading(false)); }, [vendor.id]);

  const generateReply = async (reviewId: string, style: string) => {
    setGenerating(reviewId);
    try { const res = await fetch("/api/vendor/growth-manager/review-reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId, style }) }); const data = await res.json(); if (data.reply) setReplies(r => ({ ...r, [reviewId]: { reply: data.reply, style } })); } catch { toast.error("Failed"); } finally { setGenerating(null); }
  };

  if (loading) return <Loading />;
  if (reviews.length === 0) return <Empty text="No reviews yet." />;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">{r.author?.[0] || "?"}</div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold">{r.author}</p><div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={cn("size-3", s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />)}</div></div><p className="mt-0.5 text-xs text-muted-foreground">{r.comment}</p></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["professional", "friendly", "luxury", "funny"].map(style => (
              <button key={style} onClick={() => generateReply(r.id, style)} disabled={generating === r.id} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition hover:bg-accent", replies[r.id]?.style === style ? "border-primary bg-primary text-primary-foreground" : "")}>
                {generating === r.id && replies[r.id]?.style === style ? <Loader2 className="mr-1 inline size-3 animate-spin" /> : null}{style}
              </button>
            ))}
          </div>
          {replies[r.id] && <div className="mt-2 rounded-lg bg-muted/30 p-3 text-sm"><p>{replies[r.id].reply}</p><button onClick={() => { navigator.clipboard.writeText(replies[r.id].reply); toast.success("Copied"); }} className="mt-1.5 text-xs text-primary hover:underline">📋 Copy</button></div>}
        </div>
      ))}
    </div>
  );
}

// ── Price Advisor ──
function PriceAdvisorTab() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/vendor/growth-manager/price-advisor").then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (!data) return <Empty text="Unable to load price advice." />;
  const sc = { too_cheap: "text-red-600 bg-red-100 dark:bg-red-950/40", competitive: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40", premium: "text-violet-600 bg-violet-100 dark:bg-violet-950/40" };
  const sl = { too_cheap: "Too Cheap", competitive: "Competitive", premium: "Premium" };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">AI Price Advisor</h3><Badge className={sc[data.status as keyof typeof sc]}>{sl[data.status as keyof typeof sl]}</Badge></div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/30 p-3 text-center"><p className="text-xs text-muted-foreground">Your Avg Price</p><p className="text-2xl font-bold">₹{(data.yourAveragePrice / 100).toLocaleString()}</p></div>
          <div className="rounded-lg bg-muted/30 p-3 text-center"><p className="text-xs text-muted-foreground">Peer Average</p><p className="text-2xl font-bold text-muted-foreground">₹{(data.averagePeerPrice / 100).toLocaleString()}</p></div>
        </div>
        <div className="mt-4 rounded-lg border p-3"><p className="text-sm font-medium">{data.recommendation}</p><p className="mt-1 text-xs text-emerald-600">{data.estimatedRevenueChange}</p></div>
      </div>
    </div>
  );
}

// ── Social Studio ──
function SocialStudioTab({ vendor }: { vendor: Vendor }) {
  const [platform, setPlatform] = React.useState("instagram");
  const [topic, setTopic] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [copied, setCopied] = React.useState(false);
  const generate = async () => {
    if (!topic.trim()) { toast.error("Enter a topic"); return; }
    setLoading(true); setResult(null);
    try { const res = await fetch("/api/vendor/marketing/ai/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, topic }) }); const data = await res.json(); if (data.caption) setResult(data); } catch { toast.error("Failed"); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">{["instagram", "facebook", "whatsapp", "twitter", "linkedin", "pinterest"].map(p => <button key={p} onClick={() => setPlatform(p)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium capitalize", platform === p ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>{p}</button>)}</div>
      <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Diwali Special Sweets, New Cake Launch, 20% off" />
      <Button onClick={generate} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />} Generate Post</Button>
      {result && <div className="rounded-xl border bg-card p-4"><div className="mb-2 flex justify-between"><span className="text-xs font-semibold capitalize">{platform}</span><button onClick={() => { navigator.clipboard.writeText(`${result.caption}\n\n${result.hashtags?.join(" ") || ""}`); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 2000); }} className="text-xs">{copied ? "✓" : "📋 Copy"}</button></div><Textarea readOnly rows={5} value={result.caption} className="text-sm" />{result.hashtags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{result.hashtags.map((h: string, i: number) => <Badge key={i} variant="secondary" className="text-[10px] text-blue-600">{h}</Badge>)}</div>}</div>}
    </div>
  );
}

// ── Email Writer ──
function EmailWriterTab() {
  const [template, setTemplate] = React.useState("new_product");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const generate = async () => { setLoading(true); setResult(null); try { const res = await fetch("/api/vendor/marketing/ai/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template }) }); const data = await res.json(); if (data.email) setResult(data.email); } catch { toast.error("Failed"); } finally { setLoading(false); } };
  const templates = [{ value: "new_product", label: "Welcome / New Product" }, { value: "festival", label: "Festival Wishes" }, { value: "special_offer", label: "Discount Campaign" }, { value: "thank_you", label: "Birthday Wishes" }, { value: "booking_reminder", label: "Follow-up" }, { value: "re_engagement", label: "Lost Customer" }];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">{templates.map(t => <button key={t.value} onClick={() => setTemplate(t.value)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", template === t.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>{t.label}</button>)}</div>
      <Button onClick={generate} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />} Generate Email</Button>
      {result && <div className="rounded-xl border bg-card p-4 space-y-2"><div><span className="text-xs font-semibold text-muted-foreground">Subject:</span> <span className="text-sm">{result.subject}</span></div><Textarea readOnly rows={8} value={result.body} className="text-sm" /></div>}
    </div>
  );
}

// ── WhatsApp Writer ──
function WhatsAppWriterTab() {
  const [type, setType] = React.useState("promo");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const generate = async () => { setLoading(true); setResult(null); try { const res = await fetch("/api/vendor/marketing/ai/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }); const data = await res.json(); if (data.message) setResult(data.message); } catch { toast.error("Failed"); } finally { setLoading(false); } };
  const types = [{ value: "promo", label: "Promotion" }, { value: "booking_reminder", label: "Booking Confirmation" }, { value: "thank_you", label: "Thank You" }, { value: "review_request", label: "Review Request" }, { value: "festival", label: "Festival Greetings" }];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">{types.map(t => <button key={t.value} onClick={() => setType(t.value)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", type === t.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}>{t.label}</button>)}</div>
      <Button onClick={generate} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />} Generate WhatsApp Message</Button>
      {result && <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-4"><div className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm dark:bg-background">{result}</div><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(result); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 2000); }}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy</Button><a href={`https://wa.me/?text=${encodeURIComponent(result)}`} target="_blank" rel="noopener noreferrer"><Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700"><Send className="mr-1 size-3.5" /> Open in WhatsApp</Button></a></div></div>}
    </div>
  );
}

// ── Demand Forecast ──
function DemandForecastTab() {
  const now = new Date(); const month = now.getMonth();
  const forecasts = [
    { event: "Wedding Season", icon: "💍", demand: month >= 9 && month <= 1 ? "high" : "medium", rec: "Stock wedding cakes & catering packages" },
    { event: "Diwali", icon: "🪔", demand: month === 9 ? "high" : "medium", rec: "Prepare sweet boxes & festival hampers" },
    { event: "Christmas", icon: "🎄", demand: month === 10 || month === 11 ? "high" : "low", rec: "Stock plum cakes & themed desserts" },
    { event: "Valentine's Day", icon: "❤️", demand: month === 0 || month === 1 ? "high" : "low", rec: "Heart-shaped cakes & couples packages" },
    { event: "Weekend Events", icon: "🎉", demand: "medium", rec: "Prepare for weekend party bookings" },
  ];
  const dc = { high: "text-red-600 bg-red-100 dark:bg-red-950/40", medium: "text-amber-600 bg-amber-100 dark:bg-amber-950/40", low: "text-muted-foreground bg-muted" };
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">AI Demand Forecast</h2>
      <p className="text-xs text-muted-foreground">Prepare your inventory for upcoming demand spikes.</p>
      {forecasts.map((f, i) => <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4"><span className="text-2xl">{f.icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{f.event}</p><p className="text-xs text-muted-foreground">{f.rec}</p></div><Badge className={dc[f.demand as keyof typeof dc]}>{f.demand} demand</Badge></div>)}
    </div>
  );
}

// ── Competitor Watch ──
function CompetitorWatchTab() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/vendor/success-center").then(r => r.ok ? r.json() : null).then(d => { if (d?.competitors) setData(d); }).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (!data?.competitors?.length) return <Empty text="No competitor data available yet." />;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">Competitor Watch</h2>
      {data.competitors.map((c: any, i: number) => {
        const youNum = typeof c.you === "number" ? c.you : parseFloat(c.you) || 0;
        const peerNum = typeof c.peerAverage === "number" ? c.peerAverage : parseFloat(c.peerAverage) || 0;
        const better = youNum >= peerNum;
        return (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">{c.metric}</span><span className={cn("text-xs font-semibold", better ? "text-emerald-600" : "text-red-600")}>{better ? "Above" : "Below"} average</span></div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div className="rounded bg-muted/30 p-2"><p className="text-muted-foreground">You</p><p className={cn("text-lg font-bold", better ? "text-emerald-600" : "text-red-600")}>{c.you} {c.unit}</p></div><div className="rounded bg-muted/30 p-2"><p className="text-muted-foreground">Peers</p><p className="text-lg font-bold text-muted-foreground">{c.peerAverage} {c.unit}</p></div></div>
            {c.suggestion && <p className="mt-1.5 text-xs text-amber-600">💡 {c.suggestion}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Content Library ──
function ContentLibraryTab() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/vendor/growth-manager/content-library").then(r => r.ok ? r.json() : null).then(d => { if (d?.items) setItems(d.items); }).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (items.length === 0) return <Empty text="No AI generations yet. Use the tools above to generate content!" />;
  const tl: Record<string, string> = { listing_description: "Listing Description", setup_assistant: "Business Profile", social_post: "Social Media Post", email_campaign: "Email Campaign", whatsapp_msg: "WhatsApp Message", campaign_copy: "Campaign Copy", growth_advisor: "Growth Advice" };
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">Content Library</h2>
      <p className="text-xs text-muted-foreground">All your AI-generated content in one place.</p>
      {items.map(item => <div key={item.id} className="flex items-center gap-3 rounded-lg border bg-card p-3"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Sparkles className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{tl[item.type] || item.type}</p><p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div></div>)}
    </div>
  );
}
