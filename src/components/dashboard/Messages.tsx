"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Send,
  Loader2,
  MessageCircle,
  Image as ImageIcon,
  X,
  Check,
  CheckCheck,
  User,
  Mail,
  ArrowLeft,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/marketplace/image-upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OtherParticipant {
  type: string; // "customer" | "vendor" | "admin" | "josh_ai"
  id: string;
}

interface Conversation {
  id: string;
  vendorId: string | null;
  productId: string | null;
  bookingId: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  otherParticipant: OtherParticipant;
}

interface Attachment {
  type: "image" | "file" | "quote";
  url: string;
  name?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderType: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  attachments: string | null; // JSON: Attachment[]
  quoteId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface MessagesProps {
  vendorId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Display label for a participant type. */
function participantLabel(type: string): string {
  switch (type) {
    case "vendor":
      return "Vendor";
    case "admin":
      return "Admin";
    case "josh_ai":
      return "Josh AI";
    case "customer":
    default:
      return "Customer";
  }
}

/** Short, human-friendly identifier for a participant (last 6 of cuid/uuid). */
function shortId(id: string): string {
  return id.length > 8 ? `#${id.slice(-6)}` : `#${id}`;
}

/** Safely parse the JSON attachments string. */
function parseAttachments(raw: string | null | undefined): Attachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Attachment[];
  } catch {
    /* ignore */
  }
  return [];
}

/** Format a message timestamp (HH:MM, with date if older than 24h). */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Messages({ vendorId }: MessagesProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = React.useState(false);

  // Cache of other-participant display names, keyed by conversation id.
  // Populated lazily as conversations are opened (from the message senders).
  const [nameCache, setNameCache] = React.useState<Record<string, string>>({});

  const [newConvOpen, setNewConvOpen] = React.useState(false);

  // ── Fetch conversations ──
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/messages?role=vendor", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { conversations?: Conversation[] };
      setConversations(data.conversations ?? []);
    } catch {
      // silent — polling shouldn't spam toasts
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchConversations();
    const interval = setInterval(() => void fetchConversations(), 15_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // ── Filtered list ──
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = nameCache[c.id]?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
        (c.lastMessage ?? "").toLowerCase().includes(q) ||
        c.otherParticipant.id.toLowerCase().includes(q) ||
        participantLabel(c.otherParticipant.type).toLowerCase().includes(q)
      );
    });
  }, [conversations, search, nameCache]);

  const selected = React.useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const totalUnread = React.useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
  };

  const handleBack = () => {
    setMobileShowThread(false);
    // Keep selectedId so re-opening on desktop restores state.
  };

  const handleNewConversation = () => {
    setNewConvOpen(true);
  };

  const handleConversationStarted = (convId: string) => {
    setNewConvOpen(false);
    void fetchConversations();
    setSelectedId(convId);
    setMobileShowThread(true);
  };

  const handleNameResolved = React.useCallback((convId: string, name: string) => {
    setNameCache((prev) => (prev[convId] === name ? prev : { ...prev, [convId]: name }));
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Messages</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chat directly with customers who enquire about your services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <Badge className="border-0 bg-brand text-brand-foreground">
              {totalUnread} unread
            </Badge>
          )}
          <Button
            onClick={handleNewConversation}
            size="sm"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" />
            New conversation
          </Button>
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="grid h-[calc(100vh-12rem)] min-h-[28rem] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[320px_1fr]">
        {/* Left panel — conversation list */}
        <div
          className={cn(
            "flex flex-col border-b border-border md:border-b-0 md:border-r",
            mobileShowThread && selected ? "hidden md:flex" : "flex",
          )}
        >
          {/* Search */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="pl-9"
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            {loadingList ? (
              <ConversationListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyConversations hasAny={conversations.length > 0} />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((c) => (
                  <ConversationListItem
                    key={c.id}
                    conversation={c}
                    displayName={nameCache[c.id] ?? null}
                    active={c.id === selectedId}
                    onSelect={() => handleSelect(c.id)}
                  />
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Right panel — message thread */}
        <div
          className={cn(
            "flex flex-col",
            mobileShowThread && selected ? "flex" : "hidden md:flex",
          )}
        >
          {selected ? (
            <MessageThread
              key={selected.id}
              conversation={selected}
              vendorId={vendorId}
              onBack={handleBack}
              onNameResolved={handleNameResolved}
              onUnreadCleared={() => {
                // Optimistically clear unread badge
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === selected.id ? { ...c, unreadCount: 0 } : c,
                  ),
                );
              }}
            />
          ) : (
            <EmptyThread />
          )}
        </div>
      </div>

      {/* ── New conversation dialog ── */}
      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
        vendorId={vendorId}
        onStarted={handleConversationStarted}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation list item
// ─────────────────────────────────────────────────────────────────────────────

function ConversationListItem({
  conversation,
  displayName,
  active,
  onSelect,
}: {
  conversation: Conversation;
  displayName: string | null;
  active: boolean;
  onSelect: () => void;
}) {
  const other = conversation.otherParticipant;
  const label = displayName ?? participantLabel(other.type);
  const preview =
    conversation.lastMessage?.trim() || "No messages yet — say hello!";

  return (
    <li>
      <button
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
          active ? "bg-brand-soft/60" : "hover:bg-accent/50",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold",
            active
              ? "bg-brand text-brand-foreground"
              : "bg-brand-soft text-brand",
          )}
        >
          {label.charAt(0).toUpperCase()}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-sm",
                  conversation.unreadCount > 0 ? "font-bold" : "font-semibold",
                )}
              >
                {label}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {participantLabel(other.type)} · {shortId(other.id)}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {timeAgo(conversation.lastMessageAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-xs",
                conversation.unreadCount > 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {preview}
            </p>
            {conversation.unreadCount > 0 && (
              <Badge className="shrink-0 border-0 bg-brand px-1.5 py-0 text-[10px] text-brand-foreground tabular-nums">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message thread (right panel)
// ─────────────────────────────────────────────────────────────────────────────

function MessageThread({
  conversation,
  vendorId,
  onBack,
  onNameResolved,
  onUnreadCleared,
}: {
  conversation: Conversation;
  vendorId: string;
  onBack: () => void;
  onNameResolved: (convId: string, name: string) => void;
  onUnreadCleared: () => void;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [pendingImage, setPendingImage] = React.useState<string>("");
  const [showImageUpload, setShowImageUpload] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const other = conversation.otherParticipant;

  // ── Fetch messages ──
  const fetchMessages = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/messages/conversation?id=${encodeURIComponent(conversation.id)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: Message[] };
      const list = data.messages ?? [];
      setMessages(list);

      // Resolve other participant's display name from the most recent
      // non-vendor message (i.e. the other side's senderName).
      const otherMsg = list.find(
        (m) => m.senderType !== "vendor" && m.senderType !== "admin",
      );
      if (otherMsg?.senderName) {
        onNameResolved(conversation.id, otherMsg.senderName);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [conversation.id, onNameResolved, conversation]);

  React.useEffect(() => {
    setLoading(true);
    setMessages([]);
    void fetchMessages();
  }, [fetchMessages]);

  // Mark as read when opened. The GET /api/messages/conversation endpoint
  // already resets the server-side unread counter; we additionally clear the
  // local badge optimistically. Only fires when the conversation changes.
  React.useEffect(() => {
    if (conversation.unreadCount > 0) {
      onUnreadCleared();
    }
  }, [conversation.id]);

  // ── Auto-scroll on new messages ──
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // ── Send message ──
  const handleSend = async () => {
    const content = draft.trim();
    if (!content && !pendingImage) return;

    setSending(true);
    const attachments: Attachment[] = pendingImage
      ? [{ type: "image", url: pendingImage }]
      : [];

    // Optimistic append
    const optimistic: Message = {
      id: `pending-${Date.now()}`,
      conversationId: conversation.id,
      senderType: "vendor",
      senderId: vendorId,
      senderName: "You",
      senderAvatar: null,
      content: content || "",
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      quoteId: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setPendingImage("");
    setShowImageUpload(false);

    try {
      const res = await fetch(
        `/api/messages/conversation?id=${encodeURIComponent(conversation.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content || "(image)",
            attachments: attachments.length > 0 ? attachments : undefined,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `Request failed (${res.status})`,
        );
      }
      // Refresh to get the server-persisted message + read-receipt state.
      void fetchMessages();
    } catch (err) {
      // Rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const headerLabel =
    // Use cached name if available, otherwise fall back to participant label
    messages.find((m) => m.senderType !== "vendor" && m.senderType !== "admin")?.senderName ??
    participantLabel(other.type);

  return (
    <>
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {headerLabel.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{headerLabel}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {participantLabel(other.type)} · {shortId(other.id)}
          </p>
        </div>
      </div>

      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4"
      >
        {loading ? (
          <MessageListSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <MessageCircle className="size-10 text-muted-foreground/40" />
            <p className="mt-3">No messages yet. Send the first one below.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.senderType === "vendor";
            const prev = messages[i - 1];
            const showSender = !isMe && (!prev || prev.senderType !== m.senderType);
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={isMe}
                showSender={showSender}
              />
            );
          })
        )}
      </div>

      {/* Reply input */}
      <div className="border-t border-border bg-card p-3">
        {/* Pending image preview */}
        {pendingImage && (
          <div className="mb-2 inline-block relative">
            <img
              src={pendingImage}
              alt="Pending attachment"
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => setPendingImage("")}
              aria-label="Remove pending image"
              className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Inline image uploader (toggled) */}
        {showImageUpload && !pendingImage && (
          <div className="mb-2 max-w-[16rem]">
            <ImageUpload
              label="Attach image"
              value={pendingImage}
              onChange={(url) => {
                if (url) {
                  setPendingImage(url);
                  setShowImageUpload(false);
                }
              }}
              aspect="square"
              hint="JPG, PNG, WebP · max 5MB"
            />
          </div>
        )}

        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowImageUpload((v) => !v)}
            disabled={sending}
            aria-label="Attach image"
            title="Attach image"
          >
            <ImageIcon className="size-4" />
          </Button>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message…  (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={sending}
            className="min-h-[2.5rem] max-h-32 resize-none flex-1"
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || (!draft.trim() && !pendingImage)}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single message bubble
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMe,
  showSender,
}: {
  message: Message;
  isMe: boolean;
  showSender: boolean;
}) {
  const attachments = parseAttachments(message.attachments);
  const read = !!message.readAt;

  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
          {(message.senderName || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isMe
            ? "rounded-br-md bg-brand text-brand-foreground"
            : "rounded-bl-md bg-card border border-border",
        )}
      >
        {showSender && !isMe && (
          <p className="mb-0.5 text-[10px] font-bold text-brand">
            {message.senderName}
          </p>
        )}

        {/* Text content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {attachments
              .filter((a) => a.type === "image")
              .map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={a.url}
                    alt={a.name ?? "Attachment"}
                    className="h-32 w-32 rounded-lg border border-border object-cover"
                  />
                </a>
              ))}
            {attachments
              .filter((a) => a.type !== "image")
              .map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
                    isMe
                      ? "border-brand-foreground/30 bg-brand-foreground/10"
                      : "border-border bg-background",
                  )}
                >
                  <Inbox className="size-3.5" />
                  <span className="max-w-[10rem] truncate">
                    {a.name ?? "Attachment"}
                  </span>
                </a>
              ))}
          </div>
        )}

        {/* Meta row: time + read receipt */}
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            isMe ? "justify-end text-brand-foreground/70" : "text-muted-foreground",
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isMe &&
            (read ? (
              <CheckCheck className="size-3" aria-label="Read" />
            ) : (
              <Check className="size-3" aria-label="Sent" />
            ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New conversation dialog
// ─────────────────────────────────────────────────────────────────────────────

function NewConversationDialog({
  open,
  onOpenChange,
  vendorId,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  onStarted: (conversationId: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const reset = () => {
    setEmail("");
    setName("");
    setMessage("");
  };

  const validEmail = /\S+@\S+\.\S+/.test(email.trim());
  const valid = validEmail && message.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please enter a valid email and a message.");
      return;
    }
    setSubmitting(true);
    try {
      // NOTE: The /api/messages POST endpoint accepts recipientId directly
      // (it doesn't validate against the users table). We use the customer's
      // email as the recipientId so the conversation thread is addressable
      // and consistent when the customer later logs in with that email.
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "customer",
          recipientId: email.trim().toLowerCase(),
          content: message.trim(),
          vendorId,
          senderName: name.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `Request failed (${res.status})`,
        );
      }
      const data = (await res.json()) as { conversation?: { id: string } };
      toast.success("Conversation started", {
        description: `Your message has been sent to ${email.trim()}.`,
      });
      const convId = data.conversation?.id;
      reset();
      if (convId) onStarted(convId);
      else onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) {
          onOpenChange(o);
          if (!o) reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new conversation</DialogTitle>
          <DialogDescription>
            Send a message to a customer by email. They&apos;ll be able to reply
            from their inbox.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nc-name" className="text-xs font-semibold">
              Your name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="nc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sweet Dreams Bakery"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nc-email" className="text-xs font-semibold">
              Customer email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="nc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="h-10 pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nc-message" className="text-xs font-semibold">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="nc-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! Thanks for your enquiry. Here's what I can offer…"
              rows={4}
              className="resize-none"
              required
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-brand-soft/40 p-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
            <span>
              Conversations are private between you and the customer. The
              customer will receive a notification of your message.
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !valid}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty + loading states
// ─────────────────────────────────────────────────────────────────────────────

function EmptyConversations({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-brand-soft">
        <MessageCircle className="size-6 text-brand" />
      </div>
      <p className="mt-3 text-sm font-semibold">
        {hasAny ? "No conversations match your search" : "No messages yet"}
      </p>
      <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">
        {hasAny
          ? "Try a different keyword or clear the search."
          : "Customers who enquire will appear here."}
      </p>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-brand-soft">
        <User className="size-7 text-brand" />
      </div>
      <p className="mt-3 text-sm font-semibold">Select a conversation</p>
      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
        Choose a conversation from the list to start chatting with your customer.
      </p>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-3/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MessageListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex",
            i % 2 === 0 ? "justify-start" : "justify-end",
          )}
        >
          <Skeleton
            className={cn(
              "h-12 rounded-2xl",
              i % 2 === 0 ? "w-2/3 rounded-bl-md" : "w-1/2 rounded-br-md",
            )}
          />
        </div>
      ))}
    </div>
  );
}
