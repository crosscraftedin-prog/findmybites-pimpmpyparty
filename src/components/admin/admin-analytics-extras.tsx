"use client";

import * as React from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CORAL = "#D85A30";
const PURPLE = "#7F77DD";

// ── ADD 1: MRR Chart ──────────────────────────────────────────────────────
const MRR_DATA = [
  { month: "Jul", food: 120, party: 80 },
  { month: "Aug", food: 150, party: 95 },
  { month: "Sep", food: 180, party: 110 },
  { month: "Oct", food: 200, party: 130 },
  { month: "Nov", food: 220, party: 145 },
  { month: "Dec", food: 250, party: 160 },
  { month: "Jan", food: 280, party: 180 },
  { month: "Feb", food: 300, party: 200 },
  { month: "Mar", food: 320, party: 220 },
  { month: "Apr", food: 350, party: 240 },
  { month: "May", food: 380, party: 260 },
  { month: "Jun", food: 420, party: 290 },
];

export function MRRChart() {
  const thisMonth = MRR_DATA[MRR_DATA.length - 1];
  const lastMonth = MRR_DATA[MRR_DATA.length - 2];
  const thisTotal = thisMonth.food + thisMonth.party;
  const lastTotal = lastMonth.food + lastMonth.party;
  const growth = (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1);

  return (
    <div className="mt-5 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Monthly Recurring Revenue</h2>
        <div className="flex gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: CORAL }} />FindMyBites</span>
          <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: PURPLE }} />PimpMyParty</span>
        </div>
      </div>
      <div className="mb-3 flex gap-4 text-[11px] text-muted-foreground">
        <span>This month: <strong className="text-foreground">${thisTotal}</strong></span>
        <span>Last month: <strong className="text-foreground">${lastTotal}</strong></span>
        <span style={{ color: "#3B6D11" }}>Growth: +{growth}%</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={MRR_DATA}>
          <CartesianGrid vertical={false} stroke="rgba(136,135,128,0.15)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888780" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#888780" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.12)" }} formatter={(v: number) => `$${v}`} />
          <Line type="monotone" dataKey="food" name="FindMyBites" stroke={CORAL} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="party" name="PimpMyParty" stroke={PURPLE} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── ADD 2: Vendors by Country (heatmap + top 10 table) ────────────────────
const COUNTRY_DATA = [
  { country: "India", code: "IN", flag: "🇮🇳", food: 8, events: 5 },
  { country: "UAE", code: "AE", flag: "🇦🇪", food: 6, events: 4 },
  { country: "United Kingdom", code: "GB", flag: "🇬🇧", food: 4, events: 3 },
  { country: "United States", code: "US", flag: "🇺🇸", food: 3, events: 4 },
  { country: "France", code: "FR", flag: "🇫🇷", food: 2, events: 1 },
  { country: "Nigeria", code: "NG", flag: "🇳🇬", food: 2, events: 2 },
  { country: "Australia", code: "AU", flag: "🇦🇺", food: 1, events: 2 },
  { country: "South Africa", code: "ZA", flag: "🇿🇦", food: 1, events: 1 },
  { country: "Italy", code: "IT", flag: "🇮🇹", food: 1, events: 0 },
  { country: "Mexico", code: "MX", flag: "🇲🇽", food: 1, events: 0 },
];

const totalVendors = COUNTRY_DATA.reduce((acc, c) => acc + c.food + c.events, 0);

export function CountryMap() {
  const maxVendors = Math.max(...COUNTRY_DATA.map((c) => c.food + c.events));
  return (
    <div className="mt-5 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
      <h2 className="mb-3 text-[13px] font-medium">Vendors by Country</h2>
      {/* Simplified heatmap: colored grid of country pills */}
      <div className="flex flex-wrap gap-2">
        {COUNTRY_DATA.map((c) => {
          const total = c.food + c.events;
          const intensity = total / maxVendors;
          const bg = `rgba(216, 90, 48, ${0.15 + intensity * 0.7})`;
          return (
            <div
              key={c.code}
              title={`${c.country}: ${c.food} food vendors, ${c.events} event vendors`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
              style={{ background: bg, color: intensity > 0.5 ? "#fff" : "#000" }}
            >
              <span>{c.flag}</span>
              <span>{c.country}</span>
              <span className="opacity-70">{total}</span>
            </div>
          );
        })}
      </div>
      {/* Top 10 table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-black/10 text-left text-muted-foreground">
              <th className="pb-1.5 pr-3 font-medium">Country</th>
              <th className="pb-1.5 pr-3 font-medium">Food</th>
              <th className="pb-1.5 pr-3 font-medium">Events</th>
              <th className="pb-1.5 pr-3 font-medium">Total</th>
              <th className="pb-1.5 font-medium">% of all</th>
            </tr>
          </thead>
          <tbody>
            {COUNTRY_DATA.map((c) => {
              const total = c.food + c.events;
              const pct = ((total / totalVendors) * 100).toFixed(1);
              return (
                <tr key={c.code} className="border-b border-black/5">
                  <td className="py-1.5 pr-3">{c.flag} {c.country}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.food}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.events}</td>
                  <td className="py-1.5 pr-3 font-semibold tabular-nums">{total}</td>
                  <td className="py-1.5 tabular-nums text-muted-foreground">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ADD 7: Conversion Funnel ──────────────────────────────────────────────
const FUNNEL_STEPS = [
  { icon: "👁", label: "Site visitors this month", value: 4820, color: "#3B6D11" },
  { icon: "📋", label: "Vendor signups started", value: 340, color: "#D97706" },
  { icon: "✅", label: "Listings published", value: 185, color: "#D97706" },
  { icon: "⭐", label: "Upgraded to paid", value: 62, color: "#A32D2D" },
];

export function ConversionFunnel() {
  return (
    <div className="mt-5 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
      <h2 className="mb-4 text-[13px] font-medium">Conversion Funnel</h2>
      <div className="space-y-2">
        {FUNNEL_STEPS.map((step, i) => {
          const prevValue = i > 0 ? FUNNEL_STEPS[i - 1].value : step.value;
          const convRate = i > 0 ? ((step.value / prevValue) * 100).toFixed(1) : "100";
          const widthPct = (step.value / FUNNEL_STEPS[0].value) * 100;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 text-center text-lg">{step.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium">{step.label}</span>
                  <span className="tabular-nums">
                    <strong>{step.value.toLocaleString()}</strong>
                    {i > 0 && <span className="ml-1.5 text-muted-foreground">({convRate}%)</span>}
                  </span>
                </div>
                <div className="mt-1 h-6 overflow-hidden rounded-md bg-muted" style={{ width: "100%" }}>
                  <div
                    className="flex h-full items-center justify-end rounded-md px-2 text-[10px] font-bold text-white"
                    style={{ width: `${Math.max(widthPct, 5)}%`, background: step.color }}
                  >
                    {step.value.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg p-3 text-[11px]" style={{ background: "#FAECE7", color: "#993C1D" }}>
        💡 Insight: 45.6% of vendors who start signup don&apos;t publish. Consider sending a
        reminder email at step 2.
      </div>
    </div>
  );
}
