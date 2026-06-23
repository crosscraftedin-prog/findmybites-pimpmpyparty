export const metadata = {
  title: "Trust & Safety — FindMyBites × PimpMyParty",
  description: "How we keep FindMyBites × PimpMyParty safe for vendors and customers.",
};

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Trust & Safety</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Our commitment to a safe marketplace for everyone.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold text-foreground">Verified Vendors</h2>
            <p className="mt-2">
              Every vendor listing is reviewed by our team before going live. We verify
              business names, categories, and contact information. Vendors who claim
              their business via invite token are marked as "Verified" with a badge.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold text-foreground">Review System</h2>
            <p className="mt-2">
              Customers can leave reviews based on their actual experience. Reviews include
              a star rating and written feedback. We monitor reviews for authenticity and
              remove fraudulent ones.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold text-foreground">Reporting Abuse</h2>
            <p className="mt-2">
              If you encounter a fraudulent listing, inappropriate content, or a bad actor,
              report it immediately to <a href="mailto:support@findmybites.com" className="text-brand hover:underline">support@findmybites.com</a>.
              We investigate all reports within 24 hours and take action including listing
              removal and account bans.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold text-foreground">Safe Communication</h2>
            <p className="mt-2">
              All vendor-customer communication happens via WhatsApp directly — we don't
              store messages. Vendors' phone numbers are only shown on their public listing
              for booking purposes.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold text-foreground">Data Protection</h2>
            <p className="mt-2">
              We use Supabase (PostgreSQL) with Row Level Security. Authentication is via
              Google OAuth — we never store passwords. Customer enquiry data is only shared
              with the specific vendor contacted. Read our <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold text-foreground">Zero Tolerance</h2>
            <p className="mt-2">We have zero tolerance for:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Fake or misleading listings</li>
              <li>Scams or fraudulent payment requests</li>
              <li>Harassment or abusive behavior</li>
              <li>Impersonation of other businesses</li>
            </ul>
            <p className="mt-2">Violators are permanently banned from the platform.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
