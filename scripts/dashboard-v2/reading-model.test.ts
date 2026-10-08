import assert from "node:assert/strict";
import { test } from "node:test";
import {
  complete,
  partial,
  rate,
  readingFromRun,
  unavailable,
  zeroWithRun,
} from "@/lib/dashboard-v2/reading/build";
import {
  formatAsOf,
  formatInt,
  formatPct,
  formatReading,
  formatReadingParts,
  formatUsd,
} from "@/lib/dashboard-v2/reading/format";
import { pickHeadline } from "@/lib/dashboard-v2/reading/headline";
import { statusFor } from "@/lib/dashboard-v2/reading/status";
import type { Coverage, Finding, Reading, RegistryRow } from "@/lib/dashboard-v2/reading/types";

const run = { registryId: "ai_wrong_spec_flags", runId: "run-1", asOf: "2026-10-08T19:30:00Z", source: "ai_answer" };

function cov(read: number, population: number | null): Coverage {
  return { read, population, asOf: run.asOf, runId: run.runId, source: run.source };
}

function row(threshold?: RegistryRow["threshold"]): RegistryRow {
  return {
    id: "ai_answer_share",
    name: "AI answer share",
    meaning: "Of the AI answers that named a brand, how often it was Fender or Squier.",
    unit: "percent",
    source_tables: "ai_answer",
    population: "Resolved answers.",
    formula: "fender_wins / resolved_answers",
    owner: "intofocus",
    confidence: "measured",
    notes: "",
    threshold,
  };
}

test("a missing input yields unavailable with a reason, never zero", () => {
  const r = readingFromRun(10, 10, null, run);
  assert.equal(r.status, "unavailable");
  assert.ok(r.status === "unavailable" && r.reason.length > 0);
  assert.ok(!("value" in r));
  const text = formatReading(r, "count");
  assert.match(text, /^unavailable/);
  assert.ok(!/\d/.test(text), `no digit expected, got "${text}"`);
  assert.notEqual(text, "0");

  const nan = readingFromRun(10, 10, Number.NaN, run);
  assert.equal(nan.status, "unavailable");
  const undef = readingFromRun(10, 10, undefined, run);
  assert.equal(undef.status, "unavailable");
});

test("unavailable() renders the word unavailable plus the reason and no digits", () => {
  const r = unavailable("No MAP row exists yet.", "map_below");
  assert.equal(formatReading(r), "unavailable: No MAP row exists yet.");
  const parts = formatReadingParts(r);
  assert.equal(parts.value, "unavailable");
  assert.equal(parts.note, "No MAP row exists yet.");
  assert.equal(r.coverage, null);
});

test("a stored zero with a run id is complete with value 0 and renders 0", () => {
  const r = zeroWithRun(run, 25);
  assert.equal(r.status, "complete");
  assert.ok(r.status === "complete" && r.value === 0);
  assert.equal(r.coverage?.runId, "run-1");
  assert.equal(formatReading(r, "count"), "0");

  const stored = readingFromRun(25, 25, 0, run);
  assert.equal(stored.status, "complete");
  assert.equal(formatReading(stored, "count"), "0");
});

test("a run that read fewer rows than its population is partial and renders not final with read N of M", () => {
  const r = readingFromRun(400, 1250, 17, run);
  assert.equal(r.status, "partial");
  assert.ok(r.status === "partial" && r.coverage.read === 400 && r.coverage.population === 1250);
  const text = formatReading(r, "count");
  assert.equal(text, "17, not final, read 400 of 1,250");
  assert.ok(text.includes("not final"));

  const full = readingFromRun(1250, 1250, 17, run);
  assert.equal(full.status, "complete");
  assert.equal(formatReading(full, "count"), "17");

  const unknownPop = readingFromRun(1250, null, 17, run);
  assert.equal(unknownPop.status, "complete");
});

test("a rate carries numerator and denominator and shows both next to the percentage", () => {
  const meta = { registryId: "ai_answer_share", coverage: cov(290, 290) };
  const r = rate(123, 290, meta);
  assert.equal(r.status, "complete");
  assert.ok(r.status === "complete");
  assert.equal(r.value.numerator, 123);
  assert.equal(r.value.denominator, 290);
  assert.ok(Math.abs(r.value.pct - 42.413793) < 0.001);
  assert.equal(formatReading(r), "42.4% (123 of 290)");

  const p = rate(10, 40, { registryId: "ai_answer_share", coverage: cov(40, 100) });
  assert.equal(p.status, "partial");
  assert.equal(formatReading(p), "25.0% (10 of 40), not final, read 40 of 100");
});

test("a rate with a zero or missing denominator is unavailable, never NaN or Infinity", () => {
  const meta = { registryId: "ai_answer_share", coverage: cov(0, 0) };
  for (const den of [0, null, undefined]) {
    const r = rate(5, den, meta);
    assert.equal(r.status, "unavailable", `denominator ${String(den)}`);
    assert.ok(!("value" in r));
    const text = formatReading(r);
    assert.ok(!text.includes("NaN") && !text.includes("Infinity"));
    assert.match(text, /^unavailable: /);
  }
  const noNum = rate(null, 10, meta);
  assert.equal(noNum.status, "unavailable");
});

test("constructors keep registryId and coverage", () => {
  const meta = { registryId: "amazon_offer_share", coverage: cov(5, 5) };
  const c = complete(3, meta);
  const p = partial(3, { ...meta, coverage: cov(2, 5) });
  assert.equal(c.registryId, "amazon_offer_share");
  assert.equal(p.registryId, "amazon_offer_share");
  assert.equal(c.status, "complete");
  assert.equal(p.status, "partial");
});

test("formatters: usd, pct one decimal, int grouping, as-of in UTC, no em dashes or exclamation marks", () => {
  assert.equal(formatUsd(680000), "$680,000");
  assert.equal(formatUsd(12.5), "$12.50");
  assert.equal(formatUsd(-3), "-$3");
  assert.equal(formatPct(42.4567), "42.5%");
  assert.equal(formatPct(0), "0.0%");
  assert.equal(formatInt(1234567), "1,234,567");
  assert.equal(formatAsOf("2026-10-08T19:30:00Z"), "Oct 8, 2026, 19:30 UTC");
  assert.equal(formatAsOf(null), "no date stored");
  assert.equal(formatAsOf("not a date"), "date not readable");
  const samples = [
    formatReading(unavailable("No input stored.", "x")),
    formatReading(readingFromRun(1, 2, 5, run), "count"),
    formatReading(rate(1, 3, { registryId: "x", coverage: cov(3, 3) })),
    formatAsOf("2026-01-01T00:00:00Z"),
  ];
  for (const s of samples) {
    assert.ok(!s.includes("\u2014"), `em dash in "${s}"`);
    assert.ok(!s.includes("!"), `exclamation mark in "${s}"`);
  }
});

test("formatReading uses the registry unit for plain numbers", () => {
  const meta = { registryId: "x", coverage: cov(1, 1) };
  assert.equal(formatReading(complete(680000, meta), "usd"), "$680,000");
  assert.equal(formatReading(complete(42.44, meta), "percent"), "42.4%");
  assert.equal(formatReading(complete(1200, meta), "count"), "1,200");
  assert.equal(formatReading(complete("2026-10-08T19:30:00Z", meta), "timestamp"), "Oct 8, 2026, 19:30 UTC");
});

test("headline rule: an unavailable higher rank does not replace a confirmed lower rank, and shows as coverage", () => {
  const primary: Finding = {
    registryId: "retail_control_partner_led",
    rank: 1,
    reading: unavailable("No seller authorization list is stored.", "retail_control_partner_led"),
  };
  const suppressed: Finding = {
    registryId: "featured_offer_suppressed",
    rank: 2,
    reading: complete(37, { registryId: "featured_offer_suppressed", coverage: cov(1025, 1025) }),
  };
  const present: Finding = {
    registryId: "featured_offer_present",
    rank: 3,
    reading: complete(900, { registryId: "featured_offer_present", coverage: cov(1025, 1025) }),
  };
  const pick = pickHeadline([present, suppressed, primary]);
  assert.equal(pick.headline?.registryId, "featured_offer_suppressed");
  assert.deepEqual(
    pick.coverage.map((f) => f.registryId),
    ["retail_control_partner_led"],
  );
});

test("headline rule: among eligible findings the lowest rank number wins; partial counts as confirmed", () => {
  const a: Finding = {
    registryId: "a",
    rank: 2,
    reading: partial(5, { registryId: "a", coverage: cov(1, 2) }),
  };
  const b: Finding = {
    registryId: "b",
    rank: 1,
    reading: complete(9, { registryId: "b", coverage: cov(2, 2) }),
  };
  const pick = pickHeadline([a, b]);
  assert.equal(pick.headline?.registryId, "b");
  assert.deepEqual(pick.coverage, []);

  const onlyPartial = pickHeadline([a]);
  assert.equal(onlyPartial.headline?.registryId, "a");
});

test("headline rule: a confirmed zero does not outrank a confirmed non-zero, but does outrank unavailable", () => {
  const zero: Finding = { registryId: "zero", rank: 1, reading: complete(0, { registryId: "zero", coverage: cov(1, 1) }) };
  const some: Finding = { registryId: "some", rank: 2, reading: complete(4, { registryId: "some", coverage: cov(1, 1) }) };
  const gone: Finding = { registryId: "gone", rank: 3, reading: unavailable("no read", "gone") };
  assert.equal(pickHeadline([zero, some, gone]).headline?.registryId, "some");
  assert.equal(pickHeadline([zero, gone]).headline?.registryId, "zero");

  const zeroRate: Finding = {
    registryId: "zr",
    rank: 1,
    reading: rate(0, 50, { registryId: "zr", coverage: cov(50, 50) }),
  };
  assert.equal(pickHeadline([zeroRate, some]).headline?.registryId, "some");
});

test("headline rule: all unavailable falls back to the lowest rank with no coverage list; empty input gives null", () => {
  const u1: Finding = { registryId: "u1", rank: 2, reading: unavailable("no", "u1") };
  const u2: Finding = { registryId: "u2", rank: 1, reading: unavailable("no", "u2") };
  const pick = pickHeadline([u1, u2]);
  assert.equal(pick.headline?.registryId, "u2");
  assert.deepEqual(pick.coverage, []);
  assert.equal(pickHeadline([]).headline, null);
});

test("statusFor: unavailable is always neutral, even with a threshold rule", () => {
  const r: Reading<number> = unavailable("no read", "ai_answer_share");
  assert.equal(statusFor(r, row({ kind: "higher_is_better", warn: 50, danger: 30 })), "neutral");
  assert.equal(statusFor(r, row()), "neutral");
});

test("statusFor: thresholds come from the registry row, so the same value changes status with the row", () => {
  const meta = { registryId: "ai_answer_share", coverage: cov(1, 1) };
  const r = complete(40, meta);
  assert.equal(statusFor(r, row()), "neutral", "no rule on the row means neutral");
  assert.equal(statusFor(r, row({ kind: "higher_is_better", warn: 50, danger: 30 })), "warning");
  assert.equal(statusFor(r, row({ kind: "higher_is_better", warn: 35, danger: 20 })), "success");
  assert.equal(statusFor(r, row({ kind: "higher_is_better", warn: 60, danger: 45 })), "danger");
  assert.equal(statusFor(r, row({ kind: "lower_is_better", warn: 30, danger: 50 })), "warning");
  assert.equal(statusFor(r, row({ kind: "lower_is_better", warn: 45, danger: 60 })), "success");
  assert.equal(statusFor(r, row({ kind: "lower_is_better", warn: 20, danger: 40 })), "danger");

  const count = complete(0, meta);
  assert.equal(statusFor(count, row({ kind: "count_is_bad", warn: 1, danger: 10 })), "success");
  assert.equal(statusFor(complete(3, meta), row({ kind: "count_is_bad", warn: 1, danger: 10 })), "warning");
  assert.equal(statusFor(complete(12, meta), row({ kind: "count_is_bad", warn: 1, danger: 10 })), "danger");

  const asRate = rate(20, 50, meta);
  assert.equal(statusFor(asRate, row({ kind: "higher_is_better", warn: 50, danger: 30 })), "warning");
  assert.equal(statusFor(partial(10, { ...meta, coverage: cov(1, 2) }), row({ kind: "higher_is_better", warn: 50, danger: 30 })), "danger");
});
