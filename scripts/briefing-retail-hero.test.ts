// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/briefing-retail-hero.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  BRIEFING_COUNT_MISSING,
  briefingRetailLead,
} from "../lib/fender-canvas/briefing-retail-lead.ts";
import { headlineSurface } from "../lib/fender-canvas/portfolio-retail-display.ts";
import {
  mapLeakageFinding,
  selectRetailHeadline,
  suppressedListingsFinding,
  unnestedBundlesFinding,
  type CatalogBundleRow,
  type MapLeakageRow,
  type PortfolioRetailFindings,
  type SuppressionSupportRow,
} from "../lib/fender-canvas/portfolio-retail.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");

const CHECKED_AT = new Date(Date.now() - 60_000).toISOString();

function suppressed(price = 200): SuppressionSupportRow {
  return {
    asin: "B0EQ000000",
    offer_price: price,
    featured_offer_state: "withheld",
    featured_offer_withheld: true,
    featured_offer_source: "keepa",
    featured_offer_checked_at: CHECKED_AT,
    featured_offer_attempted_at: CHECKED_AT,
    featured_offer_last_error: null,
    competitive_external_price_state: "present",
    competitive_price_threshold_cents: 10000,
    featured_offer_observed_price_cents: 20000,
    featured_offer_observed_shipping_cents: null,
    featured_offer_observed_seller: null,
  };
}

function present(): SuppressionSupportRow {
  return {
    ...suppressed(),
    featured_offer_state: "present",
    featured_offer_withheld: false,
    featured_offer_observed_price_cents: 9000,
  };
}

function notChecked(): SuppressionSupportRow {
  return {
    ...suppressed(),
    featured_offer_state: null,
    featured_offer_withheld: null,
    featured_offer_source: null,
    featured_offer_checked_at: null,
    featured_offer_attempted_at: null,
    competitive_external_price_state: null,
    competitive_price_threshold_cents: null,
    featured_offer_observed_price_cents: null,
  };
}

function mapRow(leak: number | null): MapLeakageRow {
  return {
    map_price: 100,
    offer_price: 80,
    amz_leakage: leak,
    wmt_leakage: null,
    mf_leakage: null,
  };
}

function bundle(asin: string, parent: string | null): CatalogBundleRow {
  return {
    asin,
    model_name: asin,
    title: null,
    bundle_name: null,
    parent_asin: parent,
    product_url: null,
    is_bundle: true,
  };
}

function findings(partial: Partial<PortfolioRetailFindings> = {}): PortfolioRetailFindings {
  return {
    suppressedListings: suppressedListingsFinding([suppressed(), present(), notChecked()]),
    mapLeakage: mapLeakageFinding([mapRow(-12.5), mapRow(4)]),
    unnestedBundles: unnestedBundlesFinding([
      bundle("B000000001", null),
      bundle("B000000002", "B000000099"),
    ]),
    amazonSpecGaps: {
      status: "unavailable",
      issueCount: null,
      missingMessage: "Amazon spec-field readings have not been stored.",
      detail: null,
    },
    ...partial,
  };
}

test("briefing lead figure matches Catalog Health headline count and label", () => {
  const snapshot = findings();
  const headline = selectRetailHeadline(snapshot);
  const surface = headlineSurface({ phase: "ready", snapshot: { ...snapshot, headline } });
  const lead = briefingRetailLead({ phase: "ready", snapshot: { ...snapshot, headline } });
  assert.equal(headline?.reading.issueCount, 1);
  assert.equal(lead.figure, "1");
  assert.equal(lead.label, surface.label);
  assert.equal(lead.label, headline?.reading.headlineLabel);
  assert.equal(lead.color, "var(--danger-red)");
});

test("disc uses checked population only; unchecked is not the fine slice", () => {
  const snapshot = findings();
  const headline = selectRetailHeadline(snapshot);
  const lead = briefingRetailLead({
    phase: "ready",
    snapshot: { ...snapshot, headline },
  });
  assert.ok(lead.pie);
  assert.equal(lead.pie.total, 2, "audited/checked only, not monitored population");
  assert.equal(snapshot.suppressedListings.detail?.population, 3);
  assert.equal(snapshot.suppressedListings.detail?.audited, 2);
  assert.deepEqual(
    lead.pie.slices.map((s) => [s.key, s.count]),
    [
      ["contradicted", 1],
      ["matched", 1],
    ],
  );
  assert.match(lead.tip ?? "", /1 of 2 checked/);
  assert.match(lead.tip ?? "", /2 of 3 monitored/);
  assert.doesNotMatch(lead.tip ?? "", /\u2014/);
});

test("a missing stored count shows Not available* and keeps the missing message", () => {
  const snapshot = findings({
    suppressedListings: suppressedListingsFinding(null),
  });
  const headline = selectRetailHeadline(snapshot);
  const lead = briefingRetailLead({
    phase: "ready",
    snapshot: { ...snapshot, headline },
  });
  assert.equal(headline?.reading.issueCount, null);
  assert.equal(lead.figure, BRIEFING_COUNT_MISSING);
  assert.equal(lead.figure, "Not available*");
  assert.ok(lead.missingMessage);
  assert.equal(lead.pie, null);
  assert.equal(lead.figure.includes("0"), false);
});

test("hub Briefing override leads with the hero before the essay", () => {
  const spokes = read("components/v3/build-live-spokes.tsx");
  const hero = read("components/v3/live/BriefingRetailHero.tsx");
  const lead = read("lib/fender-canvas/briefing-retail-lead.ts");
  const briefingHtml = JSON.parse(read("data/fender-v3-spec.json")).spokes.hub.tabTemplates[0] as string;
  assert.match(spokes, /BriefingRetailHero/);
  assert.match(
    spokes,
    /0:\s*\([^)]*\)\s*=>\s*\(\s*<>\s*<BriefingRetailHero[\s\S]*?htmlBlock\(bindCopy\(HUB_BRIEFING_HTML/,
    "essay HTML stays under the hero",
  );
  assert.match(hero, /ai-lead-figure/);
  assert.match(hero, /CitationPieDisc/);
  assert.match(hero, /briefingRetailLead/);
  assert.match(lead, /selectRetailHeadline/);
  assert.match(lead, /headlineSurface/);
  assert.doesNotMatch(briefingHtml, /\{retail_headline\}/);
  assert.match(briefingHtml, /Buy Box/);
  assert.match(briefingHtml, /\{enterprise_potential\}/);
  assert.match(briefingHtml, /commercial selling model/i);
  assert.doesNotMatch(hero, /\u2014/);
  assert.doesNotMatch(lead, /\u2014/);
  assert.doesNotMatch(hero, /\stitle=/);
  assert.doesNotMatch(spokes, /DIY|Done-with-You|Done-for-You|retainer|service-fee/i);
});

test("MAP headline disc also excludes unchecked listings", () => {
  const snapshot = findings({
    suppressedListings: suppressedListingsFinding([present(), present()]),
    mapLeakage: mapLeakageFinding([mapRow(-5), mapRow(null), mapRow(-2)]),
  });
  const headline = selectRetailHeadline(snapshot);
  assert.equal(headline?.findingId, "map_leakage");
  const lead = briefingRetailLead({
    phase: "ready",
    snapshot: { ...snapshot, headline },
  });
  assert.equal(lead.figure, "2");
  assert.ok(lead.pie);
  assert.equal(lead.pie.total, 2, "decided rows only");
  assert.equal(snapshot.mapLeakage.detail?.population, 3);
  assert.equal(snapshot.mapLeakage.detail?.decided, 2);
});
