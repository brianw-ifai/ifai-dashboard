// node --experimental-strip-types --import ./scripts/register-ts-extensions.mjs --test scripts/portfolio-retail-display.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { tabSlug } from "../lib/canvas-sdk/canvas-url-state.ts";
import {
  catalogBubble,
  headlineBubble,
  headlineSentence,
  headlineSurface,
  mapBubble,
  RETAIL_PANEL_TABS,
  retailBubbleFaces,
  shortCoverageLine,
  suppressedBubble,
} from "../lib/fender-canvas/portfolio-retail-display.ts";
import {
  FENDER_MAP_NOT_STORED,
  mapPriceFinding,
  RETAIL_FINDING_LABELS,
  selectRetailHeadline,
  suppressedListingsFinding,
  unnestedBundlesFinding,
  type CatalogBundleRow,
  type MapPriceRow,
  type PortfolioRetailFindings,
  type SuppressionSupportRow,
} from "../lib/fender-canvas/portfolio-retail.ts";

const FORBIDDEN = /buy box|partner-led|\b1p\b|unknown seller|active offer/i;

function suppressed(withheld: boolean | null, price = 200): SuppressionSupportRow {
  return {
    offer_price: price,
    competitive_price_threshold_cents: 10000,
    featured_offer_withheld: withheld,
  };
}

function mapRow(listPrice: number | null): MapPriceRow {
  return { asin: "B000000001", map_price: listPrice };
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
    suppressedListings: suppressedListingsFinding([suppressed(true), suppressed(null)]),
    mapPrices: mapPriceFinding([mapRow(749.99), mapRow(null)]),
    unnestedBundles: unnestedBundlesFinding([bundle("B000000001", null), bundle("B000000002", "B000000099")]),
    amazonSpecGaps: { status: "unavailable", issueCount: null, missingMessage: "Amazon spec-field readings have not been stored.", detail: null },
    ...partial,
  };
}

function visible(face: { title: string; stats: string[]; meta?: string; tooltip: { title: string; desc: string } }) {
  return [face.title, face.meta ?? "", face.tooltip.title, face.tooltip.desc, ...face.stats].join(" ");
}

test("panel tab labels keep the reading slugs", () => {
  assert.deepEqual(RETAIL_PANEL_TABS, [
    "Retail Overview",
    "Suppressed Listings",
    "MAP",
    "Catalog Governance",
  ]);
  assert.equal(tabSlug(RETAIL_FINDING_LABELS.suppressed_listings), "suppressed-listings");
  assert.equal(tabSlug(RETAIL_FINDING_LABELS.map_leakage), "map");
  assert.equal(tabSlug(RETAIL_FINDING_LABELS.unnested_bundles), "catalog-governance");
  assert.equal(tabSlug("Retail Overview"), "retail-overview");
});

test("the headline bubble shows the finding and the issue count only", () => {
  const source = findings();
  const headline = selectRetailHeadline(source);
  const face = headlineBubble(source);
  assert.equal(headline?.label, "Suppressed Listings");
  assert.equal(face.subTab, "Retail Overview");
  assert.deepEqual(face.stats, ["Suppressed Listings", "1 listing"]);
  assert.equal(face.meta, undefined);
  assert.doesNotMatch(face.stats.join(" "), /\d[\d,]* of \d/);
  assert.ok(face.tooltip.desc.includes(source.suppressedListings.missingMessage ?? ""));
  assert.doesNotMatch(visible(face), /incomplete|unavailable/i);
  assert.doesNotMatch(visible(face), FORBIDDEN);
});

test("a stored zero stays zero and an unavailable reading names what is missing", () => {
  const zero = suppressedListingsFinding([suppressed(false)]);
  assert.equal(zero.issueCount, 0);
  const zeroFace = suppressedBubble(zero);
  assert.deepEqual(zeroFace.stats, ["0 listings"]);

  const missing = suppressedListingsFinding(null);
  const missingFace = suppressedBubble(missing);
  assert.equal(missing.issueCount, null);
  assert.doesNotMatch(missingFace.stats.join(" "), /\b0\b/);
  assert.match(missingFace.stats.join(" "), /not been stored/i);
  assert.equal(missingFace.stats.join(" "), shortCoverageLine(missing.missingMessage));
});

test("the MAP satellite names the missing MAP file and shows no count or gap", () => {
  const source = findings();
  const map = mapBubble(source.mapPrices);
  assert.equal(map.title, "MAP Prices");
  assert.deepEqual(map.stats, [FENDER_MAP_NOT_STORED]);
  assert.equal(map.status, "warning");
  assert.equal(map.subTab, "MAP");
  assert.match(map.tooltip.desc, /copied from Keepa/);
  assert.doesNotMatch(visible(map), /\$|749\.99|gap/);
  assert.doesNotMatch(visible(map), /\d+ below MAP/);

  const catalog = catalogBubble(source.unnestedBundles);
  assert.match(catalog.stats[0] ?? "", /1 bundle/);
  assert.doesNotMatch(visible(catalog), /12\.50|below MAP|listing below/);
  assert.equal(
    catalog.tooltip.desc,
    "Bundle listings that are not nested under a parent ASIN. Nesting keeps their reviews on the parent listing.",
  );
  assert.equal(catalog.subTab, "Catalog Governance");
});

test("a higher unfinished reading is not replaced by a later count", () => {
  const source = findings({
    suppressedListings: suppressedListingsFinding(null),
    mapPrices: mapPriceFinding([mapRow(100), mapRow(200)]),
  });
  const face = headlineBubble(source);
  assert.equal(face.subTab, "Retail Overview");
  assert.equal(face.stats[0], "Suppressed Listings");
  assert.doesNotMatch(face.stats.join(" "), /2 listings/);
});

test("the shared headline keeps the count, the missing message, and the command-center tab", () => {
  const source = findings();
  const surface = headlineSurface({ phase: "ready", snapshot: { ...source, headline: null } });
  assert.equal(surface.label, "Suppressed Listings");
  assert.equal(surface.countLabel, "1 listing");
  assert.equal(surface.missingMessage, source.suppressedListings.missingMessage);
  assert.equal(surface.tab, "Suppressed Listings");
  assert.equal(surface.commandTab, "Retail Overview");
  const sentence = headlineSentence(surface);
  assert.match(sentence, /1 listing/);
  assert.ok(sentence.includes(source.suppressedListings.missingMessage ?? ""));
  assert.doesNotMatch(sentence, FORBIDDEN);

  const mapHeadline = headlineSurface({
    phase: "ready",
    snapshot: {
      ...findings({
        suppressedListings: suppressedListingsFinding([suppressed(false)]),
      }),
      headline: null,
    },
  });
  assert.equal(mapHeadline.label, "MAP");
  assert.equal(mapHeadline.commandTab, "MAP");
  assert.equal(mapHeadline.tab, "MAP");
});

test("loading and error faces do not invent a count", () => {
  for (const phase of ["loading", "error"] as const) {
    const faces = retailBubbleFaces({ phase });
    const text = [faces.main, faces.suppressed, faces.map, faces.catalog].map(visible).join(" ");
    assert.doesNotMatch(text, /\d/);
    assert.doesNotMatch(text, FORBIDDEN);
  }
});
