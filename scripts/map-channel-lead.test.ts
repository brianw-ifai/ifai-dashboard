// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/map-channel-lead.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { formatPct, formatRatio } from "../lib/fender-canvas/format.ts";
import {
  MAP_PRICES_NOT_STORED,
  mapLeakageFinding,
  selectRetailHeadline,
  suppressedListingsFinding,
  unnestedBundlesFinding,
  type CatalogBundleRow,
  type MapLeakageRow,
  type PortfolioRetailSnapshot,
  type SuppressionSupportRow,
} from "../lib/fender-canvas/portfolio-retail.ts";
import { mapHero } from "../lib/fender-canvas/retail-overview-lead.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");

const CHECKED_AT = new Date(Date.now() - 60_000).toISOString();

function present(overrides: Partial<SuppressionSupportRow> = {}): SuppressionSupportRow {
  return {
    asin: "B0EQ000000",
    offer_price: 949.99,
    featured_offer_state: "present",
    featured_offer_withheld: false,
    featured_offer_source: "keepa",
    featured_offer_checked_at: CHECKED_AT,
    featured_offer_attempted_at: CHECKED_AT,
    featured_offer_last_error: null,
    competitive_external_price_state: "present",
    competitive_price_threshold_cents: 84999,
    featured_offer_observed_price_cents: 84999,
    featured_offer_observed_shipping_cents: null,
    featured_offer_observed_seller: "ATVPDKIKX0DER",
    ...overrides,
  };
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

test("MAP tab lead strings match mapHero for a ready snapshot", () => {
  const reading = mapLeakageFinding([
    mapRow(),
    mapRow({ amz_leakage: 0, offer_price: 100 }),
    mapRow({ amz_leakage: 5, offer_price: 105 }),
    mapRow({ amz_leakage: null, offer_price: 90, map_price: null }),
  ]);
  const snap = snapshot({ mapLeakage: reading });
  const hero = mapHero(snap);

  assert.equal(hero.percent, formatPct(100 / 3));
  assert.equal(hero.ratio, formatRatio(1, 3));
  assert.equal(hero.percent, mapHero(snap).percent);
  assert.equal(hero.ratio, mapHero(snap).ratio);
  assert.equal(hero.label, "MAP leakage");
  assert.notEqual(hero.percent, "0%");
  assert.ok(hero.pie);
});

test("MAP lead shows Not available* when MAP prices are not stored", () => {
  const reading = mapLeakageFinding([
    mapRow({ map_price: null, amz_leakage: null, offer_price: 90 }),
    mapRow({ map_price: null, amz_leakage: null, offer_price: 110 }),
  ]);
  assert.equal(reading.missingMessage, MAP_PRICES_NOT_STORED);
  assert.equal(reading.issueCount, null);

  const hero = mapHero(snapshot({ mapLeakage: reading }));
  assert.equal(hero.percent, "Not available*");
  assert.equal(hero.ratio, null);
  assert.equal(hero.pie, null);
  assert.equal(hero.numerator, null);
  assert.notEqual(hero.percent, "0%");
  assert.equal(hero.percent, mapHero(snapshot({ mapLeakage: reading })).percent);
});

test("MAP panel leads with mapHero share above Summary and keeps the not-stored sentence", () => {
  const panel = read("components/v3/live/MapChannelPanel.tsx");

  assert.match(panel, /mapHero/);
  assert.match(panel, /data-map-lead/);
  assert.match(panel, /data-map-lead-percent/);
  assert.match(panel, /data-map-lead-ratio/);
  assert.match(panel, /CitationPieDisc/);
  assert.match(panel, /citation-pie-disc citation-pie-disc-retail/);
  assert.match(panel, /hero\.label/);
  assert.match(panel, /hero\.percent/);
  assert.match(panel, /hero\.ratio/);
  assert.match(panel, /hero\.explainer/);
  assert.match(panel, /hero\.tip/);
  assert.match(panel, /MAP_PRICES_NOT_STORED/);
  assert.match(panel, /Fender MAP prices have not been stored|MAP_PRICES_NOT_STORED/);

  const leadAt = panel.indexOf("data-map-lead");
  const summaryAt = panel.indexOf("content-box-title\">Summary");
  assert.ok(leadAt > 0, "MAP lead wrapper is present");
  assert.ok(summaryAt > 0, "Summary box is present");
  assert.ok(leadAt < summaryAt, "MAP lead appears before Summary in source");

  assert.doesNotMatch(panel, /data-ifai-open/);
  assert.doesNotMatch(panel, /data-ifai-tab/);
  assert.doesNotMatch(panel, /\u2014/);
  assert.doesNotMatch(panel, /lost revenue/i);
  assert.doesNotMatch(panel, /retainer|IntoFocus fee|service fee/i);

  const lines = panel.split("\n").length;
  assert.ok(lines <= 400, `MapChannelPanel.tsx is ${lines} lines`);
});
