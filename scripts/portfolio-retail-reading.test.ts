import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMapLeakageHtml } from "../components/v3/map-channel-drilldown.ts";
import {
  MAP_COUNT_SLOT,
  fillRetailSlots,
  retailBubble,
  summarizeRetailRows,
  unavailableRetailReading,
  type RetailPriceRow,
} from "../components/v3/portfolio-retail-reading.ts";

function row(
  overrides: Partial<RetailPriceRow> & Pick<RetailPriceRow, "asin" | "mapPrice" | "offerPrice">,
): RetailPriceRow {
  return {
    title: overrides.asin,
    buyboxStatus: "3P Confirmed",
    wmtPrice: null,
    wmtUrl: null,
    mfPrice: null,
    ...overrides,
    title: overrides.title ?? overrides.asin,
  };
}

test("below-MAP totals are counts and gaps of the returned active rows", () => {
  const reading = summarizeRetailRows([
    row({ asin: "B000000001", mapPrice: 100, offerPrice: 80 }),
    row({ asin: "B000000002", mapPrice: 200, offerPrice: 150 }),
    row({ asin: "B000000003", mapPrice: 50, offerPrice: 50 }),
    row({ asin: "B000000004", mapPrice: 40, offerPrice: 10, buyboxStatus: "No Active Offer" }),
    row({ asin: "B000000005", mapPrice: 80, offerPrice: 90 }),
  ]);

  assert.equal(reading.activeOffers, 4);
  assert.equal(reading.belowMap, 2);
  assert.equal(reading.pctOfActive, 50);
  assert.equal(reading.rows.map((item) => item.asin).join(","), "B000000002,B000000001");
  assert.equal(reading.combinedDollarGap, 70);
  assert.equal(reading.avgDollarGap, 35);
  assert.ok(Math.abs(reading.avgPercentGap - 22.5) < 1e-9);
});

test("a row that is no longer below MAP is not listed", () => {
  const first = summarizeRetailRows([
    row({ asin: "B000000001", mapPrice: 100, offerPrice: 80 }),
    row({ asin: "B000000009", mapPrice: 100, offerPrice: 70 }),
  ]);
  const next = summarizeRetailRows([
    row({ asin: "B000000001", mapPrice: 100, offerPrice: 100 }),
    row({ asin: "B000000009", mapPrice: 100, offerPrice: 70 }),
  ]);
  assert.deepEqual(first.rows.map((item) => item.asin), ["B000000009", "B000000001"]);
  assert.deepEqual(next.rows.map((item) => item.asin), ["B000000009"]);
  assert.equal(next.belowMap, 1);
});

test("saved copy slots are replaced only after a successful read", () => {
  const source = `${MAP_COUNT_SLOT} MAP n/a`;
  assert.equal(fillRetailSlots(source, unavailableRetailReading), source);
  const ready = summarizeRetailRows([
    row({ asin: "B000000001", mapPrice: 100, offerPrice: 75 }),
  ]);
  const filled = fillRetailSlots(source, ready);
  assert.match(filled, /1 of 1 active offers are under MAP \(100\.0%\)\./);
  assert.match(filled, /^1 /);
  assert.doesNotMatch(filled, /457/);
});

test("the client tooltip keeps the Keepa 39 and omits seller-model claims", () => {
  const ready = summarizeRetailRows([
    row({ asin: "B000000001", mapPrice: 100, offerPrice: 75 }),
  ]);
  for (const reading of [unavailableRetailReading, ready]) {
    const bubble = retailBubble(reading);
    assert.equal(bubble.meta, "39 listings suppressed");
    assert.match(bubble.tooltipDesc, /recorded Keepa reading/);
    assert.match(bubble.tooltipDesc, /39 suppressed listings \(3\.9%\)/);
    assert.doesNotMatch(bubble.tooltipDesc, /Partner-led|Partner-Led|Amazon 1P/i);
  }
  assert.match(retailBubble(unavailableRetailReading).statA, /Rows not available/);
  assert.match(retailBubble(ready).statA, /1 below MAP/);
  assert.match(retailBubble(ready).tooltipDesc, /\$25\.00/);
});

test("MAP rows show a channel only when that channel has a stored price", () => {
  const reading = summarizeRetailRows([
    row({
      asin: "B000000001",
      title: "Tele <caster>",
      mapPrice: 100,
      offerPrice: 80,
      wmtPrice: 77.5,
      wmtUrl: "https://www.walmart.com/ip/1",
      mfPrice: 79,
    }),
    row({
      asin: "B000000002",
      mapPrice: 100,
      offerPrice: 90,
      wmtUrl: "https://www.walmart.com/ip/should-not-show",
    }),
    row({
      asin: "B000000003",
      mapPrice: 100,
      offerPrice: 70,
      wmtPrice: 65,
    }),
  ]);
  const html = buildMapLeakageHtml(reading);
  assert.match(html, /href="https:\/\/www\.amazon\.com\/dp\/B000000001"/);
  assert.match(html, /Tele &lt;caster&gt;/);
  assert.match(html, /Walmart \$77\.50/);
  assert.match(html, /href="https:\/\/www\.walmart\.com\/ip\/1"/);
  assert.match(html, /Musician&#39;s Friend \$79\.00/);
  assert.match(html, /Walmart \$65\.00/);
  assert.doesNotMatch(html, /should-not-show/);
  assert.doesNotMatch(html, /Reverb|Sweetwater|Featured Offer withheld/);
  assert.equal(html.match(/<tr>/g)?.length, 4);

  const unavailable = buildMapLeakageHtml(unavailableRetailReading);
  assert.match(unavailable, /Below-MAP rows are not available/);
  assert.doesNotMatch(unavailable, /457|16\.49%|\$221\.96|\$101,434\.60|<tbody>/);
});
