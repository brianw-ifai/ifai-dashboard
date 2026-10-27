import type { PieDiscData } from "@/lib/ai-search/citation-pies";
import { formatInt, formatRatio } from "@/lib/fender-canvas/format";
import type { OutcomeCounts } from "@/lib/findability/outcomes";

/**
 * Exact-page share bands for the Findability hero figure.
 * Low share is the gap color (danger). Same traffic-light tokens as other leads.
 */
export const EXACT_PAGE_SHARE_BANDS = { redBelow: 25, greenAbove: 60 } as const;

/** N of M for the Findability hero. Empty reads never invent a zero figure. */
export function exactPageFigure(counts: OutcomeCounts): string | null {
  if (counts.total <= 0) return null;
  return formatRatio(counts.exact_official_product, counts.total);
}

/** Traffic-light color for the exact-page share. Null when there is no population. */
export function exactPageShareColor(counts: OutcomeCounts): string | null {
  if (counts.total <= 0) return null;
  const share = (100 * counts.exact_official_product) / counts.total;
  if (share < EXACT_PAGE_SHARE_BANDS.redBelow) return "var(--danger-red)";
  if (share > EXACT_PAGE_SHARE_BANDS.greenAbove) return "var(--success-green)";
  return "var(--warning-amber)";
}

/**
 * Disc of exact official product pages versus the rest of this read.
 * Family pages, ambiguous matches, and unchecked listings stay in the rest.
 */
export function exactPageLeadPie(counts: OutcomeCounts): PieDiscData | null {
  if (counts.total <= 0) return null;
  const exact = counts.exact_official_product;
  const rest = counts.total - exact;
  if (exact < 0 || rest < 0) return null;
  return {
    id: "findability-exact-pages",
    title: "Exact official product page",
    total: counts.total,
    totalLabel: "listings in this read",
    slices: [
      { key: "matched", label: "Exact official product page", count: exact },
      { key: "none", label: "Rest of this read", count: rest },
    ].filter((slice) => slice.count > 0),
  };
}

/** Plain N of M for the disc tip. */
export function exactPageLeadTip(counts: OutcomeCounts): string {
  return `${formatInt(counts.exact_official_product)} of ${formatInt(counts.total)}`;
}
