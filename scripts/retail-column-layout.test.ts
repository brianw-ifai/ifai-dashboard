// node --experimental-strip-types --import ./scripts/register-ts-extensions.mjs --test scripts/retail-column-layout.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAP_LISTING_COLUMN_MEASURED_WIDTH,
  MAP_LISTING_COLUMN_WIDTH,
  columnWidthStorageKey,
  mergeColumnWidths,
} from "../lib/fender-canvas/retail-column-layout.ts";

const mapColumns = [
  { id: "listing", width: MAP_LISTING_COLUMN_WIDTH, minWidth: 96 },
  { id: "asin", width: 118, minWidth: 108 },
];

const suppressedColumns = [
  { id: "listing", width: 240, minWidth: 140 },
  { id: "offer", width: 120, minWidth: 100 },
];

test("the MAP listing default is about 60 percent of the measured column", () => {
  const ratio = MAP_LISTING_COLUMN_WIDTH / MAP_LISTING_COLUMN_MEASURED_WIDTH;
  assert.ok(ratio > 0.55 && ratio < 0.65, `ratio ${ratio}`);
});

test("each table keeps its own stored widths", () => {
  assert.notEqual(columnWidthStorageKey("map-listings"), columnWidthStorageKey("suppressed-listings"));
  assert.notEqual(columnWidthStorageKey("catalog-bundles"), columnWidthStorageKey("catalog-specs"));
  assert.notEqual(columnWidthStorageKey("catalog-bundles"), columnWidthStorageKey("explore-listings"));

  const stored = { listing: 180, asin: 40, extra: 900 };
  const map = mergeColumnWidths(mapColumns, stored);
  const suppressed = mergeColumnWidths(suppressedColumns, stored);
  assert.equal(map.listing, 180);
  assert.equal(map.asin, 108);
  assert.equal("extra" in map, false);
  assert.equal(suppressed.listing, 180);
  assert.equal(suppressed.offer, 120);
  assert.notEqual(map.asin, suppressed.offer);
});

test("a missing or broken store falls back to the defaults", () => {
  assert.deepEqual(mergeColumnWidths(mapColumns, null), {
    listing: MAP_LISTING_COLUMN_WIDTH,
    asin: 118,
  });
  assert.deepEqual(mergeColumnWidths(mapColumns, "nope"), {
    listing: MAP_LISTING_COLUMN_WIDTH,
    asin: 118,
  });
});
