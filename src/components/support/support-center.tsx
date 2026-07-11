"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Plus, Search, Loader2, ArrowLeft, Send, Paperclip,
  LifeBuoy, Mail, ChevronDown, ChevronUp, X,
  AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES,
  statusMeta, categoryLabel, priorityMeta, fmtTime,
} from "@/lib/support/constants";
import type { Vendor } from "@/lib/types";

interface Attachment { type: "image" | "pdf" | "document"; url: string; name: string; size: number; }
interface Message { id: string; senderType: string; senderName: string; senderAvatar: string | null; body: string; attachments: Attachment[]; createdAt: string; }
interface Ticket { id: string; ticketNumber: string; subject: string; category: string; priority: string; status: string; vendorName: string; vendorUnreadCount: number; createdAt: string; updatedAt: string; }
interface TicketDetail extends Ticket { messages: Message[]; businessName: string | null; vendorEmail: string | null; vendorPhone: string | null; browserInfo: string | null; dashboardUrl: string | null; }
interface FAQ { category: string; question: string; answer: string; }

type View = "list" | "create" | "conversation" | "faq";

export function SupportCenter({ vendor }: { vendor: Vendor }) {
  const [view, setView] = React.useState<View>("list");
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTicket, setSelectedTicket] = React.useState<TicketDetail | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [faqs, setFaqs] = React.useState<FAQ[]>([]);
  const [stats, setStats] = React.useState({ total: 0, open: 0, unread: 0 });

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/vendor/support/tickets?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setTickets(data.tickets || []); }
    } catch {} finally { setLoading(false); }
  }, [search, statusFilter]);

  const loadFaqs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/support/faqs");
      if (res.ok) { const data = await res.json(); setFaqs(data.faqs || []); if (data.stats) setStats(data.stats); }
    } catch {}
  }, []);

  React.useEffect(() => { loadTickets(); }, [loadTickets]);
  React.useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const openTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/support/tickets/${id}`);
      if (res.ok) { const data = await res.json(); setSelectedTicket(data.ticket); setView("conversation"); loadTickets(); }
    } catch { toast.error("Failed to load ticket"); }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <LifeBuoy className="h-6 w-6 text-primary" /> Support Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Get help, report issues, and chat with our team.</p>
        </div>
        {view === "list" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("faq")}>FAQ</Button>
            <Button size="sm" onClick={() => setView("create")}><Plus className="mr-1 h-4 w-4" /> New Ticket</Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <StatCard label="Total Tickets" value={stats.total} icon={<MessageCircle className="h-4 w-4" />} />
              <StatCard label="Open" value={stats.open} icon={<Clock className="h-4 w-4" />} tone="amber" />
              <StatCard label="Unread" value={stats.unread} icon={<AlertCircle className="h-4 w-4" />} tone="red" />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusMeta(s).label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-semibold">No tickets yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">Need help? Create a support ticket and our team will assist you.</p>
                <Button size="sm" className="mt-3" onClick={() => setView("create")}><Plus className="mr-1 h-4 w-4" /> Create Ticket</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t, i) => {
                  const sm = statusMeta(t.status);
                  const pm = priorityMeta(t.priority);
                  return (
                    <motion.button key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => openTicket(t.id)}
                      className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:shadow-md">
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", sm.className)}><MessageCircle className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{t.subject}</span>
                          {t.vendorUnreadCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{t.vendorUnreadCount}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-mono">{t.ticketNumber}</span><span>·</span>
                          <span>{categoryLabel(t.category)}</span><span>·</span>
                          <span>{fmtTime(t.updatedAt)}</span>
                        </div>
                      </div>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", sm.className)}>{sm.label}</span>
                      <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline", pm.className)}>{pm.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <EmergencyContact />
          </motion.div>
        )}

        {view === "create" && (
          <CreateTicketForm vendor={vendor} onCreated={(t) => { setSelectedTicket(t); setView("conversation"); loadTickets(); loadFaqs(); }} onCancel={() => setView("list")} onShowFaq={() => setView("faq")} />
        )}

        {view === "conversation" && selectedTicket && (
          <ConversationView ticket={selectedTicket} onBack={() => { setView("list"); setSelectedTicket(null); loadTickets(); }} />
        )}

        {view === "faq" && (
          <FAQView faqs={faqs} onBack={() => setView("list")} onCreate={() => setView("create")} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, tone = "neutral" }: { label: string; value: number; icon: React.ReactNode; tone?: "neutral" | "amber" | "red" }) {
  const cls = tone === "amber" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
    : tone === "red" ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : "bg-muted text-muted-foreground";
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">{label}</span>
        <span className={cn("flex h-6 w-6 items-center justify-center rounded", cls)}>{icon}</span>
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function EmergencyContact() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Need urgent help?</h4>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">Our support team is available 7 days a week.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href="mailto:support@findmybites.party" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300">
              <Mail className="h-3.5 w-3.5" /> support@findmybites.party
            </a>
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTicketForm({ vendor, onCreated, onCancel, onShowFaq }: { vendor: Vendor; onCreated: (t: TicketDetail) => void; onCancel: () => void; onShowFaq: () => void }) {
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [priority, setPriority] = React.useState("medium");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!subject.trim() || !category || !description.trim()) { toast.error("Please fill in subject, category, and description"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/support/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, description, dashboardUrl: typeof window !== "undefined" ? window.location.href : "" }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) { toast.success("Ticket created — we'll get back to you soon!"); onCreated(data.ticket); }
      else { toast.error(data.error || "Failed to create ticket"); }
    } catch { toast.error("Failed to create ticket"); } finally { setSaving(false); }
  };

  return (
    <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </button>

      <div className="rounded-xl border bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Check our FAQ first</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Your question may already be answered. <button onClick={onShowFaq} className="underline font-medium">Browse FAQs →</button></p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">Create New Support Ticket</h3>
        <div className="grid grid-cols-1 gap-3 rounded-lg sm:grid-cols-2 bg-muted/30 p-3 text-xs">
          <div><span className="text-muted-foreground">Business:</span> <span className="font-medium">{vendor.name}</span></div>
          <div><span className="text-muted-foreground">Vendor ID:</span> <span className="font-mono">{vendor.id.slice(0, 12)}…</span></div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subject *</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{TICKET_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TICKET_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Issue Description *</Label>
          <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail. The more context you provide, the faster we can help." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Attachments (optional)</Label>
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>File upload available in chat after creating the ticket</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !subject.trim() || !category || !description.trim()}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Create Ticket
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ConversationView({ ticket, onBack }: { ticket: TicketDetail; onBack: () => void }) {
  const [messages, setMessages] = React.useState(ticket.messages);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sm = statusMeta(ticket.status);

  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/vendor/support/tickets/${ticket.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (res.ok && data.message) { setMessages((m) => [...m, data.message]); setInput(""); }
      else { toast.error(data.error || "Failed to send"); }
    } catch { toast.error("Failed to send"); } finally { setSending(false); }
  };

  return (
    <motion.div key="conv" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <button onClick={onBack} className="grid size-8 place-items-center rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{ticket.subject}</h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">{ticket.ticketNumber}</span><span>·</span><span>{categoryLabel(ticket.category)}</span>
          </div>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", sm.className)}>{sm.label}</span>
      </div>

      <div ref={scrollRef} className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border bg-card p-4">
        {messages.map((m) => {
          const isVendor = m.senderType === "vendor";
          const isSystem = m.senderType === "system";
          if (isSystem) return <div key={m.id} className="flex justify-center"><span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">{m.body}</span></div>;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2", isVendor ? "flex-row-reverse" : "flex-row")}>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", isVendor ? "bg-brand" : "bg-gradient-to-br from-amber-500 to-purple-600")}>{isVendor ? "You" : "AD"}</span>
              <div className={cn("max-w-[75%] rounded-2xl p-3", isVendor ? "rounded-tr-sm bg-brand text-brand-foreground" : "rounded-tl-sm bg-muted")}>
                {!isVendor && <p className="mb-0.5 text-[10px] font-semibold text-muted-foreground">{m.senderName}</p>}
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                {m.attachments?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-black/10 px-2 py-1 text-[10px] hover:bg-black/20"><Paperclip className="h-3 w-3" /> {a.name}</a>
                    ))}
                  </div>
                )}
                <p className={cn("mt-1 text-[10px]", isVendor ? "text-brand-foreground/70" : "text-muted-foreground")}>{fmtTime(m.createdAt)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {ticket.status === "closed" ? (
        <div className="rounded-xl border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          This ticket is closed. <button onClick={onBack} className="font-medium text-brand hover:underline">Create a new ticket</button> if you need more help.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)" rows={1} className="min-h-[40px] resize-none border-0 bg-transparent focus-visible:ring-0" />
          <Button size="icon" onClick={send} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function FAQView({ faqs, onBack, onCreate }: { faqs: FAQ[]; onBack: () => void; onCreate: () => void }) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);
  return (
    <motion.div key="faq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to support</button>
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="flex w-full items-center justify-between gap-2 p-3 text-left">
              <span className="text-sm font-medium">{f.question}</span>
              {openIdx === i ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
            {openIdx === i && <div className="border-t px-3 py-3 text-sm text-muted-foreground">{f.answer}</div>}
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">Didn&apos;t find what you&apos;re looking for?</p>
        <Button size="sm" className="mt-2" onClick={onCreate}><Plus className="mr-1 h-4 w-4" /> Create a Support Ticket</Button>
      </div>
    </motion.div>
  );
}
