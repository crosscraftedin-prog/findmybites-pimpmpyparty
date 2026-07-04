"use client";

import * as React from "react";
import {
  Package, Boxes, CalendarDays, Clock, AlertTriangle, Bell, ShieldAlert,
  Truck, MapPin, CalendarPlus, Trash2, Loader2, Save, Check, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  StatusBadge,
} from "./status-badge";
import {
  PRODUCT_STATUSES, STATUS_META, PREPARATION_TIMES, BOOKING_NOTICE_PRESETS,
  AVAILABILITY_MODES, WEEKDAY_OPTIONS, SERVICE_AREA_TYPES, BLOCK_TYPES,
  parseArr, fmtDate, toDateInput, statusMeta,
} from "@/lib/inventory/constants";

interface InventoryManagerProps {
  productId: string;
  productName: string;
  ecosystem?: string | null;
  onClose?: () => void;
}

interface InventoryState {
  status: string;
  stockType: string;
  stockCount: number | null;
  lowStockThreshold: number;
  maxOrdersPerDay: number | null;
  availabilityMode: string;
  availableDays: string[];
  availabilityStart: string | null;
  availabilityEnd: string | null;
  preparationTimeCategory: string | null;
  preparationTimeCustom: string | null;
  bookingNoticeHours: number | null;
  serviceAreaType: string | null;
  serviceCities: string[];
  seasonLabel: string | null;
}

interface Block {
  id: string;
  blockType: string;
  startDate: string;
  endDate: string;
  note: string | null;
}

/**
 * Full per-product Inventory & Availability editor.
 * Six sections in a tabbed, mobile-friendly layout:
 *   1. Inventory (stock + status)
 *   2. Availability (mode + days/range)
 *   3. Preparation & Booking (prep time, notice, max orders)
 *   4. Service Area (PimpMyParty packages)
 *   5. Calendar (blocked dates)
 *   6. Live Preview (customer view)
 */
export function InventoryManager({ productId, productName, ecosystem, onClose }: InventoryManagerProps) {
  const isParty = ecosystem === "PIMPMYPARTY";
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [state, setState] = React.useState<InventoryState>({
    status: "active", stockType: "unlimited", stockCount: null, lowStockThreshold: 10,
    maxOrdersPerDay: null, availabilityMode: "always", availableDays: [],
    availabilityStart: null, availabilityEnd: null, preparationTimeCategory: null,
    preparationTimeCustom: null, bookingNoticeHours: null, serviceAreaType: null,
    serviceCities: [], seasonLabel: null,
  });
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [stats, setStats] = React.useState<{ views: number; enquiryCount: number; orderCount: number; salesRevenue: number } | null>(null);

  // ── Load ──
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, calRes] = await Promise.all([
        fetch(`/api/vendor/products/${productId}/inventory`),
        fetch(`/api/vendor/products/${productId}/calendar`),
      ]);
      if (invRes.ok) {
        const inv = await invRes.json();
        const i = inv.inventory;
        if (i) {
          setState({
            status: i.status ?? "active",
            stockType: i.stockType ?? "unlimited",
            stockCount: i.stockCount ?? null,
            lowStockThreshold: i.lowStockThreshold ?? 10,
            maxOrdersPerDay: i.maxOrdersPerDay ?? null,
            availabilityMode: i.availabilityMode ?? "always",
            availableDays: parseArr<string>(i.availableDays),
            availabilityStart: i.availabilityStart,
            availabilityEnd: i.availabilityEnd,
            preparationTimeCategory: i.preparationTimeCategory ?? null,
            preparationTimeCustom: i.preparationTimeCustom ?? null,
            bookingNoticeHours: i.bookingNoticeHours ?? null,
            serviceAreaType: i.serviceAreaType ?? null,
            serviceCities: parseArr<string>(i.serviceCities),
            seasonLabel: i.seasonLabel ?? null,
          });
          setStats({ views: i.views ?? 0, enquiryCount: i.enquiryCount ?? 0, orderCount: i.orderCount ?? 0, salesRevenue: i.salesRevenue ?? 0 });
        }
      }
      if (calRes.ok) {
        const cal = await calRes.json();
        setBlocks(cal.blocks ?? []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  React.useEffect(() => { load(); }, [load]);

  const set = <K extends keyof InventoryState>(k: K, v: InventoryState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const toggleDay = (day: string) => {
    setState((s) => ({
      ...s,
      availableDays: s.availableDays.includes(day)
        ? s.availableDays.filter((d) => d !== day)
        : [...s.availableDays, day],
    }));
  };

  const addCity = (city: string) => {
    const c = city.trim();
    if (!c) return;
    setState((s) => ({ ...s, serviceCities: s.serviceCities.includes(c) ? s.serviceCities : [...s.serviceCities, c] }));
  };
  const removeCity = (city: string) =>
    setState((s) => ({ ...s, serviceCities: s.serviceCities.filter((c) => c !== city) }));

  // ── Save ──
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/products/${productId}/inventory`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Save failed");
      }
      toast.success("Inventory updated");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Calendar block actions ──
  const [newBlock, setNewBlock] = React.useState({ blockType: "holiday", startDate: "", endDate: "", note: "" });
  const [blockSaving, setBlockSaving] = React.useState(false);

  const addBlock = async () => {
    if (!newBlock.startDate) { toast.error("Pick a start date"); return; }
    setBlockSaving(true);
    try {
      const res = await fetch(`/api/vendor/products/${productId}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType: newBlock.blockType,
          startDate: newBlock.startDate,
          endDate: newBlock.endDate || newBlock.startDate,
          note: newBlock.note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add block");
      toast.success("Date blocked");
      setNewBlock({ blockType: "holiday", startDate: "", endDate: "", note: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBlockSaving(false);
    }
  };

  const removeBlock = async (blockId: string) => {
    try {
      await fetch(`/api/vendor/products/${productId}/calendar?blockId=${blockId}`, { method: "DELETE" });
      toast.success("Block removed");
      setBlocks((b) => b.filter((x) => x.id !== blockId));
    } catch {
      toast.error("Failed to remove block");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Boxes className="h-5 w-5 text-primary" />
            Inventory & Availability
          </h3>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={state.status} size="md" />
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Views" value={stats.views.toLocaleString()} />
          <MiniStat label="Enquiries" value={stats.enquiryCount.toLocaleString()} />
          <MiniStat label="Bookings" value={stats.orderCount.toLocaleString()} />
          <MiniStat label="Revenue" value={`₹${(stats.salesRevenue / 100).toLocaleString()}`} />
        </div>
      )}

      <Tabs defaultValue="inventory" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="flex w-max gap-1">
            <TabsTrigger value="inventory" className="gap-1.5"><Boxes className="h-4 w-4" />Inventory</TabsTrigger>
            <TabsTrigger value="availability" className="gap-1.5"><CalendarDays className="h-4 w-4" />Availability</TabsTrigger>
            <TabsTrigger value="prep" className="gap-1.5"><Clock className="h-4 w-4" />Prep & Notice</TabsTrigger>
            {isParty && (
              <TabsTrigger value="area" className="gap-1.5"><MapPin className="h-4 w-4" />Service Area</TabsTrigger>
            )}
            <TabsTrigger value="calendar" className="gap-1.5"><CalendarPlus className="h-4 w-4" />Calendar</TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5"><Package className="h-4 w-4" />Preview</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ── Inventory ── */}
        <TabsContent value="inventory" className="space-y-4">
          <Section title="Product Status" icon={<ShieldAlert className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">Control where this product appears in the marketplace.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRODUCT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-2.5 text-left text-sm transition hover:bg-accent",
                    state.status === s ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  <StatusBadge status={s} />
                  {state.status === s && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Stock" icon={<Boxes className="h-4 w-4" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Stock type</Label>
                <Select value={state.stockType} onValueChange={(v) => set("stockType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited Stock</SelectItem>
                    <SelectItem value="limited">Limited Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {state.stockType === "limited" && (
                <div className="space-y-2">
                  <Label>Quantity available</Label>
                  <Input
                    type="number" min={0}
                    value={state.stockCount ?? 0}
                    onChange={(e) => set("stockCount", Math.max(0, Number(e.target.value)))}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {state.stockCount && state.stockCount > 0
                      ? `${state.stockCount} ${productName.split(" ")[0]}s remaining`
                      : "Will show as Out of Stock"}
                  </p>
                </div>
              )}
            </div>
            {state.stockType === "limited" && (
              <div className="space-y-2">
                <Label>Low-stock alert threshold</Label>
                <Input
                  type="number" min={0}
                  value={state.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", Math.max(0, Number(e.target.value)))}
                  className="max-w-[160px]"
                />
                <p className="text-[11px] text-muted-foreground">You'll be alerted when stock drops below this number.</p>
              </div>
            )}
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
              When stock reaches zero, status auto-switches to <strong>Out of Stock</strong>. Inventory decreases automatically after confirmed orders.
            </div>
          </Section>
        </TabsContent>

        {/* ── Availability ── */}
        <TabsContent value="availability" className="space-y-4">
          <Section title="Availability Mode" icon={<CalendarDays className="h-4 w-4" />}>
            <div className="grid gap-2">
              {AVAILABILITY_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set("availabilityMode", m.value)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition hover:bg-accent",
                    state.availabilityMode === m.value ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  <div>
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground">{m.hint}</div>
                  </div>
                  {state.availabilityMode === m.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </Section>

          {state.availabilityMode === "selected_days" && (
            <Section title="Available Days" icon={<CalendarDays className="h-4 w-4" />}>
              <p className="text-xs text-muted-foreground">e.g. Wedding Package — Friday, Saturday, Sunday</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "h-10 w-12 rounded-lg border text-sm font-medium transition",
                      state.availableDays.includes(d.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {state.availabilityMode === "date_range" && (
            <Section title="Date Range" icon={<CalendarDays className="h-4 w-4" />}>
              <p className="text-xs text-muted-foreground">e.g. Christmas Cakes — 1 December to 31 December</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Available from</Label>
                  <Input
                    type="date"
                    value={toDateInput(state.availabilityStart)}
                    onChange={(e) => set("availabilityStart", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Available until</Label>
                  <Input
                    type="date"
                    value={toDateInput(state.availabilityEnd)}
                    onChange={(e) => set("availabilityEnd", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Season label (optional)</Label>
                <Input
                  placeholder="e.g. Christmas 2025"
                  value={state.seasonLabel ?? ""}
                  onChange={(e) => set("seasonLabel", e.target.value || null)}
                />
              </div>
            </Section>
          )}
        </TabsContent>

        {/* ── Preparation & Booking Notice ── */}
        <TabsContent value="prep" className="space-y-4">
          <Section title="Preparation Time" icon={<Clock className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">Shown on the public product page so customers know what to expect.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PREPARATION_TIMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("preparationTimeCategory", t.value)}
                  className={cn(
                    "rounded-lg border p-2.5 text-sm transition hover:bg-accent",
                    state.preparationTimeCategory === t.value ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {state.preparationTimeCategory === "custom" && (
              <div className="space-y-1.5">
                <Label>Custom preparation time</Label>
                <Input
                  placeholder="e.g. 3-5 days"
                  value={state.preparationTimeCustom ?? ""}
                  onChange={(e) => set("preparationTimeCustom", e.target.value || null)}
                />
              </div>
            )}
          </Section>

          <Section title="Booking Notice" icon={<Bell className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">Require advance notice. Customers cannot book earlier than this.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => set("bookingNoticeHours", null)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition hover:bg-accent",
                  state.bookingNoticeHours === null ? "border-primary ring-1 ring-primary" : "border-border"
                )}
              >
                No minimum
              </button>
              {BOOKING_NOTICE_PRESETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => set("bookingNoticeHours", b.hours)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition hover:bg-accent",
                    state.bookingNoticeHours === b.hours ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Maximum Orders Per Day" icon={<Package className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">e.g. 15 Birthday Cakes per day. Once reached, the product shows "Fully Booked".</p>
            <div className="flex items-center gap-3">
              <Switch
                checked={state.maxOrdersPerDay !== null}
                onCheckedChange={(c) => set("maxOrdersPerDay", c ? 10 : null)}
              />
              {state.maxOrdersPerDay !== null && (
                <Input
                  type="number" min={1}
                  value={state.maxOrdersPerDay}
                  onChange={(e) => set("maxOrdersPerDay", Math.max(1, Number(e.target.value)))}
                  className="max-w-[140px]"
                />
              )}
              <span className="text-sm text-muted-foreground">orders / day</span>
            </div>
          </Section>
        </TabsContent>

        {/* ── Service Area (PimpMyParty only) ── */}
        {isParty && (
          <TabsContent value="area" className="space-y-4">
            <Section title="Service Area" icon={<MapPin className="h-4 w-4" />}>
              <p className="text-xs text-muted-foreground">How far will you travel for this package?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SERVICE_AREA_TYPES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => set("serviceAreaType", a.value)}
                    className={cn(
                      "rounded-lg border p-2.5 text-sm transition hover:bg-accent",
                      state.serviceAreaType === a.value ? "border-primary ring-1 ring-primary" : "border-border"
                    )}
                  >
                    <Truck className="mb-1 h-4 w-4" />
                    {a.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Service Cities" icon={<MapPin className="h-4 w-4" />}>
              <p className="text-xs text-muted-foreground">Add multiple cities you serve.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Mumbai"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCity((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                    addCity(input.value); input.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {state.serviceCities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {state.serviceCities.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1">
                      {c}
                      <button onClick={() => removeCity(c)} className="ml-0.5 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </Section>
          </TabsContent>
        )}

        {/* ── Calendar ── */}
        <TabsContent value="calendar" className="space-y-4">
          <Section title="Availability Calendar" icon={<CalendarDays className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">Block dates for holidays, vacations, or when fully booked.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <Select value={newBlock.blockType} onValueChange={(v) => setNewBlock((b) => ({ ...b, blockType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={newBlock.startDate} onChange={(e) => setNewBlock((b) => ({ ...b, startDate: e.target.value }))} />
              <Input type="date" value={newBlock.endDate} onChange={(e) => setNewBlock((b) => ({ ...b, endDate: e.target.value }))} placeholder="end (optional)" />
              <Button type="button" onClick={addBlock} disabled={blockSaving}>
                {blockSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Block
              </Button>
            </div>
            <Input
              placeholder="Note (e.g. Diwali holiday)"
              value={newBlock.note}
              onChange={(e) => setNewBlock((b) => ({ ...b, note: e.target.value }))}
            />
          </Section>

          {blocks.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Blocked dates ({blocks.length})</h4>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {blocks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {fmtDate(b.startDate)}{b.endDate !== b.startDate ? ` → ${fmtDate(b.endDate)}` : ""}
                        </div>
                        <div className="text-[11px] text-muted-foreground capitalize">
                          {b.blockType.replace("_", " ")}{b.note ? ` · ${b.note}` : ""}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeBlock(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No blocked dates. Your calendar is open.
            </div>
          )}
        </TabsContent>

        {/* ── Live Preview ── */}
        <TabsContent value="preview" className="space-y-4">
          <Section title="Customer Preview" icon={<Package className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">This is what customers will see on your product page.</p>
            <CustomerPreview state={state} productName={productName} />
          </Section>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button variant="outline" onClick={load} disabled={saving}>Reset</Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2.5 text-center">
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function CustomerPreview({ state, productName }: { state: InventoryState; productName: string }) {
  const inStock = state.stockType === "unlimited" || (state.stockCount ?? 0) > 0;
  const lowStock = state.stockType === "limited" && (state.stockCount ?? 0) > 0 && (state.stockCount ?? 0) < state.lowStockThreshold;
  const prepLabel = state.preparationTimeCategory
    ? PREPARATION_TIMES.find((t) => t.value === state.preparationTimeCategory)?.label ?? (state.preparationTimeCategory === "custom" ? state.preparationTimeCustom : null)
    : null;

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">{productName}</h5>
        <StatusBadge status={state.status} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {state.status === "out_of_stock" || !inStock ? (
          <PreviewRow icon="❌" label="Out of Stock" tone="destructive" />
        ) : lowStock ? (
          <PreviewRow icon="⚠️" label={`Only ${state.stockCount} left`} tone="warning" />
        ) : (
          <PreviewRow icon="✓" label="Available" tone="success" />
        )}
        {prepLabel && <PreviewRow icon="🚚" label={`Prep: ${prepLabel}`} />}
        {state.bookingNoticeHours && (
          <PreviewRow icon="⏰" label={`Notice: ${state.bookingNoticeHours < 24 ? `${state.bookingNoticeHours}h` : `${Math.round(state.bookingNoticeHours / 24)}d`}`} />
        )}
        {state.availabilityMode === "selected_days" && state.availableDays.length > 0 && (
          <PreviewRow icon="📅" label={state.availableDays.join(", ")} />
        )}
        {state.availabilityMode === "date_range" && state.availabilityStart && (
          <PreviewRow icon="📅" label={`${fmtDate(state.availabilityStart)} → ${fmtDate(state.availabilityEnd)}`} />
        )}
        {state.serviceAreaType && <PreviewRow icon="📍" label={`Delivery: ${state.serviceAreaType}`} />}
      </div>
    </div>
  );
}

function PreviewRow({ icon, label, tone }: { icon: string; label: string; tone?: "success" | "warning" | "destructive" }) {
  const toneClass = tone === "success" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "warning" ? "text-amber-600 dark:text-amber-400"
    : tone === "destructive" ? "text-red-600 dark:text-red-400"
    : "text-muted-foreground";
  return (
    <div className={cn("flex items-center gap-2 text-sm", toneClass)}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
