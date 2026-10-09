import assert from "node:assert/strict";
import { test } from "node:test";
import { tabIndexFromSlug, tabSlug } from "../lib/canvas-sdk/canvas-url-state.ts";

const hubTabs = [
  "Executive Briefing",
  "Division Performance (3,598 SKUs)",
  "Commercial Sizing: $680K Pilot vs $38M to $62M Enterprise",
];

const specTabs = ["AI Readiness", "Machine Readability", "Amazon A+ Matrix"];

test("the renamed executive briefing keeps the earlier Buy Box tab slug", () => {
  assert.equal(tabSlug(hubTabs[0]), "executive-briefing");
  assert.equal(tabSlug("Executive Briefing & Buy Box Coverage"), "executive-briefing-buy-box-coverage");
  assert.equal(tabIndexFromSlug(hubTabs, "executive-briefing"), 0);
  assert.equal(tabIndexFromSlug(hubTabs, "executive-briefing-buy-box-coverage"), 0);
  assert.doesNotMatch(hubTabs[0], /buy box/i);
});

test("the renamed AI Readiness tabs keep the slugs copied from their old titles", () => {
  assert.deepEqual(specTabs.map(tabSlug), [
    "ai-readiness",
    "machine-readability",
    "amazon-a-matrix",
  ]);

  const copied: Array<[string, number]> = [
    ["catalog-readiness-executive-guide", 0],
    ["machine-readable-schema-org-json-ld-audit", 1],
    ["amazon-a-comparison-matrix-blueprint", 2],
  ];
  for (const [slug, index] of copied) {
    assert.equal(tabIndexFromSlug(specTabs, slug), index, slug);
  }

  // The current slugs resolve too, and an unrelated slug still falls back to the first tab.
  for (const [index, tab] of specTabs.entries()) {
    assert.equal(tabIndexFromSlug(specTabs, tabSlug(tab)), index);
  }
  assert.equal(tabIndexFromSlug(specTabs, "not-a-tab"), 0);
});
