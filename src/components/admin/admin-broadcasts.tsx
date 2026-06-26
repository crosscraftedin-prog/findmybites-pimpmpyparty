"use client";

import * as React from "react";
import { Loader2, Send, Mail, Bell, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const CORAL = "#D85A30";

export function BroadcastsSection() {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [target, setTarget] = React.useState("all");
  const [country, setCountry] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(true);
  const [sendInApp, setSendInApp] = React.useState(true);
  const [schedule, setSchedule] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [history, setHistory] = React.useState<any[]>([]);

  const recipientEstimate = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: 23,
      food: 11,
      party: 12,
      free: 18,
      paid: 5,
      country: 3,
      inactive: 7,
    };
    return counts[target] || 0;
  }, [target]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setHistory([
      { date: new Date().toISOString(), subject, recipients: recipientEstimate, target, status: "Sent" },
      ...history,
    ]);
    toast.success(`Broadcast sent to ${recipientEstimate} vendors`);
    setSubject("");
    setBody("");
    setSending(false);
  };

  const targets = [
    { id: "all", label: "All vendors" },
    { id: "food", label: "FindMyBites vendors only" },
    { id: "party", label: "PimpMyParty vendors only" },
    { id: "free", label: "Free plan vendors only" },
    { id: "paid", label: "Paid vendors only" },
    { id: "country", label: "Vendors in specific country" },
    { id: "inactive", label: "Vendors with 0 enquiries (inactive)" },
  ];

  return (
    <div>
      <h2 className="mb-4 text-[15px] font-medium">📢 Broadcasts</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Compose */}
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="mb-3 text-[13px] font-medium">Compose Broadcast</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New feature: AI-powered suggestions"
                className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message..."
                rows={5}
                className="mt-1 w-full resize-none rounded-lg border border-black/10 p-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Target audience */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Target audience</label>
              <div className="mt-1 space-y-1">
                {targets.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-[12px]">
                    <input
                      type="radio"
                      checked={target === t.id}
                      onChange={() => setTarget(t.id)}
                      className="size-3.5"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              {target === "country" && (
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px]"
                >
                  <option value="">Select country...</option>
                  <option value="AE">🇦🇪 UAE</option>
                  <option value="IN">🇮🇳 India</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="US">🇺🇸 United States</option>
                </select>
              )}
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-muted/30 p-2 text-[11px] text-muted-foreground">
              This will send to <strong className="text-foreground">{recipientEstimate}</strong> vendors
            </div>

            {/* Delivery methods */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Delivery method</label>
              <div className="mt-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="size-3.5" />
                  <Mail className="size-3.5 text-muted-foreground" /> Email
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={sendInApp} onChange={(e) => setSendInApp(e.target.checked)} className="size-3.5" />
                  <Bell className="size-3.5 text-muted-foreground" /> In-app notification (bell icon)
                </label>
                <label className="flex items-center gap-2 text-[12px] text-muted-foreground/50">
                  <input type="checkbox" disabled className="size-3.5" />
                  <MessageCircle className="size-3.5" /> WhatsApp (coming soon)
                </label>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Schedule (optional)</label>
              <div className="mt-1 flex gap-2">
                <button onClick={() => setSchedule("")} className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ${!schedule ? "bg-brand text-white" : "border border-black/10"}`}>Send now</button>
                <input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="h-9 rounded-lg border border-black/10 px-2 text-[11px]" />
              </div>
            </div>

            <button
              onClick={send}
              disabled={sending}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium text-white"
              style={{ background: CORAL }}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {schedule ? "Schedule Broadcast" : "Send Now"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="mb-3 text-[13px] font-medium">Sent Broadcasts</h3>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-black/10 text-left text-muted-foreground">
                    <th className="pb-1.5 pr-2 font-medium">Date</th>
                    <th className="pb-1.5 pr-2 font-medium">Subject</th>
                    <th className="pb-1.5 pr-2 font-medium">Recipients</th>
                    <th className="pb-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="py-1.5 pr-2">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="py-1.5 pr-2">{h.subject}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{h.recipients}</td>
                      <td className="py-1.5"><span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">{h.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-[11px] text-muted-foreground">No broadcasts sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
