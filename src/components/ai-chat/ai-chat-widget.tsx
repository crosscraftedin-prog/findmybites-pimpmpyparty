"use client";

import * as React from "react";
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
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { useCategoryLabels } from "@/hooks/use-category-labels";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  vendors?: ChatVendor[];
  action?: "request_all_quotes";
}

interface ChatVendor extends Vendor {
  distance: number | null;
  matchReason?: string;
}

interface ParsedAIResponse {
  text: string;
  vendorSuggestions?: {
    categories: string[];
    city: string;
    summary: string;
  };
  requestAllQuotes?: boolean;
}

// ── Main widget ──────────────────────────────────────────────────────────

export function AIChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 3000);
    const hide = setTimeout(() => setShowTooltip(false), 10000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, []);

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
      const aiText: string =
        data.message || data.response || "Hmm, I didn't catch that. Could you say more?";

      const parsed = parseAIResponse(aiText);

      let vendors: ChatVendor[] | undefined;
      if (parsed.vendorSuggestions) {
        vendors = await fetchVendorSuggestions(
          parsed.vendorSuggestions.categories,
          parsed.vendorSuggestions.city
        );
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: parsed.text,
        vendors,
        action: parsed.requestAllQuotes ? "request_all_quotes" : undefined,
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
          <MessageBubble key={m.id} message={m} />
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

function MessageBubble({ message }: { message: ChatMessage }) {
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
        {message.vendors && message.vendors.length > 0 && (
          <div className="space-y-2">
            {message.vendors.map((v) => (
              <VendorChatCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
        {message.action === "request_all_quotes" && (
          <div className="rounded-xl border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-3 text-center">
            <p className="text-xs font-medium text-foreground">
              I&apos;ll send your request to all suggested vendors at once! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vendor card ──────────────────────────────────────────────────────────

function VendorChatCard({ vendor }: { vendor: ChatVendor }) {
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
            {vendor.distance != null && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-2.5" />
                {vendor.distance < 1 ? `${Math.round(vendor.distance * 1000)} m away` : `${vendor.distance} km away`}
              </span>
            )}
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

// ── Helpers ──────────────────────────────────────────────────────────────

function parseAIResponse(raw: string): ParsedAIResponse {
  const result: ParsedAIResponse = { text: raw };
  // Match vendor_suggestions JSON blocks (may contain arrays, so allow nested)
  const jsonRegex = /\{"type"\s*:\s*"vendor_suggestions"[^]*?\}/g;
  const matches = raw.match(jsonRegex);

  if (matches) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match);
        if (parsed.type === "vendor_suggestions" && Array.isArray(parsed.categories)) {
          result.vendorSuggestions = {
            categories: parsed.categories.filter((c: unknown) => typeof c === "string"),
            city: typeof parsed.city === "string" ? parsed.city : "",
            summary: typeof parsed.summary === "string" ? parsed.summary : "",
          };
          // Remove the JSON block but KEEP everything else (including vendor
          // details the AI formatted after the JSON). If there's no other
          // text, use the summary.
          const withoutJson = result.text.replace(match, "").trim();
          result.text = withoutJson || parsed.summary || "";
        }
      } catch {}
    }
  }

  // Also handle request_all_quotes blocks
  const quoteRegex = /\{"type"\s*:\s*"request_all_quotes"\s*\}/g;
  const quoteMatches = raw.match(quoteRegex);
  if (quoteMatches) {
    result.requestAllQuotes = true;
    for (const match of quoteMatches) {
      result.text = result.text.replace(match, "").trim();
    }
  }

  result.text = result.text.replace(/\n{3,}/g, "\n\n").trim();
  return result;
}

async function fetchVendorSuggestions(categories: string[], city: string): Promise<ChatVendor[]> {
  try {
    const params = new URLSearchParams({ categories: categories.join(","), limit: "5" });
    if (city) params.set("city", city);
    const res = await fetch(`/api/chat/vendors?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.vendors ?? []).map((v: ChatVendor) => ({
      ...v,
      matchReason: buildMatchReason(v),
    }));
  } catch {
    return [];
  }
}

function buildMatchReason(vendor: ChatVendor): string {
  // Use title-cased slug as fallback (this is a pure function, can't use hooks)
  const catLabel = vendor.category
    ? vendor.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
  if (vendor.city && vendor.distance != null) return `${catLabel} near you in ${vendor.city}`;
  if (vendor.city) return `Great ${catLabel.toLowerCase()} in ${vendor.city}`;
  return `Top-rated ${catLabel.toLowerCase()}`;
}
