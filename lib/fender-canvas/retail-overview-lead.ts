/**
 * Retail Overview hero: large issue count beside a checked-population disc.
 * Uses selectRetailHeadline. Unchecked listings are never drawn as fine.
 */

import type { PieDiscData } from "@/lib/ai-search/citation-pies";
import type { NodeStatus } from "@/lib/canvas-sdk/types";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  selectRetailHeadline,
  type MapLeakageDetail,
  type PortfolioRetailSnapshot,
  type RetailHeadline,
  type RetailReading,
  type SuppressionDetail,
  type UnnestedBundleDetail,
} from "@/lib/fender-canvas/portfolio-retail";
import { readingLabel } from "@/lib/fender-canvas/portfolio-retail-display";

const TONE_COLOR: Record<Exclude<NodeStatus, "neutral">, string> = {
  danger: "var(--danger-red)",
  warning: "var(--warning-amber)",
  success: "var(--success-green)",
};

export type RetailCheckedPopulation = {
  checked: number;
  population: number;
};

/** Tone already used for this reading on Catalog Health surfaces. */
export function retailHeadlineTone(reading: RetailReading<unknown>): Exclude<NodeStatus, "neutral"> {
  if (reading.status === "available_with_zero") return "success";
  if (reading.status === "unavailable") return "warning";
  if ((reading.issueCount ?? 0) > 0) return "danger";
  return "warning";
}

export function retailHeadlineColor(tone: Exclude<NodeStatus, "neutral">): string {
  return TONE_COLOR[tone];
}

/**
 * Checked vs monitored population for the headline reading.
 * Suppressed listings: audited is checked; population is the monitored catalog.
 * MAP: decided is checked. Bundles: bundles in this read vs catalog bundle count.
 */
export function retailHeadlineChecked(headline: RetailHeadline): RetailCheckedPopulation | null {
  const detail = headline.reading.detail;
  if (detail == null || typeof detail !== "object") return null;

  if (headline.findingId === "suppressed_listings") {
    const suppression = detail as SuppressionDetail;
    if (!(suppression.audited > 0) || !(suppression.population > 0)) return null;
    return { checked: suppression.audited, population: suppression.population };
  }

  if (headline.findingId === "map_leakage") {
    const map = detail as MapLeakageDetail;
    if (!(map.decided > 0) || !(map.population > 0)) return null;
    return { checked: map.decided, population: map.population };
  }

  if (headline.findingId === "unnested_bundles") {
    const bundles = detail as UnnestedBundleDetail;
    if (!(bundles.bundlesInRead > 0) || bundles.catalogBundles == null || !(bundles.catalogBundles > 0)) {
      return null;
    }
    return { checked: bundles.bundlesInRead, population: bundles.catalogBundles };
  }

  return null;
}

function issueSliceLabel(headline: RetailHeadline): string {
  const label = readingLabel(headline.reading, headline.label);
  if (headline.findingId === "map_leakage") return "Below MAP";
  if (headline.findingId === "unnested_bundles") return "Unnested bundle";
  return label;
}

/**
 * Disc of the headline count versus the rest of the checked population.
 * Unchecked listings are omitted so they cannot read as healthy.
 */
export function retailHeadlinePie(headline: RetailHeadline): PieDiscData | null {
  const count = headline.reading.issueCount;
  const coverage = retailHeadlineChecked(headline);
  if (count == null || coverage == null) return null;
  if (count < 0 || count > coverage.checked) return null;

  const clear = coverage.checked - count;
  const issueLabel = issueSliceLabel(headline);
  const slices = [
    { key: "contradicted", label: issueLabel, count },
    { key: "matched", label: "Checked without this issue", count: clear },
  ].filter((slice) => slice.count > 0);

  if (slices.length === 0) return null;

  return {
    id: `retail-overview-${headline.findingId}`,
    title: readingLabel(headline.reading, headline.label),
    total: coverage.checked,
    totalLabel: "checked listings",
    slices,
  };
}

/** Plain N of M tip, including how many were checked against the monitored catalog. */
export function retailHeadlinePieTip(headline: RetailHeadline): string | null {
  const count = headline.reading.issueCount;
  const coverage = retailHeadlineChecked(headline);
  if (count == null || coverage == null) return null;
  const issueLabel = issueSliceLabel(headline);
  const clear = Math.max(0, coverage.checked - count);
  return `${formatInt(count)} ${issueLabel}. ${formatInt(clear)} checked without this issue. ${formatInt(coverage.checked)} of ${formatInt(coverage.population)} listings were checked.`;
}

export type RetailOverviewLeadModel = {
  label: string;
  figure: string;
  color: string;
  tone: Exclude<NodeStatus, "neutral">;
  missingMessage: string | null;
  pie: PieDiscData | null;
  tip: string | null;
  findingId: RetailHeadline["findingId"] | null;
};

/**
 * Hero model for Retail Overview. Does not invent a zero when the count was never stored.
 * When every ranked finding is a confirmed zero, show Catalog Health at 0.
 */
export function retailOverviewLead(snapshot: PortfolioRetailSnapshot): RetailOverviewLeadModel {
  const headline = selectRetailHeadline(snapshot);

  if (!headline) {
    return {
      label: "Catalog Health",
      figure: formatInt(0),
      color: retailHeadlineColor("success"),
      tone: "success",
      missingMessage: null,
      pie: null,
      tip: null,
      findingId: null,
    };
  }

  const label = readingLabel(headline.reading, headline.label);
  const tone = retailHeadlineTone(headline.reading);
  const count = headline.reading.issueCount;
  const unfinished =
    headline.reading.status === "incomplete" || headline.reading.status === "unavailable";

  if (count == null) {
    return {
      label,
      figure: "Not available*",
      color: retailHeadlineColor(tone),
      tone,
      missingMessage: headline.reading.missingMessage,
      pie: null,
      tip: null,
      findingId: headline.findingId,
    };
  }

  return {
    label,
    figure: formatInt(count),
    color: retailHeadlineColor(tone),
    tone,
    missingMessage: unfinished ? headline.reading.missingMessage : null,
    pie: retailHeadlinePie(headline),
    tip: retailHeadlinePieTip(headline),
    findingId: headline.findingId,
  };
}
