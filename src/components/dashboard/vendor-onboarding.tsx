"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Sparkles, Store, Settings, Package, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  section: string;
  action?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
  completed: number;
  total: number;
}

interface OnboardingState {
  completion: number;
  level: string;
  levelLabel: string;
  sections: ChecklistSection[];
  nextStep: ChecklistItem | null;
  nextSectionId: string | null;
  totalItems: number;
  completedItems: number;
  isLive: boolean;
}

const SECTION_ICONS: Record<string, any> = {
  listing: Store,
  settings: Settings,
  products: Package,
};

const PROGRESS_COLORS = {
  getting_started: "bg-amber-500",
  halfway: "bg-blue-500",
  almost_ready: "bg-emerald-500",
  live: "bg-emerald-600",
};

export function VendorOnboarding({ vendorId, onNavigate }: { vendorId: string; onNavigate: (tab: string) => void }) {
  const [state, setState] = React.useState<OnboardingState | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/onboarding");
      if (!res.ok) return;
      const data = await res.json();
      setState(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="h-6 w-64 rounded bg-muted mb-4" />
        <div className="h-3 w-full rounded bg-muted mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!state) return null;

  // If 100% complete, show a compact success banner
  if (state.completion >= 100) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-emerald-500">
            <Trophy className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900">Your Business Is Live!</h3>
            <p className="text-sm text-emerald-700">Your profile is 100% complete. You're visible to customers.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const progressColor = PROGRESS_COLORS[state.level as keyof typeof PROGRESS_COLORS] || "bg-amber-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="size-5 text-[#FF6B35]" />
          <h2 className="text-lg font-bold text-foreground">Complete Your Business Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete the steps below to publish your business and start receiving customer enquiries.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Profile Completion
          </span>
          <span className="text-lg font-bold text-foreground">{state.completion}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full", progressColor)}
            initial={{ width: 0 }}
            animate={{ width: `${state.completion}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{state.levelLabel}</span>
          <span className="text-xs text-muted-foreground">{state.completedItems}/{state.totalItems} tasks done</span>
        </div>
      </div>

      {/* Checklist sections */}
      <div className="space-y-4">
        {state.sections.map((section, idx) => {
          const Icon = SECTION_ICONS[section.id] || Store;
          const allDone = section.completed === section.total;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                allDone ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background"
              )}
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "grid size-7 place-items-center rounded-full",
                    allDone ? "bg-emerald-500" : "bg-muted"
                  )}>
                    {allDone ? (
                      <Check className="size-4 text-white" />
                    ) : (
                      <Icon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  allDone ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {section.completed}/{section.total}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {section.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      item.completed ? "text-muted-foreground" : "text-foreground hover:bg-muted/30 cursor-pointer"
                    )}
                    onClick={() => !item.completed && item.action && onNavigate(item.action)}
                  >
                    <div className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                      item.completed
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-muted-foreground/30"
                    )}>
                      {item.completed && <Check className="size-3 text-white" />}
                    </div>
                    <span className={cn(item.completed && "line-through opacity-60")}>
                      {item.label}
                    </span>
                    {!item.completed && item.action && (
                      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Setup button */}
      {state.nextStep && (
        <Button
          onClick={() => state.nextSectionId && onNavigate(state.nextSectionId)}
          className="mt-5 w-full gap-2 bg-[#FF6B35] text-white hover:bg-[#e85a2a]"
          size="lg"
        >
          Continue Setup
          <ArrowRight className="size-4" />
        </Button>
      )}

      {/* Subscription nudge at 80%+ */}
      {state.completion >= 80 && state.completion < 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900">Want more visibility?</p>
              <p className="mt-0.5 text-xs text-purple-700">
                Upgrade to Pro for Featured Listing, Verified Badge, Priority Search, Analytics, and more.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={() => onNavigate("billing")}
              >
                View Plans
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
