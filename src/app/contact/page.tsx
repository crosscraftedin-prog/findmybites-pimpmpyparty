export const metadata = {
  title: "Contact — FindMyBites × PimpMyParty",
  description: "Get in touch with the FindMyBites × PimpMyParty team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We'd love to hear from you. Reach out anytime.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">General Inquiries</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email: <a href="mailto:support@findmybites.com" className="text-brand hover:underline">support@findmybites.com</a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We typically respond within 24 hours.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">Vendor Support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email: <a href="mailto:vendors@findmybites.com" className="text-brand hover:underline">vendors@findmybites.com</a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Need help with your listing? We're here.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">Partnerships</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email: <a href="mailto:partners@findmybites.com" className="text-brand hover:underline">partners@findmybites.com</a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Media, partnerships, and press inquiries.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">WhatsApp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <a href="https://wa.me/919052681374" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                Chat with us on WhatsApp →
              </a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fastest way to reach us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
