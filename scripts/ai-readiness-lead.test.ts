// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/ai-readiness-lead.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  AMAZON_COMPLETENESS_BANDS,
  aiReadinessHeroes,
  averageAcrossRatio,
  averagePercentPie,
  missingAdditionalPropertyHero,
  pageFoundHero,
  shareCountPie,
} from "../lib/fender-canvas/ai-readiness-lead.ts";
import { formatPct, formatRatio } from "../lib/fender-canvas/format.ts";
import type { CanvasMetricsRow } from "../lib/fender-canvas/types.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");

function metrics(partial: Partial<CanvasMetricsRow>): CanvasMetricsRow {
  return {
    catalog_skus: null,
    catalog_bundles: null,
    seller_harvested: null,
    seller_harvested_pct: null,
    division_count: null,
    bb_total: null,
    bb_1p: null,
    bb_3p: null,
    bb_unharvested: null,
    bb_no_offer: null,
    bb_1p_pct: null,
    bb_3p_pct: null,
    bb_unharvested_pct: null,
    active_offer_coverage_pct: null,
    amz_below_map: null,
    amz_avg_drift: null,
    wmt_checked: null,
    wmt_leaks: null,
    mf_checked: null,
    mf_leaks: null,
    offamz_avg_leak: null,
    map_violation_skus: null,
    bundle_reviews: null,
    spec_checked: 925,
    spec_avg_amazon_pct: 91.6,
    spec_fender_found: 123,
    spec_fender_found_pct: 13.3,
    spec_avg_fender_pct: 40,
    spec_missing_additional_property: 123,
    spec_missing_field_types: null,
    sim_total: null,
    sim_runs: null,
    sim_resolved: null,
    sim_wins: null,
    sim_win_pct: null,
    sim_unclear: null,
    sim_errors: null,
    sim_hallucinations: null,
    sim_hallucination_risk: null,
    weakest_category: null,
    weakest_win_pct: null,
    weakest_top_competitor: null,
    weakest_competitor_pct: null,
    weakest_sov_gap_pts: null,
    strongest_category: null,
    strongest_win_pct: null,
    strongest_wins: null,
    strongest_resolved: null,
    ...partial,
  } as CanvasMetricsRow;
}

test("page-found hero uses the stored percent, found of checked, and that pie", () => {
  const hero = pageFoundHero(metrics({}));
  assert.equal(hero.percent, formatPct(13.3));
  assert.equal(hero.ratio, formatRatio(123, 925));
  assert.ok(hero.pie);
  assert.equal(hero.pie.total, 925);
  assert.deepEqual(
    hero.pie.slices.map((slice) => [slice.label, slice.count]),
    [
      ["Page found", 123],
      ["Rest of this population", 802],
    ],
  );
  assert.equal(hero.filterControl, true);
});

test("Amazon completeness keeps the average and does not invent listings at 100%", () => {
  const heroes = aiReadinessHeroes(metrics({}));
  const amazon = heroes.find((hero) => hero.id === "amazon_completeness");
  assert.ok(amazon);
  assert.equal(amazon.percent, formatPct(91.6));
  assert.equal(amazon.ratio, "Across 925 checked SKUs");
  assert.doesNotMatch(amazon.ratio ?? "", /^\d+ of \d+$/);
  assert.ok(amazon.pie);
  assert.equal(amazon.pie.total, 100);
  const filled = amazon.pie.slices.find((slice) => slice.key === "matched");
  assert.ok(filled);
  assert.equal(filled.count, 91.6);
  assert.equal(AMAZON_COMPLETENESS_BANDS.dangerBelow, 85);
  assert.equal(AMAZON_COMPLETENESS_BANDS.warnBelow, 92);
  assert.equal(amazon.color, "var(--warning-amber)");
});

test("fender completeness averages over found pages and does not hard-code 7 of 8", () => {
  const heroes = aiReadinessHeroes(metrics({ spec_fender_found: 11, spec_avg_fender_pct: 55.5 }));
  const fender = heroes.find((hero) => hero.id === "fender_completeness");
  assert.ok(fender);
  assert.equal(fender.percent, formatPct(55.5));
  assert.equal(fender.ratio, "Across 11 found pages");
  assert.notEqual(fender.ratio, "7 of 8");
  assert.ok(fender.pie);
  assert.equal(fender.pie.slices.find((slice) => slice.key === "matched")?.count, 55.5);
});

test("missing additionalProperty is missing of found, with that percent and pie", () => {
  const hero = missingAdditionalPropertyHero(
    metrics({ spec_fender_found: 8, spec_missing_additional_property: 5 }),
  );
  assert.equal(hero.percent, formatPct((100 * 5) / 8));
  assert.equal(hero.ratio, formatRatio(5, 8));
  assert.ok(hero.pie);
  assert.equal(hero.pie.total, 8);
  assert.deepEqual(
    hero.pie.slices.map((slice) => [slice.label, slice.count]),
    [
      ["Missing additionalProperty", 5],
      ["Rest of this population", 3],
    ],
  );
});

test("SKUs checked is not its own hero pie", () => {
  const heroes = aiReadinessHeroes(metrics({}));
  assert.equal(heroes.length, 4);
  assert.equal(
    heroes.map((hero) => hero.id).includes("skus_checked" as never),
    false,
  );
  assert.equal(averageAcrossRatio(925, "checked SKUs"), "Across 925 checked SKUs");
  assert.equal(shareCountPie("x", "t", "a", 1, 0), null);
  assert.equal(averagePercentPie("x", "t", null), null);
});

test("the lead UI ships heroes, the filter pill, and the Findability distinction", () => {
  const lead = read("components/v3/live/AiReadinessLead.tsx");
  assert.match(lead, /data-ai-readiness-lead/);
  assert.match(lead, /data-ai-readiness-hero=/);
  assert.match(lead, /CitationPieDisc/);
  assert.match(lead, /data-spec-filter="missing-fender-page"/);
  assert.match(lead, /Official-page outcomes are on the Findability tab/);
  assert.match(lead, /family page there\s+is not an exact product page/);
  assert.match(lead, /ifai-term/);
  assert.match(lead, /data-ifai-tooltip-title/);
  assert.match(lead, /data-ifai-tooltip-desc/);
  assert.doesNotMatch(lead, /(?<![\w-])title=/);
  assert.doesNotMatch(lead, /\u2014/);
  assert.doesNotMatch(lead, />\s*Metric\s*</);
  assert.doesNotMatch(lead, /SKUs checked/);

  const panel = read("components/v3/live/CatalogReadinessSpec.tsx");
  assert.match(panel, /AiReadinessLead/);
  assert.doesNotMatch(panel, /FenderSpecSummary/);
});
