// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/citation-lead.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { citationOwnedLinksLead } from "../lib/ai-search/citation-lead.ts";
import { pct } from "../lib/ai-search/summary.ts";

test("Fender-owned links lead is the share of cited links, not answers", () => {
  const lead = citationOwnedLinksLead(42, 220);
  assert.equal(lead.figure, pct(42, 220));
  assert.equal(lead.figure, "19.1%");
  assert.equal(lead.population, "42 of 220 cited links lead to Fender-owned sites");
  assert.doesNotMatch(lead.population!, /answers/);
  assert.doesNotMatch(lead.population!, /\u2014/);
});

test("no cited links shows a worded empty state, not 0% or 100%", () => {
  const lead = citationOwnedLinksLead(0, 0);
  assert.equal(lead.figure, "No cited links");
  assert.equal(lead.population, null);
  assert.notEqual(lead.figure, "0.0%");
  assert.notEqual(lead.figure, "100.0%");
  assert.notEqual(lead.figure, "No resolved answers");
});

test("zero owned links among a real population is still 0.0%", () => {
  const lead = citationOwnedLinksLead(0, 10);
  assert.equal(lead.figure, "0.0%");
  assert.equal(lead.population, "0 of 10 cited links lead to Fender-owned sites");
});
