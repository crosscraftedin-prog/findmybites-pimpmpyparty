export const metadata = {
  title: "Blog — FindMyBites × PimpMyParty",
  description: "Tips, stories, and guides for food and event vendors.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Tips, stories, and guides for food and event vendors.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-base font-medium">Coming soon!</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We're working on vendor success guides, customer planning tips, and
            success stories from our marketplace. Stay tuned.
          </p>
        </div>
      </div>
    </div>
  );
}
