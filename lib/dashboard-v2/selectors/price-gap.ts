import type { ListingCurrentRow, SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const PRICE_GAP_ID = "price_gap_above_benchmark";

export type PriceGapLine = {
  listingId: string;
  asin: string;
  title: string | null;
  offerPrice: number;
  /** Amazon's outside benchmark in dollars. */
  benchmark: number;
  /** Dollars the offer sits above the benchmark. */
  gap: number;
  readAt: string | null;
  benchmarkMatchChannels: string[];
};

export type PriceGap = MetricReading & {
  /** Per-listing lines when listing rows were supplied, else []. */
  lines: PriceGapLine[];
  /** Sum of the lines in dollars, or null when no lines were supplied. */
  linesTotal: number | null;
};

/** Dollars above the benchmark for one suppressed listing, from cents so the sum is exact. */
export function gapCents(row: Pick<ListingCurrentRow, "offer_price_cents" | "competitive_external_price_cents">): number | null {
  if (row.offer_price_cents === null || row.competitive_external_price_cents === null) return null;
  return row.offer_price_cents - row.competitive_external_price_cents;
}

export function priceGapLines(listings: ListingCurrentRow[]): PriceGapLine[] {
  const lines: PriceGapLine[] = [];
  for (const row of listings) {
    if (row.suppressed !== true || row.offer_status !== "active") continue;
    const cents = gapCents(row);
    if (cents === null || row.offer_price_cents === null || row.competitive_external_price_cents === null) continue;
    lines.push({
      listingId: row.listing_id,
      asin: row.asin,
      title: row.title,
      offerPrice: row.offer_price_cents / 100,
      benchmark: row.competitive_external_price_cents / 100,
      gap: cents / 100,
      readAt: row.benchmark_read_at,
      benchmarkMatchChannels: row.benchmark_match_channels ?? [],
    });
  }
  return lines.sort((a, b) => b.gap - a.gap || a.asin.localeCompare(b.asin));
}

/** The sum from metric_value, with the per-listing lines when listing rows are supplied. */
export function selectPriceGapAboveBenchmark(bundle: SandboxBundle, listings?: ListingCurrentRow[]): PriceGap {
  const base = metricReading(bundle, PRICE_GAP_ID, { againstActive: false });
  const lines = listings ? priceGapLines(listings) : [];
  const linesTotal = listings ? lines.reduce((sum, line) => sum + Math.round(line.gap * 100), 0) / 100 : null;
  // The run behind the gap is the benchmark run, which is partial; carry that through.
  return { ...base, lines, linesTotal };
}
