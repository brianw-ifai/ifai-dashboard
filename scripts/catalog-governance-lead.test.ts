// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/catalog-governance-lead.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { formatPct, formatRatio } from "../lib/fender-canvas/format.ts";
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
import { catalogHero } from "../lib/fender-canvas/retail-overview-lead.ts";

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
    offer_price: 100,
    amz_leakage: 0,
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
    mapLeakage: mapLeakageFinding([mapRow()]),
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

test("ready Catalog Governance lead strings match catalogHero percent and ratio", () => {
  const reading = unnestedBundlesFinding(
    [
      bundle({ asin: "B0000000A1", parent_asin: null }),
      bundle({ asin: "B0000000A2", parent_asin: "B0000000ZZ" }),
      bundle({ asin: "B0000000A3", parent_asin: "B0000000YY" }),
    ],
    { catalogBundleCount: 20 },
  );
  const snap = snapshot({ unnestedBundles: reading });
  const hero = catalogHero(snap);

  assert.equal(hero.numerator, 1);
  assert.equal(hero.denominator, 3);
  assert.equal(hero.percent, formatPct(100 / 3));
  assert.equal(hero.ratio, formatRatio(1, 3));
  assert.equal(hero.percent, catalogHero(snap).percent);
  assert.equal(hero.ratio, catalogHero(snap).ratio);
  assert.ok(hero.pie);
  assert.equal(hero.pie.total, 3);
  assert.doesNotMatch(hero.percent, /^0/);
  assert.doesNotMatch(hero.explainer, /448 of 946|this read includes/i);
});

test("missing Catalog Governance reading shows Not available* with no zero share", () => {
  const hero = catalogHero(snapshot({ unnestedBundles: unnestedBundlesFinding(null) }));
  assert.equal(hero.percent, "Not available*");
  assert.equal(hero.ratio, null);
  assert.equal(hero.pie, null);
  assert.equal(hero.numerator, null);
  assert.doesNotMatch(hero.percent, /^0%?$/);
});

test("Catalog Governance panel leads with catalogHero share before the explainer", () => {
  const panel = read("components/v3/live/CatalogGovernancePanel.tsx");

  assert.match(panel, /catalogHero/);
  assert.match(panel, /from "@\/lib\/fender-canvas\/retail-overview-lead"/);
  assert.match(panel, /data-catalog-governance-lead/);
  assert.match(panel, /CitationPieDisc/);
  assert.match(panel, /citation-pie-disc citation-pie-disc-retail/);
  assert.match(panel, /hero\.label/);
  assert.match(panel, /hero\.percent/);
  assert.match(panel, /hero\.ratio/);
  assert.match(panel, /hero\.explainer/);
  assert.match(panel, /hero\.tip/);
  assert.match(panel, /What is catalog governance\?/);
  assert.match(panel, /Unnested bundles/);
  assert.match(panel, /data-amazon-spec-gap-count/);

  const renderStart = panel.indexOf("return (");
  const render = panel.slice(renderStart);
  const leadAt = render.indexOf("<CatalogGovernanceLead");
  const explainerAt = render.indexOf("What is catalog governance?");
  const tableAt = render.indexOf("Unnested bundles");
  const specAt = render.indexOf("<AmazonSpecGapCount");
  assert.ok(leadAt >= 0 && explainerAt > leadAt, "explainer stays under the share");
  assert.ok(tableAt > explainerAt, "bundle table stays under the explainer");
  assert.ok(specAt > tableAt, "Amazon spec gap stays under the table");

  const leadBlock = panel.slice(
    panel.indexOf("function CatalogGovernanceLead"),
    panel.indexOf("export function CatalogGovernancePanel"),
  );
  assert.doesNotMatch(leadBlock, /<button/);
  assert.doesNotMatch(leadBlock, /data-ifai-open/);
  assert.doesNotMatch(leadBlock, /data-ifai-tab/);
  assert.doesNotMatch(panel, /\u2014/);
  assert.doesNotMatch(panel, /retainer|service-fee/i);

  const lines = panel.split("\n").length;
  assert.ok(lines <= 400, `CatalogGovernancePanel.tsx is ${lines} lines`);
});
