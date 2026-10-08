import assert from "node:assert/strict";
import { test } from "node:test";
import { formatReading } from "@/lib/dashboard-v2/reading/format";
import { coverageLine } from "@/lib/dashboard-v2/reading/lines";
import { selectAll } from "@/lib/dashboard-v2/selectors/index";
import { selectAmazonOfferShare } from "@/lib/dashboard-v2/selectors/amazon-offer-share";
import { selectEngineSplit } from "@/lib/dashboard-v2/selectors/engine-split";
import { selectFeaturedOfferSuppressed } from "@/lib/dashboard-v2/selectors/featured-offer";
import { selectFreshness } from "@/lib/dashboard-v2/selectors/freshness";
import { selectMapBelow } from "@/lib/dashboard-v2/selectors/map-below";
import { selectRetailHeadline } from "@/lib/dashboard-v2/selectors/retail-headline";
import { selectWeakestCategory } from "@/lib/dashboard-v2/selectors/weakest-category";
import {
  AS_OF,
  bundleWithListingsError,
  bundleWithStoredZero,
  bundleWithoutSuppressedValue,
  fixtureBundle,
  REGISTRY,
} from "./fixtures/bundle";

test("a missing metric_value row yields unavailable with a reason, never 0", () => {
  const r = selectFeaturedOfferSuppressed(bundleWithoutSuppressedValue()).reading;
  assert.equal(r.status, "unavailable");
  assert.ok(r.status === "unavailable" && r.reason.length > 0);
  const text = formatReading(r, "count");
  assert.match(text, /^unavailable/);
  assert.ok(!/\d/.test(text), `no digit expected, got "${text}"`);
  assert.notEqual(text, "0");
});

test("a partial read reports its counts and says not final", () => {
  const r = selectFeaturedOfferSuppressed(fixtureBundle()).reading;
  assert.equal(r.status, "partial");
  assert.ok(r.status === "partial" && r.value === 48);
  assert.equal(r.coverage?.read, 438);
  assert.equal(r.coverage?.population, 1007);
  assert.equal(r.coverage?.asOf, AS_OF.benchmark);
  assert.equal(r.coverage?.source, "fender_omnichannel_audit_sync");
  const text = formatReading(r, "count");
  assert.equal(text, "48, not final, read 438 of 1,007");
  assert.equal(coverageLine(r), "read 438 of 1,007, not final");
});

test("a stored zero with a complete run is complete and renders 0", () => {
  const r = selectFeaturedOfferSuppressed(bundleWithStoredZero()).reading;
  assert.equal(r.status, "complete");
  assert.ok(r.status === "complete" && r.value === 0);
  assert.equal(formatReading(r, "count"), "0");
});

test("the retail headline is the confirmed suppression finding; the unavailable primary question is coverage", () => {
  const retail = selectRetailHeadline(fixtureBundle());
  assert.equal(retail.primaryRegistryId, "retail_control_partner_led");
  assert.equal(retail.headline?.registryId, "featured_offer_suppressed");
  assert.deepEqual(
    retail.coverage.map((f) => f.registryId),
    ["retail_control_partner_led"],
  );
  const primary = retail.findings[0].reading;
  assert.equal(primary.status, "unavailable");
  assert.ok(primary.status === "unavailable" && /authorized-seller list/.test(primary.reason));
  assert.equal(retail.primaryQuestion, "Does an authorized seller hold a healthy Featured Offer on each active listing?");
  assert.equal(retail.findings.map((f) => f.rank).join(","), "1,2,3,4");
});

test("amazon_offer_share uses the active-offer denominator (1,007), not every map row", () => {
  const r = selectAmazonOfferShare(fixtureBundle()).reading;
  assert.notEqual(r.status, "unavailable");
  assert.ok(r.status !== "unavailable");
  const rate = r.value as { numerator: number; denominator: number };
  assert.equal(rate.denominator, 1007);
  assert.equal(rate.numerator, 55);
  assert.ok(formatReading(r).startsWith("5.5% (55 of 1,007)"));
});

test("map_below is unavailable with the registry's reason", () => {
  const r = selectMapBelow(fixtureBundle()).reading;
  assert.equal(r.status, "unavailable");
  assert.ok(r.status === "unavailable" && /MAP sheet/.test(r.reason));
});

test("freshness picks the oldest source for the header, one as-of per workflow", () => {
  const f = selectFreshness(fixtureBundle());
  assert.equal(f.sources.length, 7);
  assert.equal(new Set(f.sources.map((s) => s.workflowName)).size, 7);
  assert.equal(f.oldest?.workflowName, "fender_ai_simulation_battery_real");
  assert.equal(f.oldest?.asOf, AS_OF.ai);
  assert.equal(f.newest?.asOf, AS_OF.catalog);
  assert.equal(formatReading(f.reading, "timestamp"), "Oct 5, 2026, 16:26 UTC");
  assert.equal(f.sources.find((s) => s.source === "ai_battery")?.aiRunCount, 522);
});

test("the engine split is complete when engine coverage equals the resolved answer count", () => {
  const split = selectEngineSplit(fixtureBundle());
  assert.equal(split.reading.status, "complete");
  assert.equal(split.engines.length, 3);
  for (const e of split.engines) assert.equal(e.reading.status, "complete");
  assert.ok(split.reading.status === "complete" && split.reading.value.includes("ChatGPT 82.0% (1,046 of 1,275)"));
});

test("the weakest category excludes small categories and names the top rival", () => {
  const w = selectWeakestCategory(fixtureBundle());
  assert.equal(w.category, "beginner");
  assert.equal(w.topRival, "Yamaha");
  assert.equal(formatReading(w.reading), "58.5% (168 of 287)");
  assert.ok(w.rivalShare && formatReading(w.rivalShare) === "38.7% (111 of 287)");
  assert.ok(w.gapPoints.status === "complete" && Math.abs(w.gapPoints.value - 19.86) < 0.01);
  assert.ok(w.categories.every((c) => c.resolved >= 10));
});

test("every selector reading carries a registryId that matches a registry row", () => {
  const all = selectAll(fixtureBundle());
  const ids = new Set(REGISTRY.map((r) => r.registry_id));
  for (const [id, reading] of Object.entries(all.readings)) {
    assert.equal(reading.registryId, id);
    assert.ok(ids.has(id), `no registry row for ${id}`);
  }
});

test("a failed metric read leaves metric readings unavailable and the other parts usable", () => {
  const all = selectAll(bundleWithListingsError());
  for (const d of Object.values(all.details)) {
    assert.equal(d.reading.status, "unavailable");
    assert.ok(d.reading.status === "unavailable" && /could not be read/.test(d.reading.reason));
  }
  assert.equal(all.actions.reading.status, "complete");
  assert.equal(all.freshness.reading.status, "complete");
});
