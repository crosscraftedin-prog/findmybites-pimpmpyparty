import {
  BadgeCheck, MessageSquare, Globe2, ShieldCheck, Star, Users,
} from "lucide-react";

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: "Verified Businesses", desc: "Every vendor is vetted" },
  { icon: MessageSquare, label: "Direct Vendor Contact", desc: "Chat with no middlemen" },
  { icon: ShieldCheck, label: "Secure Messaging", desc: "Private & protected" },
  { icon: Globe2, label: "Global Marketplace", desc: "6 continents covered" },
  { icon: Star, label: "Customer Reviews", desc: "Real, verified feedback" },
  { icon: Users, label: "No Middlemen", desc: "Book directly, save more" },
];

export function TrustStrip() {
  return (
    <section className="border-b border-border bg-background" aria-label="Why customers trust us">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                
                
                
                
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 transition-colors hover:border-brand/30"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{item.label}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
