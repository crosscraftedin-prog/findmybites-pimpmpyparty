"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Bot, Lightbulb } from "lucide-react";

const CORAL = "#D85A30";
const PURPLE = "#7F77DD";

const SEARCH_INTENTS = [
  { term: "wedding cake", count: 45 },
  { term: "DJ Dubai", count: 38 },
  { term: "private chef", count: 32 },
  { term: "birthday party", count: 28 },
  { term: "photographer", count: 24 },
  { term: "catering", count: 21 },
  { term: "decorator", count: 18 },
  { term: "venue", count: 15 },
  { term: "florist", count: 12 },
  { term: "food truck", count: 9 },
];

const CONVERSATIONS = [
  { date: "Today", customer: "Anonymous", eventType: "Birthday", location: "Dubai", budget: "AED 500", vendorsShown: 3, outcome: "Quote requested" },
  { date: "Today", customer: "Anonymous", eventType: "Wedding", location: "Mumbai", budget: "₹50,000", vendorsShown: 5, outcome: "Browsed" },
  { date: "Yesterday", customer: "Anonymous", eventType: "Corporate", location: "London", budget: "£2,000", vendorsShown: 4, outcome: "Quote requested" },
  { date: "Yesterday", customer: "Anonymous", eventType: "Kids party", location: "Dubai", budget: "AED 800", vendorsShown: 3, outcome: "Browsed" },
  { date: "2 days ago", customer: "Anonymous", eventType: "Birthday", location: "Paris", budget: "€300", vendorsShown: 2, outcome: "Browsed" },
];

export function JoshLogsSection() {
  const [filterOutcome, setFilterOutcome] = React.useState("all");
  const [filterLocation, setFilterLocation] = React.useState("");

  const filtered = CONVERSATIONS.filter((c) => {
    if (filterOutcome !== "all" && c.outcome.toLowerCase() !== filterOutcome) return false;
    if (filterLocation && !c.location.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h2 className="mb-4 text-[15px] font-medium">🤖 Josh AI Logs</h2>

      {/* A) Search insights bar chart */}
      <div className="mb-5 rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
        <h3 className="mb-3 text-[13px] font-medium">Top Search Intents This Week</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={SEARCH_INTENTS} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid horizontal={false} stroke="rgba(136,135,128,0.15)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#888780" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="term" tick={{ fontSize: 11, fill: "#888780" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.12)" }} />
            <Bar dataKey="count" name="Searches" fill={CORAL} radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* C) Insights summary */}
      <div className="mb-5 rounded-xl p-4" style={{ background: "#FAECE7", border: "0.5px solid #F0997B" }}>
        <div className="flex items-start gap-2">
          <Lightbulb className="size-4 shrink-0 text-brand" style={{ color: CORAL }} />
          <p className="text-[12px]" style={{ color: "#993C1D" }}>
            💡 This week: Most searched city was <strong>Dubai</strong>. Most requested category
            was <strong>Photography</strong>. Average budget mentioned was <strong>AED 800</strong>.
          </p>
        </div>
      </div>

      {/* B) Conversation log table */}
      <div className="rounded-xl bg-white p-4" style={{ border: "0.5px solid rgba(0,0,0,0.12)" }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-medium">Conversation Log</h3>
          <div className="flex gap-2">
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="h-8 rounded-lg border border-black/10 px-2 text-[11px]"
            >
              <option value="all">All outcomes</option>
              <option value="browsed">Browsed</option>
              <option value="quote requested">Quote requested</option>
              <option value="booked">Booked</option>
            </select>
            <input
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              placeholder="Filter by city..."
              className="h-8 w-32 rounded-lg border border-black/10 px-2 text-[11px]"
            />
            <button className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1 text-[11px] font-medium hover:bg-muted/50">
              <Download className="size-3.5" />
              CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-black/10 text-left text-muted-foreground">
                <th className="pb-1.5 pr-3 font-medium">Date</th>
                <th className="pb-1.5 pr-3 font-medium">Customer</th>
                <th className="pb-1.5 pr-3 font-medium">Event type</th>
                <th className="pb-1.5 pr-3 font-medium">Location</th>
                <th className="pb-1.5 pr-3 font-medium">Budget</th>
                <th className="pb-1.5 pr-3 font-medium">Vendors shown</th>
                <th className="pb-1.5 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{c.date}</td>
                  <td className="py-1.5 pr-3">{c.customer}</td>
                  <td className="py-1.5 pr-3">{c.eventType}</td>
                  <td className="py-1.5 pr-3">{c.location}</td>
                  <td className="py-1.5 pr-3">{c.budget}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.vendorsShown}</td>
                  <td className="py-1.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${c.outcome === "Quote requested" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {c.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-[11px] text-muted-foreground">No conversations match your filters.</p>
        )}
      </div>
    </div>
  );
}
