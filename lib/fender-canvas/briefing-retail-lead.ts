/**
 * Briefing hero numbers for Summary. Same retail headline Catalog Health uses.
 * The disc is issue count versus the rest of the checked population only.
 */

import type { PieDiscData } from "@/lib/ai-search/citation-pies";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  headlineSurface,
  readingLabel,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import {
  selectRetailHeadline,
  type RetailFindingId,
  type RetailHeadline,
  type RetailReading,
} from "@/lib/fender-canvas/portfolio-retail";

export const BRIEFING_COUNT_MISSING = "Not available*";

export type BriefingRetailLead = {
  label: string;
  /** Formatted issue count, or Not available* when the count was never stored. */
  figure: string;
  /** CSS color for the figure when a count is present. */
  color: string | null;
  missingMessage: string | null;
  pie: PieDiscData | null;
  tip: string | null;
};

type CheckedShare = {
  checked: number;
  population: number | null;
  noun: string;
};

function checkedShare(
  findingId: RetailFindingId,
  reading: RetailReading<unknown>,
): CheckedShare | null {
  const detail = reading.detail as {
    audited?: number;
    population?: number;
    decided?: number;
    bundlesInRead?: number;
    catalogBundles?: number | null;
  } | null;
  if (!detail) return null;

  if (findingId === "suppressed_listings") {
    if (typeof detail.audited !== "number" || detail.audited < 0) return null;
    return {
      checked: detail.audited,
      population: typeof detail.population === "number" ? detail.population : null,
      noun: reading.headlineNoun ?? "listing",
    };
  }

  if (findingId === "map_leakage") {
    if (typeof detail.decided !== "number" || detail.decided < 0) return null;
    return {
      checked: detail.decided,
      population: typeof detail.population === "number" ? detail.population : null,
      noun: "listing",
    };
  }

  if (findingId === "unnested_bundles") {
    if (typeof detail.bundlesInRead !== "number" || detail.bundlesInRead < 0) return null;
    return {
      checked: detail.bundlesInRead,
      population:
        typeof detail.catalogBundles === "number" ? detail.catalogBundles : null,
      noun: "bundle",
    };
  }

  return null;
}

function issuePie(
  label: string,
  issueCount: number,
  share: CheckedShare,
): { pie: PieDiscData; tip: string } | null {
  const { checked, population, noun } = share;
  if (checked <= 0 || issueCount < 0 || issueCount > checked) return null;
  const fine = checked - issueCount;
  const nounPlural = noun === "listing" ? "listings" : `${noun}s`;
  const pie: PieDiscData = {
    id: "briefing-retail-headline",
    title: label,
    total: checked,
    totalLabel: `checked ${nounPlural}`,
    slices: [
      { key: "contradicted", label: label, count: issueCount },
      { key: "matched", label: `Checked without this issue`, count: fine },
    ].filter((slice) => slice.count > 0),
  };
  const tipParts = [
    `${formatInt(issueCount)} of ${formatInt(checked)} checked ${
      issueCount === 1 ? noun : nounPlural
    }.`,
  ];
  if (population != null && population >= checked) {
    tipParts.push(
      `${formatInt(checked)} of ${formatInt(population)} monitored ${
        population === 1 ? noun : nounPlural
      } were checked.`,
    );
  }
  return { pie, tip: tipParts.join(" ") };
}

function fromHeadline(headline: RetailHeadline): BriefingRetailLead {
  const label = readingLabel(headline.reading, headline.label);
  const count = headline.reading.issueCount;
  if (count == null) {
    return {
      label,
      figure: BRIEFING_COUNT_MISSING,
      color: null,
      missingMessage: headline.reading.missingMessage,
      pie: null,
      tip: null,
    };
  }

  const share = checkedShare(headline.findingId, headline.reading);
  const disc = share ? issuePie(label, count, share) : null;
  return {
    label,
    figure: formatInt(count),
    color: count > 0 ? "var(--danger-red)" : "var(--success-green)",
    missingMessage:
      headline.reading.status === "incomplete" || headline.reading.status === "unavailable"
        ? headline.reading.missingMessage
        : null,
    pie: disc?.pie ?? null,
    tip: disc?.tip ?? null,
  };
}

/** Lead figure and disc for Summary Briefing. Matches Catalog Health headlineSurface. */
export function briefingRetailLead(read: RetailCanvasRead): BriefingRetailLead {
  const surface = headlineSurface(read);
  if (read.phase !== "ready") {
    return {
      label: surface.label,
      figure: BRIEFING_COUNT_MISSING,
      color: null,
      missingMessage: surface.missingMessage,
      pie: null,
      tip: null,
    };
  }

  const headline = selectRetailHeadline(read.snapshot);
  if (!headline) {
    const suppressed = read.snapshot.suppressedListings;
    const share = checkedShare("suppressed_listings", suppressed);
    const disc =
      share && suppressed.issueCount != null
        ? issuePie("Catalog Health", suppressed.issueCount, share)
        : share
          ? issuePie("Catalog Health", 0, share)
          : null;
    return {
      label: "Catalog Health",
      figure: "0",
      color: "var(--success-green)",
      missingMessage: null,
      pie: disc?.pie ?? null,
      tip: disc?.tip ?? null,
    };
  }

  return fromHeadline(headline);
}
