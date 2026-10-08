import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const FEATURED_OFFER_PRESENT_ID = "featured_offer_present";
export const FEATURED_OFFER_SUPPRESSED_ID = "featured_offer_suppressed";

/** Listings where Amazon shows a Featured Offer, over the listings whose flag was read. */
export function selectFeaturedOfferPresent(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, FEATURED_OFFER_PRESENT_ID, { againstActive: true });
}

/** Listings with the Featured Offer withheld and the offer above the Competitive External Price. */
export function selectFeaturedOfferSuppressed(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, FEATURED_OFFER_SUPPRESSED_ID, { againstActive: true });
}
