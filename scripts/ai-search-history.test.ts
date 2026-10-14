// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/ai-search-history.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isTrustworthyRun, previousTrustworthyRun, utcDay } from "../lib/ai-search/history-eligibility.ts";
import {
  FIXTURE_BEGINNER_A,
  FIXTURE_BEGINNER_B,
  historyFixtureSnapshot,
  historyFixtureSnapshots,
  historyFixtureSummaries,
} from "../lib/ai-search/history-fixtures.ts";
import { historyControlLabel, historySpokeDescription } from "../lib/ai-search/history-mode.ts";
import { historyViewMissing } from "../lib/ai-search/history-queries.ts";
import { questionRole, roleTally } from "../lib/ai-search/question-role.ts";
import { queryVersionKey } from "../lib/ai-search/query-version.ts";
import { callOutcome } from "../lib/ai-search/run-metrics.ts";
import {
  boundaryLabel,
  buildHistoryTrend,
  callsBehindPoint,
  callsForRun,
  coverageLabel,
  ONE_RUN_TREND_MESSAGE,
  queryChoices,
  rateLabel,
  trendSegments,
  boundaryBreaks,
} from "../lib/ai-search/history-trends.ts";
import type { AiCallRow, AiSearchSnapshot } from "../lib/ai-search/types.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");
const fixtures = historyFixtureSnapshots().filter((snapshot) => isTrustworthyRun(snapshot.run));

test("default history label stays on the current run", () => {
  assert.equal(historyControlLabel({ kind: "current" }, "2026-10-12", null), "Current run · Oct 12, 2026");
  assert.equal(historyControlLabel({ kind: "all" }, "2026-10-12", null), "All time");
});

test("the current-run loader does not read history views", () => {
  assert.doesNotMatch(read("lib/ai-search/queries.ts"), /canvas_ai_history/);
  assert.match(read("supabase/migrations/20261012150400_ai_search_truth_4_current_views.sql"), /LIMIT 1/);
});

test("only a published full v11 battery is trustworthy", () => {
  const summaries = historyFixtureSummaries();
  const trusted = summaries.filter(isTrustworthyRun);
  assert.deepEqual(trusted.map((run) => run.audit_run_id), [
    "fx-2026-09-07",
    "fx-2026-09-14",
    "fx-2026-09-21",
    "fx-2026-09-28",
    "fx-2026-10-05",
  ]);
  assert.equal(summaries.some((run) => run.audit_run_id === "fx-legacy-2026-08-01" && isTrustworthyRun(run)), false);
  assert.equal(previousTrustworthyRun(trusted, "fx-2026-10-05")?.audit_run_id, "fx-2026-09-28");
  assert.equal(previousTrustworthyRun([trusted[0]], trusted[0].audit_run_id), null);
});

test("a historical snapshot never keeps another run's calls", () => {
  const [first, second] = fixtures;
  const mixed: AiSearchSnapshot = {
    ...first,
    calls: [...first.calls, { ...second.calls[0], audit_run_id: second.run.audit_run_id }],
  };
  const kept = callsForRun(mixed);
  assert.ok(kept.every((call) => call.audit_run_id === first.run.audit_run_id));
  assert.equal(kept.length, first.calls.length);
});

test("the two role rates keep the existing denominator", () => {
  const run = historyFixtureSnapshot("fx-2026-09-14");
  assert.ok(run);
  const calls = callsForRun(run);
  const unbranded = roleTally(calls, "unbranded_discovery");
  const branded = roleTally(calls, "branded_consideration");
  assert.deepEqual([unbranded.fenderWins, unbranded.resolved, unbranded.unresolved, unbranded.errors], [1, 4, 1, 1]);
  assert.equal(unbranded.winPct, 25);
  assert.notEqual(branded.resolved, unbranded.resolved);
  assert.equal(unbranded.calls, calls.filter((call) => questionRole(call) === "unbranded_discovery").length);
  assert.equal(branded.calls, calls.filter((call) => questionRole(call) === "branded_consideration").length);
  const keptOut = calls.filter((call) => {
    const role = questionRole(call);
    return role === "brand_associated_discovery" || role === "shopping_guidance" || role === "product_fact" || role === "probe";
  });
  assert.ok(keptOut.length > 0);
  assert.equal(unbranded.calls + branded.calls + keptOut.length, calls.filter((call) => call.prompt_kind === "commercial" || call.prompt_kind === "probe").length);
});

test("overall and engine series reconcile to the same calls", () => {
  const model = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "engine",
    fromDay: null,
    toDay: null,
    query: { kind: "all" },
  });
  const overall = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "all" },
  });
  assert.equal(model.status, "ready");
  for (const runId of overall.runIds) {
    const overallPoint = overall.series[0].points.find((point) => point.runId === runId);
    const enginePoints = model.series.flatMap((series) => series.points.filter((point) => point.runId === runId));
    assert.ok(overallPoint);
    assert.equal(
      enginePoints.reduce((sum, point) => sum + point.wins, 0),
      overallPoint.wins,
    );
    assert.equal(
      enginePoints.reduce((sum, point) => sum + point.resolved, 0),
      overallPoint.resolved,
    );
    const snapshot = fixtures.find((item) => item.run.audit_run_id === runId);
    assert.ok(snapshot);
    const behind = callsBehindPoint(snapshot, overallPoint, "unbranded_discovery", { kind: "all" });
    assert.equal(behind.inRate.filter((call) => callOutcome(call) === "fender_win").length, overallPoint.wins);
    assert.equal(behind.inRate.length, overallPoint.resolved);
    assert.equal(behind.outside.length, overallPoint.unresolved + overallPoint.errors);
    assert.ok(behind.inRate.every((call) => call.audit_run_id === runId));
    assert.ok(behind.outside.every((call) => call.audit_run_id === runId));
  }
});

test("exact query versions do not cross a wording change", () => {
  const before = queryVersionKey("p-beginner", FIXTURE_BEGINNER_A);
  const after = queryVersionKey("p-beginner", FIXTURE_BEGINNER_B);
  assert.notEqual(before, after);
  const exact = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "version", versionKey: before, promptKey: "p-beginner", promptText: FIXTURE_BEGINNER_A },
  });
  assert.deepEqual(exact.runIds, ["fx-2026-09-07", "fx-2026-09-14", "fx-2026-09-21"]);
  const lineage = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "lineage", promptKey: "p-beginner" },
  });
  assert.equal(lineage.boundaries.some((boundary) => boundary.queryVersionChanged), true);
  assert.match(boundaryLabel(lineage.boundaries[0]), /wording changed|Question set changed/);
});

test("a prompt-set change is a visible boundary and the line breaks", () => {
  const model = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: "2026-09-07",
    toDay: "2026-10-05",
    query: { kind: "all" },
  });
  const boundary = model.boundaries.find((item) => item.promptSetChanged);
  assert.ok(boundary);
  assert.equal(boundaryLabel(boundary), "Question set changed");
  assert.equal(boundary.afterDay, "2026-09-21");
  assert.equal(boundary.beforeDay, "2026-09-28");
  const segments = trendSegments(model.series[0].points, boundaryBreaks(model.boundaries));
  assert.ok(segments.length >= 2);
  assert.ok(segments.every((segment) => new Set(segment.map((point) => point.promptSetHash)).size === 1));
});

test("small samples stay visible and missing calls are not zero", () => {
  const model = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "all" },
  });
  const small = model.series[0].points.find((point) => point.runId === "fx-2026-09-14");
  assert.ok(small);
  assert.equal(small.smallSample, true);
  assert.match(rateLabel(small), /25\.0% \(1 of 4 resolved\)/);
  assert.match(rateLabel(small), /Small sample/);
  assert.match(coverageLabel(small), /1 unresolved/);
  assert.match(coverageLabel(small), /1 provider error/);
  const unloaded = rateLabel({ wins: 0, resolved: 0, smallSample: false, callsLoaded: false, winPct: null });
  assert.equal(unloaded, "Calls not available");
  assert.doesNotMatch(unloaded, /0%/);
});

test("legacy runs and a single trustworthy run do not draw a line", () => {
  const withLegacy = buildHistoryTrend({
    snapshots: historyFixtureSnapshots(),
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "all" },
  });
  assert.ok(!withLegacy.runIds.includes("fx-legacy-2026-08-01"));
  const one = buildHistoryTrend({
    snapshots: fixtures.slice(0, 1),
    metric: "branded_consideration",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "all" },
  });
  assert.equal(one.status, "one-run");
  assert.equal(one.message, ONE_RUN_TREND_MESSAGE);
  assert.deepEqual(one.series, []);
});

test("query choices offer exact wordings and a lineage only when the wording changed", () => {
  const choices = queryChoices(fixtures, "unbranded_discovery");
  assert.ok(choices.some((choice) => choice.kind === "version" && choice.promptText === FIXTURE_BEGINNER_A));
  assert.ok(choices.some((choice) => choice.kind === "version" && choice.promptText === FIXTURE_BEGINNER_B));
  assert.ok(choices.some((choice) => choice.kind === "lineage" && choice.promptKey === "p-beginner"));
});

test("a partial run stays partial and an empty call list is not a zero rate", () => {
  const partial = historyFixtureSnapshot("fx-2026-09-14");
  assert.equal(partial?.run.run_state, "partial");
  const empty: AiSearchSnapshot = {
    ...fixtures[0],
    calls: [],
    probes: [],
    citations: [],
  };
  const model = buildHistoryTrend({
    snapshots: [empty, fixtures[1], fixtures[2]],
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: null,
    toDay: null,
    query: { kind: "all" },
  });
  const point = model.series[0]?.points.find((item) => item.runId === empty.run.audit_run_id);
  assert.ok(point);
  assert.equal(point.callsLoaded, false);
  assert.equal(point.winPct, null);
  assert.equal(rateLabel(point), "Calls not available");
});

test("history views are select-only and do not mix runs", () => {
  const sql = read("supabase/migrations/20261014190000_ai_search_history_views.sql");
  assert.match(sql, /JOIN canvas_private\.ai_history_runs r ON r\.id = s\.audit_run_id/);
  assert.match(sql, /JOIN canvas_private\.ai_history_calls s ON s\.id = ci\.simulation_id/);
  assert.match(sql, /record_origin = 'historical_backfill'/);
  assert.match(sql, /historical_unverified/);
  assert.match(sql, /collector_version = 'v11'/);
  assert.match(sql, /r\.is_published/);
  assert.match(sql, /GRANT SELECT ON TABLE public\.%I TO anon, authenticated, service_role/);
  assert.doesNotMatch(sql, /GRANT INSERT|GRANT UPDATE|GRANT DELETE|GRANT ALL/);
  assert.match(sql, /Question role is not stored/);
  assert.match(sql, /prompt_key plus the exact prompt_text/);
  assert.equal(historyViewMissing({ message: "Could not find the table public.canvas_ai_history_runs in the schema cache", code: "PGRST205" }), true);
  assert.equal(utcDay("2026-10-12T17:02:36.755Z"), "2026-10-12");
});

test("the panel introduction changes with the history mode and the map copy does not", () => {
  assert.equal(
    historySpokeDescription({
      mode: "current",
      source: "live",
      selectedPhase: "idle",
      selectedMessage: null,
      runDescription: "Current figures",
    }),
    null,
  );
  assert.match(
    historySpokeDescription({
      mode: "run",
      source: "fixture",
      selectedPhase: "ready",
      selectedMessage: null,
      runDescription: "25.0% of resolved answers",
    }) ?? "",
    /Historical run\. 25\.0% of resolved answers/,
  );
  assert.match(
    historySpokeDescription({
      mode: "all",
      source: "fixture",
      selectedPhase: "idle",
      selectedMessage: null,
      runDescription: "56.5%",
    }) ?? "",
    /fixture runs/,
  );
  assert.doesNotMatch(
    historySpokeDescription({
      mode: "all",
      source: "live",
      selectedPhase: "idle",
      selectedMessage: null,
      runDescription: "56.5%",
    }) ?? "",
    /56\.5%/,
  );
  assert.match(
    historySpokeDescription({
      mode: "legacy",
      source: "fixture",
      selectedPhase: "idle",
      selectedMessage: null,
      runDescription: null,
    }) ?? "",
    /out of the trend/,
  );
});

test("errors and unresolved answers are outside the plotted denominator", () => {
  const run = fixtures.find((snapshot) => snapshot.run.audit_run_id === "fx-2026-09-14");
  assert.ok(run);
  const point = buildHistoryTrend({
    snapshots: fixtures,
    metric: "unbranded_discovery",
    breakdown: "overall",
    fromDay: "2026-09-14",
    toDay: "2026-10-05",
    query: { kind: "all" },
  }).series[0].points.find((item) => item.runId === "fx-2026-09-14");
  assert.ok(point);
  const behind = callsBehindPoint(run, point, "unbranded_discovery", { kind: "all" });
  assert.equal(behind.inRate.some((call) => call.outcome === "unresolved" || call.outcome === "error"), false);
  assert.ok(behind.outside.some((call) => call.outcome === "unresolved"));
  assert.ok(behind.outside.some((call) => call.outcome === "error"));
  const stray = { ...run.calls[0], audit_run_id: "other-run" } as AiCallRow;
  const polluted: AiSearchSnapshot = { ...run, calls: [...run.calls, stray] };
  const kept = callsBehindPoint(polluted, point, "unbranded_discovery", { kind: "all" });
  assert.ok(kept.inRate.every((call) => call.audit_run_id === run.run.audit_run_id));
  assert.ok(kept.outside.every((call) => call.audit_run_id === run.run.audit_run_id));
});
