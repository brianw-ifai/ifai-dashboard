// node --experimental-strip-types --import ./scripts/register-ts-extensions.mjs --test scripts/listing-reviews.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { pendingLabel } from "../lib/fender-canvas/format.ts";
import { listingReviewLabel } from "../lib/fender-canvas/listing-reviews.ts";

test("an unread review default shows the same words as stranded reviews", () => {
  assert.equal(pendingLabel(), "Pending data");
  assert.equal(listingReviewLabel(0), pendingLabel());
  assert.equal(listingReviewLabel("0"), pendingLabel());
  assert.equal(listingReviewLabel(null), pendingLabel());
  assert.equal(listingReviewLabel(undefined), pendingLabel());
});

test("a positive stored review count is shown", () => {
  assert.equal(listingReviewLabel(1), "1");
  assert.equal(listingReviewLabel(12), "12");
  assert.equal(listingReviewLabel("1405"), "1,405");
});

test("each listing row is labeled on its own, without a fixed row total", () => {
  const rows = [{ reviews_count: 0 }, { reviews_count: 0 }, { reviews_count: 8 }];
  assert.deepEqual(
    rows.map((row) => listingReviewLabel(row.reviews_count)),
    ["Pending data", "Pending data", "8"],
  );
});
