/**
 * Bubble and panel copy for Portfolio Retail.
 * Counts come from the reading model. This file does not count rows.
 */

import type { NodeStatus } from "../canvas-sdk/types";
import { formatInt, formatUsd } from "./format";
import {
  RETAIL_FINDING_LABELS,
  selectRetailHeadline,
  type MapLeakageDetail,
  type PortfolioRetailFindings,
  type PortfolioRetailSnapshot,
  type RetailReading,
} from "./portfolio-retail";

export const RETAIL_OVERVIEW_TAB = "Retail Overview";

export const RETAIL_PANEL_TABS = [
  RETAIL_OVERVIEW_TAB,
  RETAIL_FINDING_LABELS.suppressed_listings,
  RETAIL_FINDING_LABELS.map_leakage,
  RETAIL_FINDING_LABELS.unnested_bundles,
] as const;

export type RetailCanvasRead =
  | { phase: "loading" }
  | { phase: "ready"; snapshot: PortfolioRetailSnapshot }
  | { phase: "error" };

export type RetailBubbleFace = {
  title: string;
  stats: string[];
  meta?: string;
  status: NodeStatus;
  subTab?: string;
  tooltip: { title: string; desc: string };
};

const CATALOG_TOOLTIP =
  "Bundle listings that are not nested under a parent ASIN. Nesting keeps their reviews on the parent listing.";

export function shortCoverageLine(message: string | null): string | null {
  if (!message) return null;
  const match = message.match(/\d[\d,]*\s+of\s+\d[\d,]*/);
  if (match) return match[0];
  const sentence = message.split(". ")[0]?.trim() || message.trim();
  if (!sentence) return null;
  return sentence.length > 72 ? `${sentence.slice(0, 69).trim()}…` : sentence;
}

export function countPhrase(
  reading: RetailReading<unknown>,
  singular: string,
  plural = `${singular}s`,
): string | null {
  if (reading.issueCount == null) return null;
  const noun = reading.issueCount === 1 ? singular : plural;
  return `${formatInt(reading.issueCount)} ${noun}`;
}

function tone(reading: RetailReading<unknown>): NodeStatus {
  if (reading.status === "available_with_zero") return "success";
  if (reading.status === "unavailable") return "warning";
  if ((reading.issueCount ?? 0) > 0) return "danger";
  return "warning";
}

function coveragePill(reading: RetailReading<unknown>): string | null {
  if (reading.status !== "incomplete" && reading.status !== "unavailable") return null;
  return shortCoverageLine(reading.missingMessage);
}

function face(
  title: string,
  reading: RetailReading<unknown>,
  stats: string[],
  tooltip: string,
  subTab: string,
): RetailBubbleFace {
  const pills = stats.filter((entry) => entry.trim().length > 0);
  return {
    title,
    stats: pills.length ? pills : ["Not stored"],
    status: tone(reading),
    subTab,
    tooltip: { title, desc: tooltip },
  };
}

export type HeadlineSurface = {
  label: string;
  /** Formatted issue count, such as "45 listings". Null when this reading was never stored. */
  countLabel: string | null;
  /** Set for an incomplete or unavailable reading. Null when the reading is complete. */
  missingMessage: string | null;
  /** The finding's own tab. */
  tab: string;
  /** Retail Overview while the headline is Suppressed Listings. Otherwise the finding's tab. */
  commandTab: string;
};

export function headlineSurface(read: RetailCanvasRead): HeadlineSurface {
  if (read.phase !== "ready") {
    return {
      label: "Retail reading",
      countLabel: null,
      missingMessage:
        read.phase === "loading"
          ? "The retail headline is still loading from the stored catalog and offer read."
          : "The retail read could not be loaded from the stored catalog.",
      tab: RETAIL_OVERVIEW_TAB,
      commandTab: RETAIL_OVERVIEW_TAB,
    };
  }

  const headline = selectRetailHeadline(read.snapshot);
  if (!headline) {
    return {
      label: "Portfolio Retail",
      countLabel: "0 listings",
      missingMessage: null,
      tab: RETAIL_OVERVIEW_TAB,
      commandTab: RETAIL_OVERVIEW_TAB,
    };
  }

  const noun = headline.findingId === "unnested_bundles" ? "bundle" : "listing";
  const unfinished =
    headline.reading.status === "incomplete" || headline.reading.status === "unavailable";
  return {
    label: headline.label,
    countLabel: countPhrase(headline.reading, noun),
    missingMessage: unfinished ? headline.reading.missingMessage : null,
    tab: headline.label,
    commandTab:
      headline.findingId === "suppressed_listings" ? RETAIL_OVERVIEW_TAB : headline.label,
  };
}

export function headlineSentence(surface: HeadlineSurface): string {
  const lead = surface.countLabel ? `${surface.label}: ${surface.countLabel}` : surface.label;
  return surface.missingMessage ? `${lead}. ${surface.missingMessage}` : `${lead}.`;
}

export function headlineBubble(findings: PortfolioRetailFindings): RetailBubbleFace {
  const headline = selectRetailHeadline(findings);
  if (!headline) {
    return {
      title: "Portfolio Retail",
      stats: ["0 listings"],
      meta: "Stored zeros",
      status: "success",
      tooltip: {
        title: "Portfolio Retail",
        desc: "Suppressed Featured Offers, MAP leakage, and unnested bundles are each a stored zero.",
      },
    };
  }

  const noun = headline.findingId === "unnested_bundles" ? "bundle" : "listing";
  const count = countPhrase(headline.reading, noun);
  const tooltip =
    headline.reading.missingMessage ??
    `${headline.label} is the current retail headline.`;

  return {
    title: "Portfolio Retail",
    stats: [headline.label, ...(count ? [count] : [])],
    status: tone(headline.reading),
    subTab: headline.label,
    tooltip: { title: headline.label, desc: tooltip },
  };
}

export function suppressedBubble(reading: RetailReading<unknown>): RetailBubbleFace {
  const count = countPhrase(reading, "listing");
  const coverage = coveragePill(reading);
  return face(
    "Suppressed Listings",
    reading,
    [...(count ? [count] : []), ...(coverage ? [coverage] : [])],
    reading.missingMessage ??
      "Listings above the stored Competitive External Price with the Featured Offer withheld.",
    "Suppressed Listings",
  );
}

export function mapBubble(reading: RetailReading<MapLeakageDetail | null>): RetailBubbleFace {
  const count = countPhrase(reading, "below MAP", "below MAP");
  const gap =
    reading.detail?.averageLeakage != null
      ? `${formatUsd(reading.detail.averageLeakage, { signed: true })} gap`
      : null;
  const coverage = coveragePill(reading);
  const gapNote =
    reading.detail?.averageLeakage != null
      ? `Average worst stored price gap ${formatUsd(reading.detail.averageLeakage, { signed: true })}. This is a price gap, not a revenue estimate.`
      : null;
  const tooltip = [gapNote, reading.missingMessage].filter(Boolean).join(" ");
  return face(
    "MAP Leakage",
    reading,
    [...(count ? [count] : []), ...(gap ? [gap] : []), ...(coverage ? [coverage] : [])],
    tooltip || "MAP leakage uses stored channel prices only.",
    "MAP",
  );
}

export function catalogBubble(reading: RetailReading<unknown>): RetailBubbleFace {
  const count = countPhrase(reading, "bundle");
  const coverage = coveragePill(reading);
  return face(
    "Catalog Governance",
    reading,
    [...(count ? [count] : []), ...(coverage ? [coverage] : [])],
    CATALOG_TOOLTIP,
    "Catalog Governance",
  );
}

function waitingFace(title: string, subTab: string | undefined, stats: string[], desc: string): RetailBubbleFace {
  return {
    title,
    stats,
    status: "warning",
    subTab,
    tooltip: { title, desc },
  };
}

export function retailBubbleFaces(read: RetailCanvasRead): {
  main: RetailBubbleFace;
  suppressed: RetailBubbleFace;
  map: RetailBubbleFace;
  catalog: RetailBubbleFace;
} {
  if (read.phase === "loading") {
    const desc = "The retail reading is still loading.";
    return {
      main: waitingFace("Portfolio Retail", undefined, ["Loading"], desc),
      suppressed: waitingFace("Suppressed Listings", "Suppressed Listings", ["Loading"], desc),
      map: waitingFace("MAP Leakage", "MAP", ["Loading"], desc),
      catalog: waitingFace("Catalog Governance", "Catalog Governance", ["Loading"], desc),
    };
  }

  if (read.phase === "error") {
    const desc = "The retail read could not be loaded.";
    return {
      main: waitingFace("Portfolio Retail", undefined, ["Read failed"], desc),
      suppressed: waitingFace("Suppressed Listings", "Suppressed Listings", ["Read failed"], desc),
      map: waitingFace("MAP Leakage", "MAP", ["Read failed"], desc),
      catalog: waitingFace("Catalog Governance", "Catalog Governance", ["Read failed"], desc),
    };
  }

  const snapshot = read.snapshot;
  return {
    main: headlineBubble(snapshot),
    suppressed: suppressedBubble(snapshot.suppressedListings),
    map: mapBubble(snapshot.mapLeakage),
    catalog: catalogBubble(snapshot.unnestedBundles),
  };
}
