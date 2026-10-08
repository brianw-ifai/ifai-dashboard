import { unavailable } from "../reading/build";
import type { Coverage, Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { activePopulation, metricReading, type MetricReading } from "./common";

export const FEATURED_OFFER_PRESENT_ID = "featured_offer_present";
export const FEATURED_OFFER_SUPPRESSED_ID = "featured_offer_suppressed";
const CATALOG_ID = "catalog_monitored";

/** Listings where Amazon shows a Featured Offer, over the listings whose flag was read. */
export function selectFeaturedOfferPresent(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, FEATURED_OFFER_PRESENT_ID, { againstActive: true });
}

/** Listings with the Featured Offer withheld and the offer above the Competitive External Price. */
export function selectFeaturedOfferSuppressed(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, FEATURED_OFFER_SUPPRESSED_ID, { againstActive: true });
}

export type FeaturedOfferStates = {
  /** Listings whose Featured Offer flag was read (the stacked bar's total). */
  read: Reading<number>;
  /** Featured Offer shown. */
  present: Reading<number>;
  /** Withheld, but not counted above the benchmark (within it, or no benchmark read for the listing). */
  withheldWithinBenchmark: Reading<number>;
  /** Withheld and above the Competitive External Price: the suppressed finding. */
  withheldAboveBenchmark: Reading<number>;
  /** Active offers with no benchmark reading yet. */
  benchmarkNotRead: Reading<number>;
  /** Active offers, the benchmark coverage population. */
  active: Reading<number>;
};

/**
 * The Featured Offer states the retail first view stacks. Every count is the stored numerator or
 * denominator of featured_offer_present and featured_offer_suppressed, or the difference of two of
 * them; nothing is typed. Each state is unavailable when its inputs are.
 */
export function selectFeaturedOfferStates(bundle: SandboxBundle): FeaturedOfferStates {
  const present = selectFeaturedOfferPresent(bundle);
  const suppressed = selectFeaturedOfferSuppressed(bundle);
  const active = activePopulation(bundle);
  const p = present.reading;
  const s = suppressed.reading;

  const sReason = s.status === "unavailable" ? s.reason : null;
  const above: Reading<number> = s.status === "unavailable" ? unavailable(s.reason, FEATURED_OFFER_SUPPRESSED_ID) : (s as Reading<number>);
  const activeReading: Reading<number> =
    active === null
      ? unavailable("The active-offer count is not stored.", CATALOG_ID)
      : { status: "complete", value: active, coverage: fallbackCoverage(p, active), registryId: CATALOG_ID };

  if (p.status === "unavailable") {
    const none = unavailable<number>(p.reason, FEATURED_OFFER_PRESENT_ID);
    return {
      read: none,
      present: none,
      withheldWithinBenchmark: unavailable(sReason ?? p.reason, FEATURED_OFFER_SUPPRESSED_ID),
      withheldAboveBenchmark: above,
      benchmarkNotRead: benchmarkNotRead(active, suppressed, sReason, s.status === "unavailable" ? null : s.coverage, s.status),
      active: activeReading,
    };
  }

  const status = p.status;
  const coverage = p.coverage;
  const mk = (value: number | null, registryId: string, reason: string): Reading<number> =>
    value === null || value < 0 ? unavailable(reason, registryId, coverage) : { status, value, coverage, registryId };
  const withheld = present.numerator !== null && present.denominator !== null ? present.denominator - present.numerator : null;
  const aboveCount = s.status === "unavailable" ? null : suppressed.numerator;

  return {
    read: mk(present.denominator, FEATURED_OFFER_PRESENT_ID, "The Featured Offer read count is not stored."),
    present: mk(present.numerator, FEATURED_OFFER_PRESENT_ID, "The present count is not stored."),
    withheldWithinBenchmark:
      withheld === null || aboveCount === null
        ? unavailable(sReason ?? "The withheld count is not stored.", FEATURED_OFFER_SUPPRESSED_ID, coverage)
        : mk(withheld - aboveCount, FEATURED_OFFER_SUPPRESSED_ID, "The withheld count is below the suppressed count."),
    withheldAboveBenchmark: above,
    benchmarkNotRead: benchmarkNotRead(active, suppressed, sReason, s.status === "unavailable" ? null : s.coverage, s.status),
    active: activeReading,
  };
}

function fallbackCoverage(p: Reading<unknown>, active: number): Coverage {
  return p.status === "unavailable" && !p.coverage ? { read: active, population: active, asOf: null, runId: null, source: "metric_value" } : (p.coverage as Coverage);
}

function benchmarkNotRead(
  active: number | null,
  suppressed: MetricReading,
  sReason: string | null,
  coverage: Coverage | null,
  status: Reading<unknown>["status"],
): Reading<number> {
  if (active === null) return unavailable("The active-offer count is not stored.", FEATURED_OFFER_SUPPRESSED_ID, coverage);
  if (sReason !== null || suppressed.denominator === null) return unavailable(sReason ?? "The benchmark read count is not stored.", FEATURED_OFFER_SUPPRESSED_ID, coverage);
  const value = active - suppressed.denominator;
  if (value < 0 || !coverage) return unavailable("The benchmark read count exceeds the active offers.", FEATURED_OFFER_SUPPRESSED_ID, coverage);
  return { status: status === "partial" ? "partial" : "complete", value, coverage, registryId: FEATURED_OFFER_SUPPRESSED_ID };
}
