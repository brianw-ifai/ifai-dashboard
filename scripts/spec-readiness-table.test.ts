import assert from "node:assert/strict";
import { test } from "node:test";
import { specFenderFoundLabel, specModelTitle } from "../lib/fender-canvas/types.ts";

test("the model cell shows the stored title", () => {
  assert.equal(specModelTitle("Player II Stratocaster"), "Player II Stratocaster");
  assert.equal(specModelTitle("  American Ultra  "), "American Ultra");
  assert.equal(specModelTitle(null), "");
  assert.equal(specModelTitle(undefined), "");
  assert.equal(specModelTitle("   "), "");
});

test("fender.com found follows the stored flag", () => {
  assert.equal(specFenderFoundLabel(true), "Yes");
  assert.equal(specFenderFoundLabel(false), "No");
  assert.equal(specFenderFoundLabel(null), "");
  assert.equal(specFenderFoundLabel(undefined), "");
});

test("yes rows equal the true flags, and a null flag stays blank", () => {
  const flags: Array<boolean | null> = [true, false, null, true, false];
  const labels = flags.map((flag) => specFenderFoundLabel(flag));
  const yes = labels.filter((label) => label === "Yes").length;
  const found = flags.filter((flag) => flag === true).length;
  assert.equal(yes, found);
  assert.equal(labels.filter((label) => label === "").length, 1);
  assert.notEqual(labels.every((label) => label === "No"), true);
});
