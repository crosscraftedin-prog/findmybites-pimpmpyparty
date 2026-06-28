interface PriceRow {
  type: string;
  range: string;
  includes: string;
}

interface PriceGuideTableProps {
  category: string;
  location: string;
  currency: string;
  prices: PriceRow[];
  ecoColor: string;
}

/**
 * Price guide table for a keyword landing page. Shows typical price ranges
 * so customers (and Google) understand pricing context.
 */
export function PriceGuideTable({
  category,
  location,
  currency,
  prices,
  ecoColor,
}: PriceGuideTableProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-[24px] font-bold tracking-tight sm:text-[28px]">
        How much do {category.toLowerCase()} cost in {location}?
      </h2>
      <p className="mt-2 text-[15px] text-black/60">
        Typical price ranges across {location}. All amounts in {currency}.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.02]">
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-black/50">
                Type
              </th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-black/50">
                Price Range
              </th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-black/50">
                What&apos;s Included
              </th>
            </tr>
          </thead>
          <tbody>
            {prices.map((row, i) => (
              <tr
                key={row.type}
                className={i < prices.length - 1 ? "border-b border-black/5" : ""}
              >
                <td className="px-4 py-3 align-top font-medium text-black/80">
                  {row.type}
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className="inline-block rounded-md px-2 py-0.5 text-[13px] font-bold"
                    style={{ background: `${ecoColor}14`, color: ecoColor }}
                  >
                    {row.range}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-black/60">{row.includes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12px] text-black/40">
        Note: Prices vary by vendor, size, and complexity. Contact vendors
        directly for exact quotes.
      </p>
    </section>
  );
}
