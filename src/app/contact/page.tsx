import Link from "next/link";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Mail,
  Phone,
  MessageCircle,
  Heart,
} from "lucide-react";

export const metadata = {
  title: "Contact — FindMyBites × PimpMyParty",
  description: "Get in touch with the FindMyBites × PimpMyParty team.",
};

const SOCIAL = [
  {
    icon: Instagram,
    label: "Instagram",
    handle: "@findmybites.app",
    href: "https://www.instagram.com/findmybites.app/",
  },
  {
    icon: Facebook,
    label: "Facebook",
    handle: "/findmybites",
    href: "https://www.facebook.com/findmybites/",
  },
  {
    icon: Twitter,
    label: "X (Twitter)",
    handle: "@FindMyBites",
    href: "https://x.com/FindMyBites",
  },
  {
    icon: Youtube,
    label: "YouTube",
    handle: "@findmybites",
    href: "https://www.youtube.com/@findmybites",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We&apos;d love to hear from you. Reach out anytime.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">General Inquiries</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email:{" "}
              <a
                href="mailto:support@findmybites.com"
                className="text-brand hover:underline"
              >
                support@findmybites.com
              </a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We typically respond within 24 hours.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">Vendor Support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email:{" "}
              <a
                href="mailto:vendors@findmybites.com"
                className="text-brand hover:underline"
              >
                vendors@findmybites.com
              </a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Need help with your listing? We&apos;re here.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">Partnerships</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Email:{" "}
              <a
                href="mailto:partners@findmybites.com"
                className="text-brand hover:underline"
              >
                partners@findmybites.com
              </a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Media, partnerships, and press inquiries.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-bold">WhatsApp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <a
                href="https://wa.me/919052681374"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                Chat with us on WhatsApp →
              </a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fastest way to reach us.
            </p>
          </div>
        </div>

        {/* Follow us on social */}
        <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-amber-500/5 via-fuchsia-500/5 to-purple-500/5 p-8">
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-brand" />
            <h2 className="text-xl font-bold tracking-tight">Follow us</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Stay connected for vendor spotlights, event inspiration, behind-the-scenes
            content, and platform updates.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOCIAL.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`FindMyBites on ${s.label}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-sm"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{s.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.handle}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="size-4 text-brand" /> hello@findmybites.party
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-4 text-brand" /> Chat with Josh AI assistant
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-4 text-brand" /> Worldwide
          </span>
        </div>
      </div>
    </div>
  );
}
