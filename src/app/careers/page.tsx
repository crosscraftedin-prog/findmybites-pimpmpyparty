export const metadata = {
  title: "Careers — FindMyBites × PimpMyParty",
  description: "Join the FindMyBites × PimpMyParty team.",
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Careers</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Help us build the world's best food and event vendor marketplace.
        </p>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            We're a fast-growing marketplace connecting food artisans and event vendors
            with customers across 62+ countries. Our mission is simple: zero commission,
            always. Vendors keep 100% of what they earn.
          </p>
          <p>
            We're looking for passionate people who want to help vendors succeed and
            make every celebration unforgettable.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-base font-medium">No open positions right now</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We're growing fast and always looking for great talent. Send your resume to{" "}
            <a href="mailto:careers@findmybites.com" className="text-brand hover:underline">careers@findmybites.com</a>
            {" "}and we'll reach out when something opens up.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold">What we value</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>🚀 Speed — ship fast, learn faster</li>
            <li>❤️ Vendor-first — every decision starts with "does this help vendors?"</li>
            <li>🌍 Global — we think across borders, cultures, and currencies</li>
            <li>🤝 Trust — zero commission means we earn trust, not fees</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
