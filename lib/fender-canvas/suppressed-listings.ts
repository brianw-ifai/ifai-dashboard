/** Featured Offer suppression from `public.canvas_retail_listings`. */

export type SuppressionReading = {
  asin: string;
  model_name: string | null;
  title: string | null;
  offer_price: number | null;
  competitive_price_threshold_cents: number | null;
  featured_offer_withheld: boolean | null;
};

export const SUPPRESSED_LISTING_COLUMNS =
  "asin,model_name,title,offer_price,competitive_price_threshold_cents,featured_offer_withheld,competitive_offer_suppressed";

function finite(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** New offer in cents. `offer_price` is dollars and already includes shipping. */
export function offerCents(offerPrice: number | null | undefined): number | null {
  const dollars = finite(offerPrice);
  if (dollars == null) return null;
  return Math.round(dollars * 100);
}

export function thresholdCents(value: number | null | undefined): number | null {
  const cents = finite(value);
  if (cents == null || cents <= 0) return null;
  return cents;
}

/**
 * A listing is on the list only when the landed offer is above Amazon's
 * Competitive External Price and the Featured Offer is withheld.
 * A null seller is not an input.
 */
export function qualifiesForSuppressionList(row: SuppressionReading): boolean {
  if (row.featured_offer_withheld !== true) return false;
  const threshold = thresholdCents(row.competitive_price_threshold_cents);
  const landed = offerCents(row.offer_price);
  if (threshold == null || landed == null) return false;
  return landed > threshold;
}

/** The reading exists once any row has a positive threshold. */
export function suppressionReadingAvailable(
  rows: Array<Pick<SuppressionReading, "competitive_price_threshold_cents">>,
): boolean {
  return rows.some((row) => thresholdCents(row.competitive_price_threshold_cents) != null);
}

export function suppressionGapDollars(row: SuppressionReading): number | null {
  const landed = offerCents(row.offer_price);
  const threshold = thresholdCents(row.competitive_price_threshold_cents);
  if (landed == null || threshold == null) return null;
  return (landed - threshold) / 100;
}

export function suppressionList(rows: SuppressionReading[]): SuppressionReading[] {
  return rows
    .filter(qualifiesForSuppressionList)
    .sort((a, b) => {
      const gap = (suppressionGapDollars(b) ?? 0) - (suppressionGapDollars(a) ?? 0);
      if (gap !== 0) return gap;
      return a.asin.localeCompare(b.asin);
    });
}

export function listingLabel(row: Pick<SuppressionReading, "model_name" | "title">): string {
  return row.model_name?.trim() || row.title?.trim() || "Listing";
}
