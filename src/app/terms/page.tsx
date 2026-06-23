export const metadata = {
  title: "Terms of Service — FindMyBites × PimpMyParty",
  description: "Terms of service for FindMyBites × PimpMyParty marketplace.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2024</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using FindMyBites × PimpMyParty ("the Platform"), you agree
              to be bound by these Terms of Service. If you do not agree, please do not use
              the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">2. Platform Description</h2>
            <p className="mt-2">
              FindMyBites × PimpMyParty is a marketplace that connects customers with food
              and event vendors. We are not a party to any transaction between vendors and
              customers. We charge zero commission on bookings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">3. Vendor Responsibilities</h2>
            <p className="mt-2">Vendors agree to:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Provide accurate business information</li>
              <li>Deliver services as described in their listing</li>
              <li>Respond to customer enquiries within 48 hours</li>
              <li>Maintain appropriate licenses and permits</li>
              <li>Not post misleading or fraudulent content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">4. Customer Responsibilities</h2>
            <p className="mt-2">Customers agree to:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Provide accurate booking information</li>
              <li>Communicate directly with vendors via WhatsApp</li>
              <li>Pay vendors directly as agreed</li>
              <li>Leave honest reviews based on actual experiences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">5. Zero Commission Policy</h2>
            <p className="mt-2">
              We do not charge commission on any booking made through the Platform. Vendors
              keep 100% of their earnings. We may offer paid subscription plans (Pro, Business)
              for enhanced visibility and features.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">6. Listing Approval</h2>
            <p className="mt-2">
              All vendor listings are reviewed before going live. We reserve the right to
              reject or remove any listing that violates our guidelines or is deemed
              inappropriate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">7. Limitation of Liability</h2>
            <p className="mt-2">
              The Platform is provided "as is" without warranties. We are not liable for any
              disputes, damages, or issues arising between vendors and customers. All
              transactions are conducted directly between parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">8. Contact</h2>
            <p className="mt-2">
              Questions about these Terms? Email <a href="mailto:support@findmybites.com" className="text-brand hover:underline">support@findmybites.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
