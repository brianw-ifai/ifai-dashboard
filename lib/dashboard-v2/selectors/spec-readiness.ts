import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const SPEC_PAGE_FOUND_ID = "spec_fender_page_found";
export const SPEC_ADDITIONAL_PROPERTY_ID = "spec_additional_property_missing";
export const SPEC_AMAZON_COMPLETENESS_ID = "spec_amazon_completeness";

export type SpecReadiness = {
  pageFound: MetricReading;
  additionalPropertyMissing: MetricReading;
  amazonCompleteness: MetricReading;
};

/** Three readings over the latest product-data check per listing, with coverage against active offers. */
export function selectSpecReadiness(bundle: SandboxBundle): SpecReadiness {
  return {
    pageFound: metricReading(bundle, SPEC_PAGE_FOUND_ID, { againstActive: true }),
    additionalPropertyMissing: metricReading(bundle, SPEC_ADDITIONAL_PROPERTY_ID),
    amazonCompleteness: metricReading(bundle, SPEC_AMAZON_COMPLETENESS_ID),
  };
}
