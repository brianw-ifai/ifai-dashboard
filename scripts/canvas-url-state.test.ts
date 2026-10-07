import assert from "node:assert/strict";
import { test } from "node:test";
import { tabIndexFromSlug, tabSlug } from "../lib/canvas-sdk/canvas-url-state.ts";

const hubTabs = [
  "Executive Briefing",
  "Division Performance (3,598 SKUs)",
  "Commercial Sizing: $680K Pilot vs $38M to $62M Enterprise",
];

test("the renamed executive briefing keeps the earlier Buy Box tab slug", () => {
  assert.equal(tabSlug(hubTabs[0]), "executive-briefing");
  assert.equal(tabSlug("Executive Briefing & Buy Box Coverage"), "executive-briefing-buy-box-coverage");
  assert.equal(tabIndexFromSlug(hubTabs, "executive-briefing"), 0);
  assert.equal(tabIndexFromSlug(hubTabs, "executive-briefing-buy-box-coverage"), 0);
  assert.doesNotMatch(hubTabs[0], /buy box/i);
});
