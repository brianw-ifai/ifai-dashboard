// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/retail-overview-lead.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  mapLeakageFinding,
  selectRetailHeadline,
  suppressedListingsFinding,
  unnestedBundlesFinding,
  type CatalogBundleRow,
  type MapLeakageRow,
  type PortfolioRetailSnapshot,
  type SuppressionSupportRow,
} from "../lib/fender-canvas/portfolio-retail.ts";
import {
  retailHeadlineChecked,
  retailHeadlinePie,
  retailHeadlinePieTip,
  retailHeadlineTone,
  retailOverviewLead,
} from "../lib/fender-canvas/retail-overview-lead.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");

const CHECKED_AT = new Date(Date.now() - 60_000).toISOString();

function suppression(overrides: Partial<SuppressionSupportRow> = {}): SuppressionSupportRow {
  return {
    asin: "B0EQ000000",
    offer_price: 949.99,
    featured_offer_state: "withheld",
    featured_offer_withheld: true,
    featured_offer_source: "keepa",
    featured_offer_checked_at: CHECKED_AT,
    featured_offer_attempted_at: CHECKED_AT,
    featured_offer_last_error: null,
    competitive_external_price_state: "present",
    competitive_price_threshold_cents: 84999,
    featured_offer_observed_price_cents: 94999,
    featured_offer_observed_shipping_cents: null,
    featured_offer_observed_seller: null,
    ...overrides,
  };
}

function present(overrides: Partial<SuppressionSupportRow> = {}): SuppressionSupportRow {
  return suppression({
    featured_offer_state: "present",
    featured_offer_withheld: false,
    featured_offer_observed_price_cents: 84999,
    featured_offer_observed_seller: "ATVPDKIKX0DER",
    ...overrides,
  });
}

function notChecked(overrides: Partial<SuppressionSupportRow> = {}): SuppressionSupportRow {
  return suppression({
    featured_offer_state: null,
    featured_offer_withheld: null,
    featured_offer_source: null,
    featured_offer_checked_at: null,
    featured_offer_attempted_at: null,
    competitive_external_price_state: null,
    competitive_price_threshold_cents: null,
    featured_offer_observed_price_cents: null,
    ...overrides,
  });
}

function mapRow(overrides: Partial<MapLeakageRow> = {}): MapLeakageRow {
  return {
    map_price: 100,
    offer_price: 80,
    amz_leakage: -20,
    wmt_leakage: null,
    mf_leakage: null,
    ...overrides,
  };
}

function bundle(overrides: Partial<CatalogBundleRow> & Pick<CatalogBundleRow, "asin">): CatalogBundleRow {
  return {
    model_name: "Player II Stratocaster",
    title: "Fender Player II Stratocaster",
    bundle_name: "Starter kit",
    parent_asin: null,
    product_url: "https://www.amazon.com/dp/B0D8TFXHHT",
    is_bundle: true,
    ...overrides,
  };
}

function snapshot(overrides: Partial<PortfolioRetailSnapshot> = {}): PortfolioRetailSnapshot {
  const findings = {
    suppressedListings: suppressedListingsFinding([present()]),
    mapLeakage: mapLeakageFinding([mapRow({ amz_leakage: 0, offer_price: 100 })]),
    unnestedBundles: unnestedBundlesFinding([
      bundle({ asin: "B000000001", parent_asin: "B0000000ZZ" }),
    ]),
    amazonSpecGaps: {
      status: "unavailable" as const,
      issueCount: null,
      missingMessage: "Amazon spec-field readings have not been stored.",
      detail: null,
    },
  };
  const merged = { ...findings, ...overrides };
  return { ...merged, headline: selectRetailHeadline(merged) };
}

test("hero figure is the selectRetailHeadline issue count and merchant label", () => {
  const snap = snapshot({
    suppressedListings: suppressedListingsFinding([suppression(), present(), present()]),
  });
  const headline = selectRetailHeadline(snap);
  assert.equal(headline?.findingId, "suppressed_listings");
  assert.ok(headline?.reading.issueCount != null && headline.reading.issueCount > 0);

  const lead = retailOverviewLead(snap);
  assert.equal(lead.figure, String(headline!.reading.issueCount));
  assert.equal(lead.label, headline!.reading.headlineLabel ?? headline!.label);
  assert.equal(lead.tone, "danger");
  assert.equal(lead.findingId, "suppressed_listings");
});

test("disc compares headline count with the rest of the checked population only", () => {
  const reading = suppressedListingsFinding([
    suppression(),
    present(),
    present(),
    notChecked(),
    notChecked(),
  ]);
  assert.equal(reading.detail?.audited, 3);
  assert.equal(reading.detail?.population, 5);
  assert.equal(reading.issueCount, 1);

  const snap = snapshot({ suppressedListings: reading });
  const headline = selectRetailHeadline(snap);
  assert.ok(headline);

  const coverage = retailHeadlineChecked(headline);
  assert.deepEqual(coverage, { checked: 3, population: 5 });

  const pie = retailHeadlinePie(headline);
  assert.ok(pie);
  assert.equal(pie.total, 3);
  assert.equal(
    pie.slices.reduce((sum, slice) => sum + slice.count, 0),
    3,
    "unchecked listings must not appear as a fine slice",
  );
  assert.deepEqual(
    pie.slices.map((slice) => [slice.key, slice.count]),
    [
      ["contradicted", 1],
      ["matched", 2],
    ],
  );

  const tip = retailHeadlinePieTip(headline);
  assert.match(tip ?? "", /1 of 3|1 .+\. 2 checked/);
  assert.match(tip ?? "", /3 of 5 listings were checked/);
});

test("a missing count shows Not available* and keeps the missing message", () => {
  const snap = snapshot({
    suppressedListings: suppressedListingsFinding(null),
  });
  const lead = retailOverviewLead(snap);
  assert.equal(lead.figure, "Not available*");
  assert.equal(lead.tone, "warning");
  assert.ok(lead.missingMessage);
  assert.equal(lead.pie, null);
  assert.match(lead.missingMessage ?? "", /has not stored a reading|not been stored/i);
});

test("confirmed zeros across the rank show Catalog Health at 0 without inventing a disc", () => {
  const lead = retailOverviewLead(snapshot());
  assert.equal(lead.figure, "0");
  assert.equal(lead.label, "Catalog Health");
  assert.equal(lead.tone, "success");
  assert.equal(lead.pie, null);
  assert.equal(lead.missingMessage, null);
});

test("MAP headline uses decided as the checked population", () => {
  const snap = snapshot({
    suppressedListings: suppressedListingsFinding([present()]),
    mapLeakage: mapLeakageFinding([
      mapRow(),
      mapRow({ amz_leakage: 0, offer_price: 100 }),
      mapRow({ amz_leakage: null, offer_price: 90, map_price: null }),
    ]),
  });
  // First finding is a confirmed zero (suppressed), so MAP is selected when it has issues.
  // present() alone is available_with_zero for suppressed when fully classified.
  const headline = selectRetailHeadline(snap);
  assert.equal(headline?.findingId, "map_leakage");
  assert.equal(retailHeadlineTone(headline!.reading), "danger");
  const coverage = retailHeadlineChecked(headline!);
  assert.ok(coverage);
  assert.equal(coverage.checked, headline!.reading.detail && (headline!.reading.detail as { decided: number }).decided);
  const pie = retailHeadlinePie(headline!);
  assert.ok(pie);
  assert.equal(pie.total, coverage.checked);
});

test("Retail Overview places the hero before the AI search essay", () => {
  const overview = read("components/v3/live/RetailOverview.tsx");
  const lead = read("components/v3/live/RetailOverviewLead.tsx");
  assert.match(overview, /RetailOverviewLead/);
  assert.match(overview, /Seller type: Partner-led/);
  assert.match(overview, /How do these retail findings change AI search\?/);
  assert.match(overview, /FeaturedOfferReadings/);
  assert.match(overview, /retail-finding-grid|Findings/);

  const heroAt = overview.indexOf("<RetailOverviewLead");
  const essayAt = overview.indexOf("How do these retail findings change AI search?");
  assert.ok(heroAt >= 0 && essayAt > heroAt, "essay stays under the hero");

  assert.match(lead, /ai-lead-figure/);
  assert.match(lead, /CitationPieDisc/);
  assert.match(lead, /retailOverviewLead/);
  const model = read("lib/fender-canvas/retail-overview-lead.ts");
  assert.match(model, /Not available\*/);
  assert.doesNotMatch(overview, /\u2014/);
  assert.doesNotMatch(lead, /\u2014/);
  assert.doesNotMatch(lead, /(?<![\w-])title=\{|(?<![\w-])title="/);
  assert.doesNotMatch(model, /\u2014/);
});
