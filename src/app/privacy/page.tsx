export const metadata = {
  title: "Privacy Policy — FindMyBites × PimpMyParty",
  description: "How FindMyBites × PimpMyParty handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2024</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-bold text-foreground">1. Data We Collect</h2>
            <p className="mt-2">We collect the following information:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li><strong>Vendor data:</strong> Business name, category, location, contact details, photos, pricing</li>
              <li><strong>Customer data:</strong> Name, email, event details (for enquiries only)</li>
              <li><strong>Usage data:</strong> Page views, search queries, device info (for analytics)</li>
              <li><strong>Auth data:</strong> Google OAuth email and profile (we never store passwords)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">2. How We Use Your Data</h2>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>To display vendor listings on the marketplace</li>
              <li>To enable WhatsApp communication between vendors and customers</li>
              <li>To provide analytics dashboards for vendors</li>
              <li>To improve search results and user experience</li>
              <li>To send important platform updates (opt-out anytime)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">3. Data Sharing</h2>
            <p className="mt-2">
              We do <strong>not</strong> sell your data. Vendor contact information (WhatsApp
              number, website, Instagram) is displayed publicly on their listing. Customer
              enquiry details are shared only with the vendor they contacted.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">4. Data Storage</h2>
            <p className="mt-2">
              Data is stored securely using Supabase (PostgreSQL) with Row Level Security
              enabled. Authentication is handled via Google OAuth through Supabase Auth.
              Images are stored in Supabase Storage.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">5. Your Rights</h2>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Request a copy of your data</li>
              <li>Request deletion of your data and listing</li>
              <li>Opt out of marketing communications</li>
              <li>Update your business information anytime</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">6. Cookies</h2>
            <p className="mt-2">
              We use essential cookies for authentication and session management. We use
              Google Analytics (optional) to understand traffic patterns. No third-party
              advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">7. Contact</h2>
            <p className="mt-2">
              Privacy questions? Email <a href="mailto:support@findmybites.com" className="text-brand hover:underline">support@findmybites.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
