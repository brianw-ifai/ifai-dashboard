import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const AMAZON_OFFER_SHARE_ID = "amazon_offer_share";

/** Drill-down only: Amazon Retail's share of Featured Offers over active offers. */
export function selectAmazonOfferShare(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, AMAZON_OFFER_SHARE_ID, { againstActive: true });
}
