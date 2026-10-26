// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/branded-consideration-lead.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { brandedConsiderationLead, pct } from "../lib/ai-search/summary.ts";

test("branded consideration lead is N of M with pct when answers resolve", () => {
  const lead = brandedConsiderationLead({ fenderWins: 22, resolved: 23 });
  assert.equal(lead.figure, "22 of 23");
  assert.equal(lead.rate, pct(22, 23));
  assert.equal(lead.rate, "95.7%");
});

test("zero resolved shows no percentage and no fake 100%", () => {
  const lead = brandedConsiderationLead({ fenderWins: 0, resolved: 0 });
  assert.equal(lead.figure, "No resolved answers");
  assert.equal(lead.rate, null);
  assert.notEqual(lead.rate, "100.0%");
  assert.notEqual(lead.rate, "0.0%");
});

test("wins without resolved still treat the denominator as empty", () => {
  const lead = brandedConsiderationLead({ fenderWins: 3, resolved: 0 });
  assert.equal(lead.figure, "No resolved answers");
  assert.equal(lead.rate, null);
});
