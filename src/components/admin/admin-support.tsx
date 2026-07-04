"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy, Search, Loader2, ArrowLeft, Send, Trash2, UserCog,
  MessageCircle, AlertCircle, Clock, Star, X, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES,
  statusMeta, categoryLabel, priorityMeta, fmtTime,
} from "@/lib/support/constants";

interface Attachment { type: string; url: string; name: string; size: number; }
interface Message { id: string; senderType: string; senderName: string; body: string; attachments: Attachment[]; createdAt: string; }
interface Ticket {
  id: string; ticketNumber: string; subject: string; category: string; priority: string;
  status: string; vendorId: string; vendorName: string;
  vendorUnreadCount: number; adminUnreadCount: number;
  assignedTo: string | null; assignedToEmail: string | null;
  createdAt: string; updatedAt: string; resolvedAt: string | null;
}
interface TicketDetail extends Ticket {
  messages: Message[]; businessName: string | null; vendorEmail: string | null;
  vendorPhone: string | null; browserInfo: string | null; dashboardUrl: string | null;
  internalNotes: string | null;
}

export function AdminSupport() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<TicketDetail | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [stats, setStats] = React.useState({ total: 0, open: 0, urgent: 0, unassigned: 0, adminUnread: 0 });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const res = await fetch(`/api/admin/support/tickets?${params.toString()}`);
      if (res.ok) { const d = await res.json(); setTickets(d.tickets || []); if (d.stats) setStats(d.stats); }
    } catch {} finally { setLoading(false); }
  }, [search, statusFilter, priorityFilter]);

  React.useEffect(() => { load(); }, [load]);

  const openTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`);
      if (res.ok) { const d = await res.json(); setSelected(d.ticket); load(); }
    } catch { toast.error("Failed to load ticket"); }
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold"><LifeBuoy className="h-5 w-5" /> Support Tickets</h2>
        <p className="text-sm text-muted-foreground">Manage vendor support requests and respond to conversations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={<MessageCircle className="h-4 w-4" />} />
        <StatCard label="Open" value={stats.open} icon={<Clock className="h-4 w-4" />} tone="amber" />
        <StatCard label="Urgent" value={stats.urgent} icon={<AlertCircle className="h-4 w-4" />} tone="red" />
        <StatCard label="Unassigned" value={stats.unassigned} icon={<UserCog className="h-4 w-4" />} tone="violet" />
        <StatCard label="Unread" value={stats.adminUnread} icon={<Star className="h-4 w-4" />} tone="blue" />
      </div>

      {!selected ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>{TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusMeta(s).label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All priorities</SelectItem>{TICKET_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No tickets match this filter.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="hidden grid-cols-[1fr_100px_100px_100px_120px] gap-2 border-b bg-muted/40 p-3 text-[10px] font-semibold uppercase text-muted-foreground sm:grid">
                <span>Ticket</span><span>Priority</span><span>Status</span><span>Assigned</span><span>Updated</span>
              </div>
              <div className="divide-y">
                {tickets.map((t) => {
                  const sm = statusMeta(t.status);
                  const pm = priorityMeta(t.priority);
                  return (
                    <button key={t.id} onClick={() => openTicket(t.id)}
                      className="grid w-full grid-cols-1 gap-1 p-3 text-left transition-colors hover:bg-accent sm:grid-cols-[1fr_100px_100px_100px_120px] sm:items-center sm:gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{t.subject}</span>
                          {t.adminUnreadCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{t.adminUnreadCount}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-mono">{t.ticketNumber}</span><span>·</span><span>{t.vendorName}</span><span>·</span><span>{categoryLabel(t.category)}</span>
                        </div>
                      </div>
                      <span className={cn("w-fit rounded-full px-2 py-0.5 text-[10px] font-medium", pm.className)}>{pm.label}</span>
                      <span className={cn("w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium", sm.className)}>{sm.label}</span>
                      <span className="text-[11px] text-muted-foreground">{t.assignedToEmail ? t.assignedToEmail.split("@")[0] : "—"}</span>
                      <span className="text-[11px] text-muted-foreground">{fmtTime(t.updatedAt)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <AdminTicketDetail ticket={selected} onBack={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "neutral" }: { label: string; value: number; icon: React.ReactNode; tone?: "neutral" | "amber" | "red" | "violet" | "blue" }) {
  const cls = tone === "amber" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
    : tone === "red" ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : tone === "violet" ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
    : tone === "blue" ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
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

function AdminTicketDetail({ ticket, onBack }: { ticket: TicketDetail; onBack: () => void }) {
  const [messages, setMessages] = React.useState(ticket.messages);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [showNotes, setShowNotes] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sm = statusMeta(ticket.status);

  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", message: input }),
      });
      const data = await res.json();
      if (res.ok && data.message) { setMessages((m) => [...m, data.message]); setInput(""); toast.success("Reply sent"); }
      else { toast.error(data.error || "Failed to send"); }
    } catch { toast.error("Failed to send"); } finally { setSending(false); }
  };

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", status }),
      });
      if (res.ok) { toast.success(`Status → ${statusMeta(status).label}`); onBack(); }
    } catch { toast.error("Failed to update"); }
  };

  const deleteTicket = async () => {
    if (!confirm("Delete this ticket permanently?")) return;
    try {
      await fetch(`/api/admin/support/tickets/${ticket.id}`, { method: "DELETE" });
      toast.success("Ticket deleted"); onBack();
    } catch { toast.error("Failed to delete"); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "internal_note", note }),
      });
      toast.success("Note added"); setNote("");
    } catch { toast.error("Failed to add note"); }
  };

  const internalNotes: { note: string; adminEmail: string; timestamp: string }[] = ticket.internalNotes ? JSON.parse(ticket.internalNotes) : [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <button onClick={onBack} className="grid size-8 place-items-center rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{ticket.subject}</h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">{ticket.ticketNumber}</span><span>·</span>
            <span>{ticket.vendorName}</span><span>·</span>
            <span>{categoryLabel(ticket.category)}</span>
            {ticket.vendorEmail && <><span>·</span><span>{ticket.vendorEmail}</span></>}
          </div>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", sm.className)}>{sm.label}</span>
      </div>

      {/* Admin actions */}
      <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <Select onValueChange={updateStatus}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Change status" /></SelectTrigger>
          <SelectContent>{TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusMeta(s).label}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowNotes(!showNotes)}><StickyNote className="mr-1 h-3.5 w-3.5" /> Internal Notes ({internalNotes.length})</Button>
        <Button variant="outline" size="sm" className="text-red-600" onClick={deleteTicket}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
      </div>

      {/* Internal notes panel */}
      {showNotes && (
        <div className="space-y-2 rounded-xl border bg-amber-50 p-3 dark:bg-amber-950/20">
          <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200">Internal Notes (not visible to vendor)</h4>
          {internalNotes.length > 0 && (
            <div className="space-y-1.5">
              {internalNotes.map((n, i) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-white p-2 text-xs dark:bg-amber-950/30">
                  <p>{n.note}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{n.adminEmail} · {fmtTime(n.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" className="text-xs" />
            <Button size="sm" onClick={addNote} disabled={!note.trim()}>Add</Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[45vh] space-y-3 overflow-y-auto rounded-xl border bg-card p-4">
        {messages.map((m) => {
          const isVendor = m.senderType === "vendor";
          const isSystem = m.senderType === "system";
          if (isSystem) return <div key={m.id} className="flex justify-center"><span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">{m.body}</span></div>;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2", isVendor ? "flex-row" : "flex-row-reverse")}>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", isVendor ? "bg-brand" : "bg-gradient-to-br from-amber-500 to-purple-600")}>{isVendor ? "V" : "AD"}</span>
              <div className={cn("max-w-[75%] rounded-2xl p-3", isVendor ? "rounded-tl-sm bg-muted" : "rounded-tr-sm bg-brand text-brand-foreground")}>
                {isVendor && <p className="mb-0.5 text-[10px] font-semibold text-muted-foreground">{m.senderName}</p>}
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                {m.attachments?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.attachments.map((a, i) => <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-black/10 px-2 py-1 text-[10px] hover:bg-black/20">{a.name}</a>)}
                  </div>
                )}
                <p className={cn("mt-1 text-[10px]", isVendor ? "text-muted-foreground" : "text-brand-foreground/70")}>{fmtTime(m.createdAt)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reply */}
      {ticket.status === "closed" ? (
        <div className="rounded-xl border bg-muted/30 p-3 text-center text-sm text-muted-foreground">This ticket is closed.</div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your reply… (Enter to send)" rows={1} className="min-h-[40px] resize-none border-0 bg-transparent focus-visible:ring-0" />
          <Button size="icon" onClick={send} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Vendor context */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/30 p-3 text-xs">
        {ticket.businessName && <div><span className="text-muted-foreground">Business:</span> <span className="font-medium">{ticket.businessName}</span></div>}
        {ticket.vendorEmail && <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{ticket.vendorEmail}</span></div>}
        {ticket.vendorPhone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{ticket.vendorPhone}</span></div>}
        {ticket.dashboardUrl && <div className="col-span-2 truncate"><span className="text-muted-foreground">URL:</span> <span className="font-mono">{ticket.dashboardUrl}</span></div>}
        {ticket.browserInfo && <div className="col-span-2 truncate"><span className="text-muted-foreground">Browser:</span> <span className="font-mono text-[10px]">{ticket.browserInfo.slice(0, 80)}…</span></div>}
      </div>
    </div>
  );
}
