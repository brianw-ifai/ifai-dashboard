import type { CanvasMetric } from "@/lib/canvas-sdk/types";
import { beginnerSovLine } from "@/lib/fender-canvas/beginner-sov";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import {
  formatInt,
  formatPct,
  formatRatio,
  formatUsd,
  pendingLabel,
} from "@/lib/fender-canvas/format";

function toneFromPct(pct: number | null, dangerBelow: number, warnBelow: number) {
  if (pct == null) return "neutral" as const;
  if (pct < dangerBelow) return "danger" as const;
  if (pct < warnBelow) return "warning" as const;
  return "success" as const;
}

function mapViolationsMetric(retail: RetailCanvasRead): CanvasMetric {
  const base = {
    id: "flagged-asins",
    spokeId: "ecommerce" as const,
    label: "MAP violations",
    subTab: "MAP",
    provenance: "live" as const,
  };
  if (retail.phase === "loading") {
    return {
      ...base,
      value: "Loading",
      detail: "The MAP listing read is still loading.",
      tone: "warning",
    };
  }
  if (retail.phase === "error") {
    return {
      ...base,
      value: "Unavailable",
      detail: "The MAP listing read did not succeed.",
      tone: "warning",
    };
  }
  const reading = retail.snapshot.mapLeakage;
  if (reading.status === "unavailable" || reading.issueCount == null) {
    return {
      ...base,
      value: "Unavailable",
      detail: reading.missingMessage ?? "The MAP listing read did not succeed.",
      tone: "warning",
    };
  }
  return {
    ...base,
    value: formatInt(reading.issueCount),
    detail:
      reading.status === "incomplete"
        ? "Listings below MAP in this partial listing read. This is not a final count."
        : "Listings below MAP in this listing read",
    tone: reading.issueCount > 0 ? "danger" : "success",
  };
}

export function buildLiveMetrics(
  bundle: CanvasBundle,
  retail: RetailCanvasRead = { phase: "loading" },
): Record<string, CanvasMetric> {
  const { m, cats } = bundle;
  const beginner = cats.find((c) => c.category === "beginner");

  const strandedReviews =
    m.bundle_reviews == null ? pendingLabel() : formatInt(m.bundle_reviews);

  return {
    catalogSkus: {
      id: "catalog-skus",
      spokeId: "hub",
      label: "Monitored Electric SKUs",
      value: formatInt(m.catalog_skus),
      detail: `${formatInt(m.catalog_bundles)} bundles · ${formatInt(bundle.divisions.length || m.division_count)} divisions`,
      tone: "neutral",
      subTab: "Brand Divisions",
      provenance: "live",
    },
    activeOfferCoverage: {
      id: "active-offer-coverage",
      spokeId: "hub",
      label: "Active Amazon Offer Coverage",
      value: formatPct(m.active_offer_coverage_pct),
      detail: formatRatio(m.bb_total, m.catalog_skus),
      tone: toneFromPct(m.active_offer_coverage_pct, 35, 50),
      subTab: "Executive Briefing",
      provenance: "live",
    },
    buyBoxRetention: {
      id: "buy-box-retention",
      spokeId: "ecommerce",
      label: "Confirmed Amazon 1P Buy Box",
      value: formatPct(m.bb_1p_pct),
      detail: `${formatInt(m.bb_1p)} 1P vs ${formatInt(m.bb_3p)} 3P`,
      tone: toneFromPct(m.bb_1p_pct, 15, 40),
      subTab: "Retail Overview",
      provenance: "live",
    },
    sellerDataCoverage: {
      id: "seller-data-coverage",
      spokeId: "ecommerce",
      label: "Seller Data Harvested",
      value: formatInt(m.seller_harvested),
      detail: `${formatPct(m.seller_harvested_pct)} of catalog`,
      tone: toneFromPct(m.seller_harvested_pct, 10, 40),
      subTab: "Retail Overview",
      provenance: "live",
    },
    flaggedAsins: mapViolationsMetric(retail),
    strandedReviews: {
      id: "stranded-reviews",
      spokeId: "ecommerce",
      label: "Stranded Customer Reviews",
      value: strandedReviews,
      detail: "Split across partner bundle pages",
      tone: m.bundle_reviews == null ? "warning" : "danger",
      subTab: "Catalog",
      provenance: "live",
    },
    amazonMapDrift: {
      id: "amazon-map-drift",
      spokeId: "ecommerce",
      label: "Average Amazon Price Drift",
      value: formatUsd(m.amz_avg_drift, { signed: true }),
      detail: `Across ${formatInt(m.amz_below_map)} ASINs below MAP on Amazon`,
      tone: "danger",
      subTab: "MAP",
      provenance: "live",
    },
    overallAiWinRate: {
      id: "overall-ai-win-rate",
      spokeId: "aeo",
      label: "Overall AI Win Rate",
      value: formatPct(m.sim_win_pct),
      detail: `${formatInt(m.sim_resolved)} resolved answers`,
      tone: toneFromPct(m.sim_win_pct, 65, 80),
      subTab: "Dual-Index",
      provenance: "live",
    },
    beginnerAiWinRate: {
      id: "beginner-ai-win-rate",
      spokeId: "aeo",
      label: "Beginner AI Win Rate",
      value: formatPct(beginner?.fender_win_pct ?? null),
      detail: `${beginner?.top_competitor ?? pendingLabel()} ${formatPct(beginner?.top_competitor_pct ?? null)}`,
      tone: toneFromPct(beginner?.fender_win_pct ?? null, 50, 70),
      subTab: "Simulations",
      provenance: "live",
    },
    resolvedSimulations: {
      id: "resolved-simulations",
      spokeId: "aeo",
      label: "Resolved AI Simulations",
      value: `${formatInt(m.sim_resolved)} / ${formatInt(m.sim_total)}`,
      detail: `${formatInt(m.sim_unclear)} unclear · ${formatInt(m.sim_errors)} errors`,
      tone: "warning",
      subTab: "Simulations",
      provenance: "live",
    },
    confirmedHallucinations: {
      id: "confirmed-hallucinations",
      spokeId: "aeo",
      label: "Confirmed Spec Hallucinations",
      value: formatInt(m.sim_hallucinations),
      detail: `Of ${formatInt(m.sim_hallucination_risk)} hallucination-risk answers`,
      tone: "danger",
      subTab: "Hallucination",
      provenance: "live",
    },
    fenderFindability: {
      id: "fender-findability",
      spokeId: "specs",
      label: "fender.com Product Findability",
      value: formatPct(m.spec_fender_found_pct),
      detail: formatRatio(m.spec_fender_found, m.spec_checked),
      tone: toneFromPct(m.spec_fender_found_pct, 25, 50),
      subTab: "AI Readiness",
      provenance: "live",
    },
    machineReadableSpecs: {
      id: "machine-readable-specs",
      spokeId: "specs",
      label: "Machine-Readable Spec Coverage",
      value: formatPct(m.spec_avg_amazon_pct),
      detail: "Amazon attribute completeness",
      tone: toneFromPct(m.spec_avg_amazon_pct, 85, 92),
      subTab: "Machine Readability",
      provenance: "live",
    },
    missingSchemaFields: {
      id: "missing-schema-fields",
      spokeId: "specs",
      label: "Pages Missing additionalProperty",
      value: formatInt(m.spec_missing_additional_property),
      detail: "fender.com pages in the spec read",
      tone: "warning",
      subTab: "Machine Readability",
      provenance: "live",
    },
    beginnerSovGap: {
      id: "beginner-sov-gap",
      spokeId: "competitors",
      label: "Beginner Category SOV Gap",
      value: `${formatInt(m.weakest_sov_gap_pts)} pts`,
      detail:
        beginnerSovLine(bundle.sov) ??
        `vs ${m.weakest_top_competitor ?? pendingLabel()} in ${m.weakest_category ?? pendingLabel()}`,
      tone: "danger",
      subTab: "Battlecards",
      provenance: "live",
    },
    strongestCategorySov: {
      id: "strongest-category-sov",
      spokeId: "competitors",
      label: "Strongest Category SOV",
      value: formatPct(m.strongest_win_pct),
      detail: `${m.strongest_category ?? pendingLabel()} · ${formatRatio(m.strongest_wins, m.strongest_resolved)}`,
      tone: "success",
      subTab: "Battlecards",
      provenance: "live",
    },
    prioritizedFixes: {
      id: "prioritized-fixes",
      spokeId: "suggestions",
      label: "Prioritized Action Items",
      value: "Estimates",
      detail: "Revenue figures on this spoke are estimates",
      tone: "warning",
      subTab: "Priority Matrix",
      provenance: "estimate",
    },
    phaseOneLift: {
      id: "phase-one-lift",
      spokeId: "suggestions",
      label: "Recoverable Revenue",
      value: "+$680K",
      detail: "Phase 1 annual estimate",
      tone: "success",
      subTab: "ROI",
      provenance: "estimate",
    },
    enterprisePotential: {
      id: "enterprise-potential",
      spokeId: "suggestions",
      label: "Enterprise GMV Potential",
      value: "+$38M to $62M",
      detail: "Annual estimate · full portfolio",
      tone: "success",
      subTab: "ROI",
      provenance: "estimate",
    },
    dayNinetyBuyBoxTarget: {
      id: "day-90-buy-box-target",
      spokeId: "roadmap",
      label: "90-day plan",
      value: "3 phases",
      detail: "MAP, catalog nesting, and estimated lift",
      tone: "success",
      subTab: "30-60-90",
      provenance: "live",
    },
  };
}

export function liveWidgetMetrics(bundle: CanvasBundle): CanvasMetric[] {
  return Object.values(buildLiveMetrics(bundle));
}
