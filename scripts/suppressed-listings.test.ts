import assert from "node:assert/strict";
import { test } from "node:test";
import {
  qualifiesForSuppressionList,
  suppressionList,
  suppressionReadingAvailable,
  type SuppressionReading,
} from "../lib/fender-canvas/suppressed-listings.ts";

function row(overrides: Partial<SuppressionReading> & Pick<SuppressionReading, "asin">): SuppressionReading {
  return {
    model_name: overrides.asin,
    title: null,
    offer_price: 949.99,
    competitive_price_threshold_cents: 84999,
    featured_offer_withheld: true,
    ...overrides,
  };
}

test("a withheld offer above the benchmark is on the list", () => {
  assert.equal(qualifiesForSuppressionList(row({ asin: "B0D2LNNB24" })), true);
});

test("an offer equal to the benchmark is not on the list", () => {
  assert.equal(
    qualifiesForSuppressionList(
      row({ asin: "B0EQ000001", offer_price: 849.99, competitive_price_threshold_cents: 84999 }),
    ),
    false,
  );
});

test("an offer under the benchmark is not on the list", () => {
  assert.equal(
    qualifiesForSuppressionList(
      row({ asin: "B0EQ000002", offer_price: 800, competitive_price_threshold_cents: 84999 }),
    ),
    false,
  );
});

test("a null or false withheld flag is not the list, even when the offer is above the benchmark", () => {
  assert.equal(
    qualifiesForSuppressionList(row({ asin: "B0EQ000003", featured_offer_withheld: null })),
    false,
  );
  assert.equal(
    qualifiesForSuppressionList(row({ asin: "B0EQ000004", featured_offer_withheld: false })),
    false,
  );
});

test("a missing or non-positive benchmark is not a reading and is not on the list", () => {
  assert.equal(suppressionReadingAvailable([row({ asin: "B0EQ000005", competitive_price_threshold_cents: null })]), false);
  assert.equal(suppressionReadingAvailable([row({ asin: "B0EQ000006", competitive_price_threshold_cents: -1 })]), false);
  assert.equal(
    qualifiesForSuppressionList(row({ asin: "B0EQ000007", competitive_price_threshold_cents: null })),
    false,
  );
  assert.equal(
    qualifiesForSuppressionList(row({ asin: "B0EQ000008", competitive_price_threshold_cents: 0 })),
    false,
  );
});

test("the count is the rows still returned, and a recovered listing is gone", () => {
  const first = suppressionList([
    row({ asin: "B0EQ000010", offer_price: 100, competitive_price_threshold_cents: 9000 }),
    row({ asin: "B0EQ000011", offer_price: 50, competitive_price_threshold_cents: 4000 }),
  ]);
  const next = suppressionList([
    row({
      asin: "B0EQ000010",
      offer_price: 100,
      competitive_price_threshold_cents: 9000,
      featured_offer_withheld: false,
    }),
    row({ asin: "B0EQ000011", offer_price: 50, competitive_price_threshold_cents: 4000 }),
  ]);
  assert.equal(first.length, 2);
  assert.equal(next.length, 1);
  assert.equal(next[0]?.asin, "B0EQ000011");
});

test("one stored threshold makes the reading available", () => {
  assert.equal(
    suppressionReadingAvailable([
      row({ asin: "B0EQ000012", competitive_price_threshold_cents: null }),
      row({ asin: "B0EQ000013", competitive_price_threshold_cents: 37198, featured_offer_withheld: false }),
    ]),
    true,
  );
});
