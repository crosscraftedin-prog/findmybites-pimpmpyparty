export const metadata = {
  title: "About Us — FindMyBites × PimpMyParty",
  description: "Learn about FindMyBites × PimpMyParty — the world's dual marketplace for food artisans and event vendors.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">About FindMyBites × PimpMyParty</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We're building the world's first dual marketplace for food and event vendors.
        </p>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">FindMyBites</strong> connects customers with
            food artisans — bakers, cake artists, caterers, private chefs, food trucks, and
            specialty food makers — across 6 continents.
          </p>
          <p>
            <strong className="text-foreground">PimpMyParty</strong> connects hosts and planners
            with event vendors — photographers, DJs, decorators, venues, florists, entertainers,
            and more — for unforgettable celebrations.
          </p>
          <p>
            Founded in 2024, our mission is simple: <strong className="text-foreground">zero
            commission, always</strong>. Vendors keep 100% of their earnings. Customers find
            verified, reviewed vendors in seconds. No middleman, no hidden fees.
          </p>
          <p>
            We operate in <strong className="text-foreground">62+ countries</strong> and are
            growing fast. Whether you're planning a wedding in Mumbai, a birthday in New York,
            or a corporate event in Dubai — we've got you covered.
          </p>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="text-lg font-bold">Our Values</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>✓ Zero commission — vendors keep everything they earn</li>
            <li>✓ Verified vendors only — every listing is reviewed</li>
            <li>✓ WhatsApp direct booking — no app downloads needed</li>
            <li>✓ Global reach — list once, get discovered worldwide</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
