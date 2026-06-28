import Link from "next/link";
import { Store, ArrowRight } from "lucide-react";

interface VendorCTAProps {
  category: string;
  location: string;
  ecoColor: string;
}

/**
 * Call-to-action band recruiting new vendors: "Are you a [category] in
 * [location]? List your business free →". Links to the homepage where the
 * List-Your-Business flow lives.
 */
export function VendorCTA({ category, location, ecoColor }: VendorCTAProps) {
  return (
    <section
      className="py-14"
      style={{ background: `linear-gradient(135deg, ${ecoColor}12, ${ecoColor}06)` }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: `${ecoColor}1f`, color: ecoColor }}
        >
          <Store className="size-3.5" />
          For vendors
        </span>
        <h2 className="mt-4 text-[26px] font-extrabold tracking-tight sm:text-[32px]">
          Are you a {category.toLowerCase()} maker in {location}?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-black/60">
          Join hundreds of vendors already on FindMyBites. List your business
          free, get discovered by customers across {location}, and keep 100% of
          your bookings — zero commission.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
          style={{ background: ecoColor }}
        >
          List your business free
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
