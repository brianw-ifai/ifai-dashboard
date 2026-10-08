import assert from "node:assert/strict";
import { test } from "node:test";
import type { EstimateInputRow } from "@/lib/dashboard-v2/data/types";
import { formatReading } from "@/lib/dashboard-v2/reading/format";
import { ESTIMATE_PHASE1_ID, formulaInputKeys, selectEstimate } from "@/lib/dashboard-v2/selectors/estimate";
import { registryRow } from "@/lib/dashboard-v2/selectors/common";
import { PRICE_GAP_ID, selectPriceGapAboveBenchmark } from "@/lib/dashboard-v2/selectors/price-gap";
import { CLIENT_ID, fixtureBundle, LISTINGS } from "./fixtures/bundle";

test("the price gap sum recomputed from the lines equals the stored metric value", () => {
  const gap = selectPriceGapAboveBenchmark(fixtureBundle(), LISTINGS);
  assert.equal(gap.lines.length, 48);
  assert.ok(gap.reading.status !== "unavailable");
  const stored = gap.reading.status === "unavailable" ? Number.NaN : (gap.reading.value as number);
  const fromLines = gap.lines.reduce((sum, line) => sum + Math.round(line.gap * 100), 0) / 100;
  assert.equal(fromLines, 10667.03);
  assert.equal(gap.linesTotal, fromLines);
  assert.equal(stored, fromLines);
  assert.equal(Math.min(...gap.lines.map((l) => l.gap)), 5.92);
  assert.equal(Math.max(...gap.lines.map((l) => l.gap)), 1215.67);
  assert.equal(gap.reading.status, "partial");
  assert.equal(formatReading(gap.reading, "usd"), "$10,667.03, not final, read 438 of 1,007");
});

test("an estimate with a missing input is unavailable and names the missing inputs", () => {
  const e = selectEstimate(fixtureBundle(), ESTIMATE_PHASE1_ID);
  assert.deepEqual(e.inputKeys, ["buybox_recapture", "ai_dtc_conversions", "reduced_returns", "review_synergy"]);
  assert.equal(e.reading.status, "unavailable");
  assert.deepEqual(e.missing, e.inputKeys);
  const text = formatReading(e.reading, "usd");
  assert.match(text, /^unavailable/);
  assert.ok(!/\$/.test(text), `no dollar figure expected, got "${text}"`);

  // Three of four inputs stored: still unavailable, one named.
  const bundle = fixtureBundle();
  bundle.estimateInputs = {
    rows: inputs(["buybox_recapture", "ai_dtc_conversions", "reduced_returns"], [100000, 50000, 25000]),
    error: null,
    asOf: bundle.loadedAt,
  };
  const partial = selectEstimate(bundle, ESTIMATE_PHASE1_ID);
  assert.equal(partial.reading.status, "unavailable");
  assert.deepEqual(partial.missing, ["review_synergy"]);
  assert.equal(partial.lines.length, 3);
});

test("an estimate whose inputs all exist equals the sum of its inputs", () => {
  const bundle = fixtureBundle();
  const values = [312500.5, 180000, 95000.25, 92500];
  bundle.estimateInputs = {
    rows: inputs(["buybox_recapture", "ai_dtc_conversions", "reduced_returns", "review_synergy"], values),
    error: null,
    asOf: bundle.loadedAt,
  };
  const e = selectEstimate(bundle, ESTIMATE_PHASE1_ID);
  assert.equal(e.reading.status, "complete");
  const expected = values.reduce((sum, v) => sum + Math.round(v * 100), 0) / 100;
  assert.ok(e.reading.status === "complete" && e.reading.value === expected);
  assert.equal(e.lines.length, 4);
  assert.deepEqual(e.missing, []);
  assert.equal(formatReading(e.reading, "usd"), "$680,000.75");
});

test("a formula without named inputs sums every stored input, and none means unavailable", () => {
  assert.deepEqual(formulaInputKeys("sum of four stored lines, low and high"), []);
  const bundle = fixtureBundle();
  const none = selectEstimate(bundle, "estimate_enterprise_range");
  assert.equal(none.reading.status, "unavailable");
  bundle.estimateInputs = { rows: inputs(["line_one", "line_two"], [1000, 2000], "est_enterprise"), error: null, asOf: bundle.loadedAt };
  const some = selectEstimate(bundle, "estimate_enterprise_range");
  assert.ok(some.reading.status === "complete" && some.reading.value === 3000);
});

test("a price gap is labeled price gap, never revenue or uplift", () => {
  const row = registryRow(fixtureBundle(), PRICE_GAP_ID);
  assert.ok(row);
  const label = `${row.name} ${row.meaning}`.toLowerCase();
  assert.ok(label.includes("price gap"));
  assert.ok(!/\brevenue\b(?! ?\.)/.test(row.name.toLowerCase()));
  assert.ok(!/uplift/.test(label));
  // The meaning may say what the figure is not; the name never says revenue or uplift.
  assert.ok(!/revenue|uplift/.test(row.name.toLowerCase()));
});

function inputs(keys: string[], values: number[], estimateId = "est_phase1"): EstimateInputRow[] {
  return keys.map((key, i) => ({
    estimate_input_id: `inp_${estimateId}_${key}`,
    client_id: CLIENT_ID,
    estimate_id: estimateId,
    input_key: key,
    value: values[i],
    unit: "usd",
    source: "fixture",
    as_of: "2026-10-08",
    owner: "coo",
    confidence: "estimate",
  }));
}
