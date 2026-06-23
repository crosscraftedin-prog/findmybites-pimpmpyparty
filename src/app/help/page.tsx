export const metadata = {
  title: "Help Center — FindMyBites × PimpMyParty",
  description: "Frequently asked questions and support for FindMyBites × PimpMyParty.",
};

export default function HelpPage() {
  const faqs = [
    { q: "How do I list my business?", a: "Click 'List your business' or 'Vendor Login' on the homepage. Sign in with Google, fill in your business details, and submit. Your listing goes live after admin approval (usually within 24 hours)." },
    { q: "Do you charge commission?", a: "No. We charge zero commission on all bookings. Vendors keep 100% of their earnings. We offer optional paid plans (Pro, Business) for enhanced visibility and features." },
    { q: "How do customers contact me?", a: "Customers can contact you directly via WhatsApp by clicking the WhatsApp button on your listing. The number comes from your listing's WhatsApp field." },
    { q: "How does the Near Me feature work?", a: "Click 'Near Me' in the header. Your browser will ask for location permission. We then show vendors within your selected radius (5-100 km), sorted by distance." },
    { q: "How do I edit my listing?", a: "Log in, click 'Dashboard', and edit your business details. Changes are saved instantly via the update_vendor_profile API." },
    { q: "How do I add products?", a: "Go to your dashboard, scroll to 'Products & Services', click 'Add Product', fill in the details (name, price, type, image URL), and click 'Add'." },
    { q: "What is the claim system?", a: "If you're the real owner of a business listed on our platform, you can claim it via an admin-sent invite link. Once claimed, you get full dashboard access to manage the listing." },
    { q: "How do I upgrade my plan?", a: "Go to your dashboard → 'Plan & billing' tab. Compare all 3 plans (Free, Pro, Business) and upgrade. Payment integration is coming soon." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Frequently asked questions. Can't find what you need?{" "}
          <a href="/contact" className="text-brand hover:underline">Contact us</a>.
        </p>

        <div className="mt-8 space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-border bg-muted/30 p-4">
              <summary className="cursor-pointer text-sm font-bold text-foreground">
                {faq.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
