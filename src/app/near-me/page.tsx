import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendors Near Me — FindMyBites × PimpMyParty",
  description:
    "Find food and event vendors near your location. Browse bakers, caterers, DJs, photographers, decorators and more — sorted by distance from you.",
  alternates: { canonical: "https://findmybites.com/near-me" },
  openGraph: {
    title: "Vendors Near Me — FindMyBites × PimpMyParty",
    description:
      "Find food and event vendors near your location. Sorted by distance from you.",
    url: "https://findmybites.com/near-me",
    type: "website",
  },
};

export default function NearMePage() {
  return <NearMePageClient />;
}

import { NearMePageClient } from "./near-me-client";
