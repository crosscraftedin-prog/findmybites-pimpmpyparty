/**
 * Shared price display helper.
 * Ensures offerPrice is always shown when available, with regular price struck through.
 * Use this everywhere a product price is displayed.
 */

export interface Priceable {
  price: number;
  offerPrice?: number | null;
  comparePrice?: number | null;
  currency?: string | null;
  currencySymbol?: string;
}

export function getDisplayPrice(item: Priceable): {
  current: number;
  original: number | null;
  discountPercent: number | null;
  hasOffer: boolean;
} {
  const price = Number(item.price) || 0;
  const offer = item.offerPrice != null ? Number(item.offerPrice) : null;
  const compare = item.comparePrice != null ? Number(item.comparePrice) : null;

  if (offer != null && offer < price && offer > 0) {
    const pct = Math.round(((price - offer) / price) * 100);
    return { current: offer, original: price, discountPercent: pct > 0 ? pct : null, hasOffer: true };
  }

  if (compare != null && compare > price && compare > 0) {
    const pct = Math.round(((compare - price) / compare) * 100);
    return { current: price, original: compare, discountPercent: pct > 0 ? pct : null, hasOffer: true };
  }

  return { current: price, original: null, discountPercent: null, hasOffer: false };
}

export function formatPrice(amount: number, symbol: string = "₹"): string {
  return `${symbol}${amount.toLocaleString()}`;
}
