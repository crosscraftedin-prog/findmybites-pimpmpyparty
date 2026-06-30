"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorAIChatProps {
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorCity: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What products do you offer?",
  "Do you deliver?",
  "What's your most popular package?",
  "Can you customize for dietary needs?",
];

export function VendorAIChat({ vendorId, vendorName, vendorCategory, vendorCity }: VendorAIChatProps) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: String(Date.now()), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/josh/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: `vendor-visitor-${vendorId}`,
          userType: "customer",
          vendorId,
          vendorContext: { vendorId, vendorName, vendorCategory, vendorCity },
        }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: data.reply || data.response || "I'd be happy to help! Contact the vendor directly for specific questions.",
      };
      setMessages((m) => [...m, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Sorry, I couldn't connect right now. Please contact the vendor directly using the form on the right.",
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground shadow-xl transition-transform hover:scale-105"
          >
            <Sparkles className="size-5" />
            Ask Josh AI
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-40 flex h-[500px] max-h-[80vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-brand p-4 text-brand-foreground">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-white/20">
                  <Bot className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Josh AI</p>
                  <p className="text-[10px] opacity-80">Ask about {vendorName}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid size-8 place-items-center rounded-full transition-colors hover:bg-white/20"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-muted p-3 text-sm">
                    <p className="font-semibold">Hi! I'm Josh, your AI assistant. 🎉</p>
                    <p className="mt-1 text-muted-foreground">
                      I can answer questions about {vendorName}'s products, services, pricing, and availability.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Suggested questions
                    </p>
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-brand text-brand-foreground"
                        : "bg-muted"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2">
                    <Loader2 className="size-3 animate-spin" />
                    <span className="text-xs text-muted-foreground">Josh is typing…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Josh anything…"
                className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
