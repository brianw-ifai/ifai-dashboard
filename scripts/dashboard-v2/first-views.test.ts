import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFirstViews, firstViewRegistryIds, firstViewStrings } from "@/lib/dashboard-v2/canvas/first-views";
import { buildSpecModel, executiveRegistryIds, figureOf } from "@/lib/dashboard-v2/canvas/spec-model";
import { formatPct } from "@/lib/dashboard-v2/reading/format";
import { coverageLine } from "@/lib/dashboard-v2/reading/lines";
import { statusFor } from "@/lib/dashboard-v2/reading/status";
import { registryFor, selectAll } from "@/lib/dashboard-v2/selectors/index";
import { bundleWithListingsError, fixtureBundle, LISTINGS } from "./fixtures/bundle";

function value(all: ReturnType<typeof selectAll>, id: string): unknown {
  const r = all.readings[id];
  return r.status === "unavailable" ? null : r.value;
}

test("hub overview: five marks, each plotting the selector's reading, status, and coverage", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const fv = buildFirstViews(all, executiveRegistryIds(all));
  assert.equal(fv.hub.marks.length, 5);
  for (const mark of fv.hub.marks) {
    const reading = all.readings[mark.registryId];
    assert.ok(reading, mark.registryId);
    assert.equal(mark.reading, reading, "the mark carries the same Reading object");
    assert.equal(mark.status, statusFor(reading, registryFor(all, mark.registryId)));
    assert.equal(mark.unavailable, reading.status === "unavailable");
    assert.ok(mark.label.split(" ").length <= 3, `label too long: ${mark.label}`);
    if (reading.status !== "unavailable") {
      assert.equal(mark.coverage?.read, reading.coverage.read);
      assert.equal(mark.coverage?.population, reading.coverage.population);
      assert.equal(mark.coverage?.partial, reading.status === "partial");
      assert.equal(mark.coverage?.line, coverageLine(reading));
    }
  }
  const ai = fv.hub.marks.find((m) => m.registryId === "ai_answer_share");
  assert.equal(ai?.figure, "82.6%");
  const gap = fv.hub.marks.find((m) => m.registryId === "price_gap_above_benchmark");
  assert.equal(gap?.figure, figureOf(all, "price_gap_above_benchmark"));
  assert.equal(gap?.coverage?.partial, true);
  // As-of strip: oldest first, one per source.
  assert.equal(fv.hub.asOf.length, all.freshness.sources.length);
  assert.equal(fv.hub.asOf[0].runId, all.freshness.oldest?.runId);
  assert.equal(fv.hub.readMore.length, 5);
});

test("AI Search Visibility: grouped bars equal the category selector, sorted by brand share ascending; engines equal the engine split", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const fv = buildFirstViews(all, executiveRegistryIds(all));
  const rows = fv.aeo.categories.rows;
  assert.equal(rows.length, all.weakest.categories.length);
  for (let i = 1; i < rows.length; i += 1) assert.ok((rows[i - 1].clientPct ?? 0) <= (rows[i].clientPct ?? 0), "sorted ascending");
  for (const row of rows) {
    const c = all.weakest.categories.find((x) => x.category === row.category);
    assert.ok(c);
    assert.ok(c.clientShare.status !== "unavailable");
    assert.equal(row.clientPct, c.clientShare.value.pct);
    assert.equal(row.clientFigure, formatPct(c.clientShare.value.pct));
    assert.equal(row.resolved, c.resolved);
    assert.equal(row.rivalName, c.topRival);
    assert.ok(c.rivalShare && c.rivalShare.status !== "unavailable");
    assert.equal(row.rivalPct, c.rivalShare.value.pct);
    assert.equal(row.clientReading, c.clientShare);
  }
  assert.equal(rows[0].category, all.weakest.category);
  assert.equal(fv.aeo.engines.length, all.engineSplit.engines.length);
  for (const bar of fv.aeo.engines) {
    const e = all.engineSplit.engines.find((x) => x.label === bar.label);
    assert.ok(e && e.reading.status !== "unavailable");
    assert.equal(bar.pct, e.reading.value.pct);
    assert.equal(bar.numerator, e.reading.value.numerator);
    assert.equal(bar.denominator, e.reading.value.denominator);
    assert.equal(bar.reading, e.reading);
  }
  assert.deepEqual(fv.competitors.categories.rows.map((r) => r.category), rows.map((r) => r.category));
});

test("Portfolio Retail: the Featured Offer stack and the seller mix plot the stored counts and sum to their totals", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const fv = buildFirstViews(all, executiveRegistryIds(all));
  const stack = fv.ecommerce.offerStates;
  const present = all.featuredPresent;
  const suppressed = all.featuredSuppressed;
  assert.equal(stack.total.status !== "unavailable" && stack.total.value, present.denominator);
  const byKey = Object.fromEntries(stack.slices.map((s) => [s.key, s]));
  assert.equal(byKey.present.count, present.numerator);
  assert.equal(byKey.above.count, suppressed.numerator);
  assert.equal(byKey.within.count, (present.denominator as number) - (present.numerator as number) - (suppressed.numerator as number));
  assert.equal(stack.sumsToTotal, true);
  assert.deepEqual(byKey.above.reading, suppressed.reading, "the suppressed slice is the headline Reading");
  assert.equal(all.offerStates.benchmarkNotRead.status !== "unavailable" && all.offerStates.benchmarkNotRead.value, 1007 - (suppressed.denominator as number));

  const mix = fv.ecommerce.sellerMix;
  assert.equal(mix.total.status !== "unavailable" && mix.total.value, 1007);
  assert.equal(mix.slices.length, all.sellerMix.classes.length);
  for (const s of mix.slices) {
    const c = all.sellerMix.classes.find((x) => x.sellerClass === s.key);
    assert.ok(c && c.reading.status !== "unavailable");
    assert.equal(s.count, c.reading.value);
    assert.equal(s.reading, c.reading);
    assert.ok(!s.label.includes("_"));
  }
  assert.equal(mix.slices.find((s) => s.key === "not_read")?.tone, "neutral");
  assert.equal(mix.sumsToTotal, true);
  assert.equal(fv.ecommerce.question.question, all.retail.primaryQuestion);
  assert.match(fv.ecommerce.question.statusLine, /^unavailable/);
  assert.equal(fv.ecommerce.channels.length, all.channelCoverage.channels.length);
  for (const bar of fv.ecommerce.channels) {
    const c = all.channelCoverage.channels.find((x) => x.label === bar.label);
    assert.ok(c && c.reading.status !== "unavailable");
    assert.equal(bar.numerator, c.reading.value.numerator);
    assert.equal(bar.denominator, c.reading.value.denominator);
  }
});

test("AI Readiness: three coverage bars carry the selector's numerators and denominators", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const fv = buildFirstViews(all, executiveRegistryIds(all));
  const [found, additional, amazon] = fv.specs.bars;
  const pf = all.spec.pageFound.reading;
  assert.ok(pf.status !== "unavailable");
  assert.equal(found.numerator, (value(all, "spec_fender_page_found") as { numerator: number }).numerator);
  assert.equal(found.denominator, (value(all, "spec_fender_page_found") as { denominator: number }).denominator);
  assert.equal(found.reading, pf);
  const ap = all.spec.additionalPropertyPresent;
  assert.ok(ap.status !== "unavailable");
  assert.equal(additional.numerator, ap.value.numerator);
  assert.equal(additional.denominator, ap.value.denominator);
  assert.equal(ap.value.numerator, (all.spec.additionalPropertyMissing.denominator as number) - (all.spec.additionalPropertyMissing.numerator as number));
  const ac = all.spec.amazonCompleteness.reading;
  assert.ok(ac.status !== "unavailable");
  assert.equal(amazon.pct, (ac.value as { pct: number }).pct);
  assert.equal(amazon.reading, ac);
});

test("Action Items and Estimates: counts come from the rows, the price gap figure is the selector's, and estimate trees stay unavailable without inputs", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const fv = buildFirstViews(all, executiveRegistryIds(all));
  const owners = fv.suggestions.byOwner.bars;
  assert.deepEqual(owners.map((b) => b.count), all.actions.byOwner.map((c) => c.count));
  assert.equal(owners.reduce((s, b) => s + b.count, 0), all.actions.open.length);
  const severities = fv.suggestions.bySeverity.bars;
  assert.deepEqual(severities.map((b) => b.count), all.actions.bySeverity.map((c) => c.count));
  assert.equal(severities.reduce((s, b) => s + b.count, 0), all.actions.open.length);
  for (const b of [...owners, ...severities]) assert.ok(!b.label.includes("_"), b.label);

  assert.equal(fv.money.priceGap.figure, figureOf(all, "price_gap_above_benchmark"));
  assert.equal(fv.money.priceGap.lineCount, all.priceGap.numerator);
  assert.equal(fv.money.priceGap.label, "price gap");
  assert.equal(fv.money.estimates.length, 2);
  for (const tree of fv.money.estimates) {
    assert.equal(tree.totalText, null, "no total until every input is stored");
    assert.ok(tree.lines.every((l) => l.text === "unavailable: not stored"));
    assert.ok(tree.reason);
  }
  const phase1 = fv.money.estimates.find((t) => t.registryId === "estimate_phase1_uplift");
  assert.deepEqual(phase1?.lines.map((l) => l.key), ["buybox_recapture", "ai_dtc_conversions", "reduced_returns", "review_synergy"]);
});

test("every chart mark binds to a registry row, and a failed read gives hatched unavailable marks with no digit", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const fv = buildFirstViews(all, executiveRegistryIds(all));
  for (const id of firstViewRegistryIds(fv)) assert.ok(registryFor(all, id), `no registry row for ${id}`);
  assert.ok(firstViewStrings(fv).length > 40);

  const broken = selectAll(bundleWithListingsError());
  const model = buildSpecModel(broken);
  const marks = model.firstViews.hub.marks;
  const affected = marks.filter((m) => m.registryId !== "action_items_open");
  assert.ok(affected.length >= 3);
  for (const m of affected) {
    assert.equal(m.unavailable, true);
    assert.equal(m.figure, "unavailable");
    assert.ok(m.reason && m.reason.length > 0);
    assert.ok(!/\d/.test(m.figure));
  }
  for (const s of model.firstViews.ecommerce.offerStates.slices) {
    assert.equal(s.unavailable, true);
    assert.equal(s.figure, "unavailable");
  }
  for (const b of model.firstViews.specs.bars) assert.equal(b.figure, "unavailable");
});
