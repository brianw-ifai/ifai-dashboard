import { unavailable } from "../reading/build";
import type { Rate, Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const SPEC_PAGE_FOUND_ID = "spec_fender_page_found";
export const SPEC_ADDITIONAL_PROPERTY_ID = "spec_additional_property_missing";
export const SPEC_AMAZON_COMPLETENESS_ID = "spec_amazon_completeness";

export type SpecReadiness = {
  pageFound: MetricReading;
  additionalPropertyMissing: MetricReading;
  amazonCompleteness: MetricReading;
  /** Found brand pages that do carry an additionalProperty block: found minus missing, over found. */
  additionalPropertyPresent: Reading<Rate>;
};

/** The complement of the stored "missing" count, as a rate over the found pages. Never typed. */
export function additionalPropertyPresentReading(missing: MetricReading): Reading<Rate> {
  const r = missing.reading;
  if (r.status === "unavailable") return unavailable(r.reason, SPEC_ADDITIONAL_PROPERTY_ID, r.coverage);
  const found = missing.denominator;
  const absent = missing.numerator;
  if (found === null || absent === null) return unavailable("The found or missing count is not stored.", SPEC_ADDITIONAL_PROPERTY_ID, r.coverage);
  if (found === 0) return unavailable("No brand page was found, so there is no rate to show.", SPEC_ADDITIONAL_PROPERTY_ID, r.coverage);
  const present = found - absent;
  return { status: r.status, value: { numerator: present, denominator: found, pct: (present / found) * 100 }, coverage: r.coverage, registryId: SPEC_ADDITIONAL_PROPERTY_ID };
}

/** Three readings over the latest product-data check per listing, with coverage against active offers. */
export function selectSpecReadiness(bundle: SandboxBundle): SpecReadiness {
  const additionalPropertyMissing = metricReading(bundle, SPEC_ADDITIONAL_PROPERTY_ID);
  return {
    pageFound: metricReading(bundle, SPEC_PAGE_FOUND_ID, { againstActive: true }),
    additionalPropertyMissing,
    amazonCompleteness: metricReading(bundle, SPEC_AMAZON_COMPLETENESS_ID),
    additionalPropertyPresent: additionalPropertyPresentReading(additionalPropertyMissing),
  };
}
