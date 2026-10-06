import assert from "node:assert/strict";
import { test } from "node:test";
import { mapTabModel, type MapSourceRow } from "../lib/fender-canvas/map-channels.ts";

function row(overrides: Partial<MapSourceRow> & Pick<MapSourceRow, "asin">): MapSourceRow {
  return {
    model_name: overrides.asin,
    title: null,
    map_price: 100,
    offer_price: 80,
    worst_leakage: -20,
    wmt_price: null,
    wmt_url: null,
    mf_price: null,
    mf_leakage: null,
    ...overrides,
  };
}

test("channels appear only when this read stored a price", () => {
  const model = mapTabModel([
    row({
      asin: "B000000001",
      offer_price: 80,
      worst_leakage: -20,
      wmt_price: 77.5,
      wmt_url: "https://www.walmart.com/ip/1",
      mf_price: 79,
      mf_leakage: -21,
    }),
    row({ asin: "B000000002", offer_price: 90, worst_leakage: -10, wmt_url: "https://www.walmart.com/ip/skip" }),
    row({ asin: "B000000003", offer_price: 70, worst_leakage: -30, wmt_price: 65 }),
  ]);

  assert.equal(model.count, 3);
  assert.deepEqual(
    model.channels.map((channel) => channel.name),
    ["Amazon", "Walmart", "Musician's Friend"],
  );
  assert.equal(model.channels[1]?.count, 2);
  assert.equal(model.channels[2]?.count, 1);
  assert.equal(model.showWalmart, true);
  assert.equal(model.showMusiciansFriend, true);
  assert.equal(model.combinedGap, -60);
  assert.equal(model.averageGap, -20);
});

test("Amazon-only rows do not invent Walmart or Musician's Friend", () => {
  const model = mapTabModel([row({ asin: "B000000004", offer_price: 40, map_price: 50, worst_leakage: -10 })]);
  assert.deepEqual(model.channels.map((channel) => channel.name), ["Amazon"]);
  assert.equal(model.showWalmart, false);
  assert.equal(model.showMusiciansFriend, false);
});

test("a listing that is no longer returned is not counted", () => {
  const first = mapTabModel([
    row({ asin: "B000000001" }),
    row({ asin: "B000000009", worst_leakage: -30 }),
  ]);
  const next = mapTabModel([row({ asin: "B000000009", worst_leakage: -30 })]);
  assert.equal(first.count, 2);
  assert.equal(next.count, 1);
});
