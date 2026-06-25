import type { Metadata } from "next";
import { AboutClient } from "./about-client";

export const metadata: Metadata = {
  title: "About Us — FindMyBites × PimpMyParty",
  description:
    "Built in the Middle East. Built for the world. Learn the story behind FindMyBites × PimpMyParty.",
};

export default function Page() {
  return <AboutClient />;
}
