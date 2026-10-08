import { formatInt } from "@/lib/fender-canvas/format";
import { activeOfferClarity } from "@/lib/fender-canvas/offer-clarity";
import {
  headlineSentence,
  headlineSurface,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import {
  FENDER_MAP_NOT_STORED,
  type RetailReading,
} from "@/lib/fender-canvas/portfolio-retail";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

function countLine(
  read: RetailCanvasRead,
  reading: RetailReading<unknown> | null,
  phrase: (count: number) => string,
  failed: string,
): string {
  if (read.phase === "loading") {
    return "The listing read is still loading, so this plan does not state a count.";
  }
  if (read.phase === "error" || !reading || reading.status === "unavailable" || reading.issueCount == null) {
    return failed;
  }
  return phrase(reading.issueCount);
}

/**
 * The MAP line every plan and queue repeats. It states no count: Amazon's stored list price
 * cannot decide a below-MAP listing, so the plan waits on Fender's MAP file.
 */
export function mapReadLine(read: RetailCanvasRead): string {
  if (read.phase === "loading") {
    return "The listing read is still loading, so this plan does not state a MAP count.";
  }
  if (read.phase === "error") {
    return "The MAP listing read did not succeed, so this plan does not state a MAP count.";
  }
  return read.snapshot.mapPrices.missingMessage ?? FENDER_MAP_NOT_STORED;
}

export function bundleReadLine(read: RetailCanvasRead): string {
  const reading = read.phase === "ready" ? read.snapshot.unnestedBundles : null;
  return countLine(
    read,
    reading,
    (count) =>
      `${formatInt(count)} ${count === 1 ? "bundle has" : "bundles have"} no usable parent ASIN in this listing read.`,
    "The catalog listing read did not succeed, so this plan does not state an unnested-bundle count.",
  );
}

export function retailTemplateVars(
  bundle: CanvasBundle,
  retail: RetailCanvasRead,
): Record<string, string> {
  return {
    retail_headline: headlineSentence(headlineSurface(retail)),
    active_offer_clarity: activeOfferClarity(bundle.m),
    map_read_line: mapReadLine(retail),
    bundle_read_line: bundleReadLine(retail),
  };
}
