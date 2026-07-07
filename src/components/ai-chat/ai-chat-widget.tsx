"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { isMarketplacePage } from "@/lib/ai-route-helper";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  Star,
  MapPin,
  Zap,
  Loader2,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { useCategoryLabels } from "@/hooks/use-category-labels";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────

/** A ready-to-render vendor card from the backend (no AI parsing required). */
interface ChatVendorCard {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  city: string;
  country: string;
  countryCode: string;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  basePrice: number;
  currency: string;
  featured: boolean;
  verified: boolean;
  tags: string[];
  ecosystem: string;
  whatsapp: string | null;
  heroImage: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  responseTime: string;
  matchReason: string;
}

/** A next-step suggestion chip. */
interface ChatSuggestion {
  label: string;
  href?: string;
  action?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Structured vendor cards rendered below the message (from backend search). */
  cards?: ChatVendorCard[];
  /** Next-step suggestion chips rendered below the cards. */
  suggestions?: ChatSuggestion[];
  /** The backend-computed action for this message. */
  action?: string;
}

// ── Main widget ──────────────────────────────────────────────────────────

export function AIChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  // ── Route-aware: only show on marketplace pages (not vendor/product/dashboard) ──
  const pathname = usePathname();
  const showWidget = isMarketplacePage(pathname);

  React.useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 3000);
    const hide = setTimeout(() => setShowTooltip(false), 10000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, []);

  // ── Listen for external "open Josh chat" triggers ──
  React.useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setShowTooltip(false);
    };
    window.addEventListener("open-josh-chat", handleOpen as EventListener);
    return () => window.removeEventListener("open-josh-chat", handleOpen as EventListener);
  }, []);

  // ── Don't render on vendor/product/dashboard pages ──
  if (!showWidget) return null;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="relative max-w-[200px] rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-lg"
            >
              Plan my event with AI
              <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rotate-45 border-r border-b border-border bg-card" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setOpen((v) => !v);
            setShowTooltip(false);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Plan my event with AI"
          className="relative grid size-14 place-items-center rounded-full bg-[#FF6B35] text-white shadow-xl shadow-[#FF6B35]/30 transition-shadow hover:shadow-2xl hover:shadow-[#FF6B35]/40"
        >
          <Sparkles className="size-6" />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-foreground px-1 text-[9px] font-bold text-white">
            AI
          </span>
          {!open && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[#FF6B35] opacity-20" />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {open && <ChatWindow onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Chat window ──────────────────────────────────────────────────────────

function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! 👋 I'm Josh, your personal event planner. Tell me what you're celebrating and I'll sort everything out for you!",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Stable user ID (persists in localStorage so conversations are remembered)
  const userId = React.useMemo(() => {
    if (typeof window === "undefined") return "guest";
    let id = localStorage.getItem("josh:userId");
    if (!id) {
      id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("josh:userId", id);
    }
    return id;
  }, []);

  // Restore conversation history on mount (so Josh remembers across sessions)
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/josh/chat?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.conversationId) setConversationId(data.conversationId);
          if (data.messages && data.messages.length > 0) {
            // Restore messages (skip the welcome msg — replaced by history)
            const restored: ChatMessage[] = data.messages.map(
              (m: { role: string; content: string }, i: number) => ({
                id: `restored-${i}`,
                role: m.role as "user" | "assistant",
                content: m.content,
              })
            );
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content:
                  "Welcome back! 👋 I remember our last conversation. How can I help you today?",
              },
              ...restored,
            ]);
          }
        }
      } catch {
        // network error — skip restore
      }
    })();
  }, [userId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/josh/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationId: conversationId ?? undefined,
          userId,
          userType: "customer",
        }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      // Track conversation ID for persistence
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // V4 PRODUCTION: render from structured fields, NOT from parsed AI text.
      // The backend returns `cards` (ready-to-render vendor cards) and
      // `suggestions` (next-step chips) directly. The frontend NEVER parses
      // JSON from the assistant message text.
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.message || "Hmm, I didn't catch that. Could you say more?",
        cards: Array.isArray(data.cards) && data.cards.length > 0 ? data.cards : undefined,
        suggestions: Array.isArray(data.suggestions) && data.suggestions.length > 0 ? data.suggestions : undefined,
        action: data.action,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "Oops, I couldn't reach my brain right now 😅 Could you try again in a moment?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.96 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "fixed z-50 flex flex-col bg-card shadow-2xl",
        "inset-0 sm:inset-auto",
        "sm:bottom-5 sm:right-5 sm:h-[520px] sm:w-[380px] sm:rounded-3xl sm:border sm:border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-[#FF6B35] px-4 py-3 text-white sm:rounded-t-3xl">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-full bg-white/20 backdrop-blur">
            <PartyPopper className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">
              👋 Josh — Your Event Planner
            </p>
            <p className="text-[11px] leading-tight text-white/80">
              Hi! I&apos;m Josh. Tell me about your event and I&apos;ll find the
              perfect vendors for you
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="grid size-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onSuggestionClick={(s) => sendMessage(s.label)} />
        ))}
        {loading && <TypingIndicator />}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-card p-3 sm:rounded-b-3xl">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Josh about your event…"
          disabled={loading}
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FF6B35] text-white transition-colors hover:bg-[#e85a2a] disabled:opacity-40"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </form>
    </motion.div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────

function MessageBubble({ message, onSuggestionClick }: { message: ChatMessage; onSuggestionClick?: (suggestion: ChatSuggestion) => void }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%] space-y-3">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm",
            isUser
              ? "rounded-br-md bg-[#FF6B35] text-white"
              : "rounded-bl-md border border-border bg-card text-foreground"
          )}
        >
          {message.content}
        </div>
        {/* Structured vendor cards from the backend (no AI-text parsing) */}
        {message.cards && message.cards.length > 0 && (
          <div className="space-y-2">
            {message.cards.map((v) => (
              <VendorChatCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
        {/* Next-step suggestion chips */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.suggestions.map((s, i) =>
              s.href ? (
                <a
                  key={i}
                  href={s.href}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {s.label}
                </a>
              ) : (
                <button
                  key={i}
                  onClick={() => onSuggestionClick?.(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {s.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vendor card ──────────────────────────────────────────────────────────

function VendorChatCard({ vendor }: { vendor: ChatVendorCard }) {
  const { getCategory } = useCategoryLabels();
  const cat = getCategory(vendor.category);
  const matchReason = vendor.matchReason || vendor.tagline;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex gap-2.5 p-2.5">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {vendor.heroImage ? (
            <img src={vendor.heroImage} alt={vendor.name} className="h-full w-full object-cover" />
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", cat?.accent ?? "from-amber-400 to-orange-500")}>
              <Sparkles className="size-6 text-white/80" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="line-clamp-1 text-sm font-bold leading-tight">{vendor.name}</p>
            <div className="flex shrink-0 items-center gap-1">
              {vendor.featured && (
                <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700">⭐ Featured</span>
              )}
              {vendor.verified && (
                <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-700">✓ Verified</span>
              )}
            </div>
          </div>
          {cat && <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{cat.label}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Star className="size-2.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{vendor.rating.toFixed(1)}</span>
              <span>({vendor.reviewCount})</span>
            </span>
            <span className="flex items-center gap-0.5">
              <MapPin className="size-2.5" />
              {vendor.city}
            </span>
            <span className="font-semibold text-foreground">from {formatPrice(vendor.basePrice, vendor.currency)}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-[10px] italic text-muted-foreground">{matchReason}</p>
        </div>
      </div>
      <div className="flex gap-1.5 border-t border-border bg-muted/30 p-2">
        <a href={`/vendor/${vendor.slug}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold transition-colors hover:bg-accent">
          View Profile <ArrowRight className="size-3" />
        </a>
        <a href={`/vendor/${vendor.slug}#quote-form`} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#FF6B35] px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#e85a2a]">
          <Zap className="size-3" /> Request Quote
        </a>
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

// NOTE: V4 production refactor — removed parseAIResponse(), fetchVendorSuggestions(),
// and buildMatchReason(). The frontend now renders vendor cards and suggestions
// directly from the structured backend response fields (`data.cards`,
// `data.suggestions`). No JSON is parsed from assistant message text.
