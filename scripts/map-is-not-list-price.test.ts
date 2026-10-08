// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/map-is-not-list-price.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fenderGlossary } from "../components/v3/glossary.ts";
import { buildLiveCommandCenter } from "../lib/fender-canvas/command-center-from-live.ts";
import {
  listingChannelFacts,
  mapTabModel,
  type MapSourceRow,
} from "../lib/fender-canvas/map-channels.ts";
import { channelSummaryText } from "../lib/fender-canvas/map-reading-status.ts";
import { buildLiveMetrics } from "../lib/fender-canvas/metrics-from-live.ts";
import {
  FENDER_MAP_NOT_STORED,
  mapPriceFinding,
} from "../lib/fender-canvas/portfolio-retail.ts";
import {
  mapBubble,
  type RetailCanvasRead,
} from "../lib/fender-canvas/portfolio-retail-display.ts";
import { mapReadLine } from "../lib/fender-canvas/retail-copy.ts";
import type { CanvasBundle, CanvasMetricsRow } from "../lib/fender-canvas/types.ts";

/**
 * `map_price` is Amazon's list price copied from Keepa. These are the two rows that used to wear
 * a gap against it: B0HJDFP2XS showed -$150 under a 749.99 list price, and B0CMW1YK74 showed its
 * Amazon and Musician's Friend prices as MAP gaps.
 */
const PROVING_ROWS: MapSourceRow[] = [
  {
    asin: "B0HJDFP2XS",
    model_name: "Squier Paranormal Troy Van Leeuwen Telecaster XII",
    title: null,
    map_price: 749.99,
    offer_price: 599.99,
    wmt_price: null,
    wmt_url: null,
    mf_price: 599.99,
  },
  {
    asin: "B0CMW1YK74",
    model_name: "Fender American Professional II Stratocaster",
    title: null,
    map_price: 2497.99,
    offer_price: 2049.99,
    wmt_price: null,
    wmt_url: null,
    mf_price: 1639.99,
  },
];

function metricsRow(): CanvasMetricsRow {
  return {
    amz_below_map: 466,
    amz_avg_drift: -25,
    map_violation_skus: 466,
    wmt_leaks: 0,
    mf_leaks: 0,
    offamz_avg_leak: null,
  } as unknown as CanvasMetricsRow;
}

function bundle(): CanvasBundle {
  return {
    m: metricsRow(),
    cats: [],
    engines: [],
    sov: [],
    divisions: [],
    missing: [],
    fresh: [],
  } as unknown as CanvasBundle;
}

function retailRead(): RetailCanvasRead {
  return {
    phase: "ready",
    snapshot: {
      headline: null,
      suppressedListings: {
        status: "available_with_issues",
        issueCount: 48,
        missingMessage: null,
        detail: null,
      },
      mapPrices: mapPriceFinding(
        PROVING_ROWS.map((row) => ({ asin: row.asin, map_price: row.map_price })),
      ),
      unnestedBundles: {
        status: "available_with_issues",
        issueCount: 12,
        missingMessage: null,
        detail: null,
      },
      amazonSpecGaps: {
        status: "unavailable",
        issueCount: null,
        missingMessage: "Amazon spec-field readings have not been stored.",
        detail: null,
      },
    },
  };
}

test("B0HJDFP2XS keeps its Musician's Friend price and shows no MAP gap", () => {
  const facts = listingChannelFacts(PROVING_ROWS[0]!);
  const musiciansFriend = facts.find((fact) => fact.key === "musicians-friend");

  assert.equal(musiciansFriend?.price, 599.99);
  assert.equal(facts.find((fact) => fact.key === "amazon")?.price, 599.99);
  assert.equal(facts.some((fact) => fact.key === "walmart"), false);
  assert.equal(
    JSON.stringify(facts).includes("150"),
    false,
    "599.99 under a 749.99 list price is not a -$150 MAP gap",
  );
  assert.equal(facts.every((fact) => !("gap" in fact)), true);
});

test("B0CMW1YK74 shows its Amazon and Musician's Friend prices, neither as a MAP gap", () => {
  const facts = listingChannelFacts(PROVING_ROWS[1]!);

  assert.deepEqual(
    facts.map((fact) => [fact.name, fact.price]),
    [
      ["Amazon", 2049.99],
      ["Musician's Friend", 1639.99],
    ],
  );
  assert.equal(facts.every((fact) => !("gap" in fact)), true);
  assert.equal(facts.every((fact) => fact.price > 0), true, "no signed gap survives as a value");
});

test("the MAP tab model counts stored prices and keeps Sweetwater and Reverb off", () => {
  const model = mapTabModel(PROVING_ROWS, [
    { asin: "B0HJDFP2XS", channel: "sweetwater", price: null, url: null, checked_at: null },
    { asin: "B0CMW1YK74", channel: "reverb", price: 0, url: null, checked_at: null },
  ]);

  assert.deepEqual(model.channels, [
    { name: "Amazon", count: 2 },
    { name: "Musician's Friend", count: 2 },
  ]);
  assert.deepEqual(model.extraChannels, []);
  assert.equal(model.showWalmart, false);
  assert.equal(model.showAmazonListPrice, true);
  assert.equal("averageGap" in model, false);
  assert.equal("combinedGap" in model, false);
  assert.match(channelSummaryText(2, null), /2 listings with a stored price/);
  assert.doesNotMatch(channelSummaryText(2, null), /below MAP/);
});

test("the list-price column stays off until this read stored a list price", () => {
  const withoutListPrice = PROVING_ROWS.map((row) => ({ ...row, map_price: null }));
  assert.equal(mapTabModel(withoutListPrice).showAmazonListPrice, false);
  assert.equal(mapTabModel(withoutListPrice.map((row) => ({ ...row, map_price: 0 }))).showAmazonListPrice, false);
});

test("the MAP tab, the satellite, and the queue all say Fender MAP prices are not stored", () => {
  const read = retailRead();
  if (read.phase !== "ready") throw new Error("expected a ready read");

  assert.equal(read.snapshot.mapPrices.missingMessage, FENDER_MAP_NOT_STORED);
  assert.equal(read.snapshot.mapPrices.issueCount, null);
  assert.equal(read.snapshot.mapPrices.detail?.amazonListPrices, 2);

  const satellite = mapBubble(read.snapshot.mapPrices);
  assert.deepEqual(satellite.stats, [FENDER_MAP_NOT_STORED]);

  assert.equal(mapReadLine(read), FENDER_MAP_NOT_STORED);

  const queueItem = buildLiveCommandCenter(bundle(), read).items.find(
    (item) => item.id === "map-leakage",
  );
  assert.equal(queueItem?.title, "Fender MAP prices have not been stored");
  assert.equal(queueItem?.subTab, "MAP");
});

test("no MAP surface repeats a stored list-price count or average", () => {
  const read = retailRead();
  const metrics = buildLiveMetrics(bundle(), read);
  const queueItem = buildLiveCommandCenter(bundle(), read).items.find(
    (item) => item.id === "map-leakage",
  );
  const text = [
    metrics.flaggedAsins.value,
    metrics.flaggedAsins.detail,
    metrics.amazonMapDrift.value,
    metrics.amazonMapDrift.detail,
    mapBubble(read.phase === "ready" ? read.snapshot.mapPrices : mapPriceFinding(null)).stats.join(" "),
    mapReadLine(read),
    queueItem?.title ?? "",
    queueItem?.why ?? "",
  ].join(" | ");

  // 466 below-MAP listings and a -$25 average came from the stored list price.
  assert.doesNotMatch(text, /466|-\$25|\$25\b|749\.99/);
  assert.doesNotMatch(text, /\d+\s+listings?\s+(?:is|are)\s+below/);
  assert.doesNotMatch(text, /\$/);
  assert.equal(metrics.flaggedAsins.value, "Not stored");
  assert.equal(metrics.amazonMapDrift.value, "Not stored");
});

test("no panel header calls the stored list price MAP, and the glossary says whose it is", () => {
  const sources = [
    "../components/v3/live/MapChannelPanel.tsx",
    "../components/v3/live/FenderListingsTable.tsx",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

  for (const source of sources) {
    assert.doesNotMatch(source, /name: "MAP"/);
    assert.doesNotMatch(source, /label: "MAP"/);
    assert.match(source, /"Amazon list price"/);
  }
  assert.match(fenderGlossary["Amazon list price"] ?? "", /copied from Keepa/);
  assert.match(fenderGlossary["Amazon list price"] ?? "", /not below MAP/);
  assert.match(fenderGlossary.MAP ?? "", /Fender sets it/);
});
