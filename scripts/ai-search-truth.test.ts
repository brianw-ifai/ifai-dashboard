// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/ai-search-truth.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { aiMetrics, aiNodeFaces, aiPriorityItems, aiSpokeDesc } from "../lib/ai-search/canvas-surfaces.ts";
import { canonicalUrl, citationEvidence, classifySource, groupCitations, isValidCitationUrl } from "../lib/ai-search/citations.ts";
import { categoryBattles, competitorTallies } from "../lib/ai-search/competitors.ts";
import { driftRead } from "../lib/ai-search/drift.ts";
import { parseEvidence } from "../lib/ai-search/evidence-focus.ts";
import { applyExplorerFilter, DEFAULT_FILTER, filterFromEvidence } from "../lib/ai-search/explorer-filter.ts";
import { loadAiSearchRead, type AiReadClient } from "../lib/ai-search/queries.ts";
import { genuineGuidance } from "../lib/ai-search/remediation.ts";
import {
  cleanPrompt,
  engineTallies,
  enginesAndModels,
  isSmallSample,
  modelLabel,
  tallyCommercial,
} from "../lib/ai-search/run-metrics.ts";
import { summarizeRun } from "../lib/ai-search/summary.ts";
import type { AiCallRow, AiCitationRow, AiCurrentRun, AiProbeRow, AiSearchRead, AiSearchSnapshot } from "../lib/ai-search/types.ts";

const RUN = "run-current";
const OLD = "run-archived";

const run: AiCurrentRun = {
  audit_run_id: RUN,
  run_state: "partial",
  collector_version: "v11",
  prompt_set_hash: "hash",
  expected_calls: 9,
  attempted_calls: 9,
  answered_calls: 7,
  error_calls: 2,
  started_at: "2026-10-12T16:29:33Z",
  completed_at: "2026-10-12T17:02:10Z",
  published_at: "2026-10-12T17:02:36Z",
  missing_calls: 2,
};

function call(id: string, patch: Partial<AiCallRow>): AiCallRow {
  return {
    id,
    audit_run_id: RUN,
    sim_id: Number(id.replace(/\D/g, "")),
    engine: "chatgpt",
    model: null,
    category: "electrics",
    prompt: `Prompt ${id}`,
    prompt_key: `p${id}`,
    prompt_kind: "commercial",
    call_status: "answered",
    outcome: "fender_win",
    primary_brand: "Fender/Squier",
    material_hallucination: "not_evaluated",
    hallucination_evidence: null,
    root_cause: null,
    remediation_patch: null,
    error_message: null,
    attempt_no: 1,
    repeat_no: 1,
    created_at: "2026-10-12T16:40:00Z",
    ...patch,
  };
}

const calls: AiCallRow[] = [
  call("c1", {}),
  call("c2", { category: "acoustics", outcome: "competitor_win", primary_brand: "Yamaha" }),
  call("c3", { engine: "gemini", model: "3.6 Flash", category: "acoustics", material_hallucination: "confirmed", hallucination_evidence: "Said 12 inch radius" }),
  call("c4", { engine: "gemini", model: "3.6 Flash", category: "basses", outcome: "unresolved", primary_brand: null }),
  call("c5", { engine: "perplexity", call_status: "error", outcome: "error", primary_brand: null, error_message: "empty answer" }),
  call("c6", { prompt_kind: "probe", category: "hallucinations", outcome: "not_scored", material_hallucination: "none" }),
  call("c7", { engine: "perplexity", prompt_kind: "probe", category: "hallucinations", call_status: "error", outcome: "error" }),
  call("c8", { engine: "gemini", model: "3.6 Flash", category: "acoustics", outcome: "competitor_win", primary_brand: "Taylor", prompt: "Best travel acoustic [gemini]" }),
  call("c9", { engine: "perplexity", model: "turbo", outcome: "fender_win" }),
];

const archived = call("c99", { audit_run_id: OLD, outcome: "fender_win" });

function cite(simulationId: string, position: number, url: string | null, domain: string | null): AiCitationRow {
  const row = calls.find((c) => c.id === simulationId) ?? archived;
  return {
    audit_run_id: row.audit_run_id,
    sim_id: row.sim_id,
    simulation_id: simulationId,
    prompt_key: row.prompt_key,
    prompt_kind: row.prompt_kind,
    category: row.category,
    engine: row.engine,
    position,
    url,
    domain,
    title: null,
  };
}

const citations: AiCitationRow[] = [
  cite("c1", 1, "https://www.fender.com/products/player-ii?utm_source=chatgpt", "www.fender.com"),
  cite("c1", 2, "https://fender.com/products/player-ii#:~:text=radius", "fender.com"),
  cite("c1", 3, "null", "null"),
  cite("c2", 1, "https://www.reddit.com/r/Guitar/comments/abc", "reddit.com"),
  cite("c8", 1, "https://www.sweetwater.com/store/detail/GSMini", "sweetwater.com"),
  cite("c8", 2, "", ""),
  cite("c6", 1, "https://www.fender.com/products/mustang-micro", "fender.com"),
];

const probes: AiProbeRow[] = [
  { audit_run_id: RUN, sim_id: 6, prompt_key: "pc6", prompt: "Mustang Micro tubes? (chatgpt)", engine: "chatgpt", model: null, call_status: "answered", material_hallucination: "none", hallucination_evidence: null, verified_claim: "No tubes.", verified_source_url: "https://www.fender.com/products/mustang-micro", verified_at: "2026-10-12T15:37:00Z", created_at: "2026-10-12T16:47:00Z" },
  { audit_run_id: RUN, sim_id: 7, prompt_key: "pc7", prompt: "Telecaster wood?", engine: "perplexity", model: null, call_status: "error", material_hallucination: "not_evaluated", hallucination_evidence: null, verified_claim: null, verified_source_url: null, verified_at: null, created_at: "2026-10-12T16:47:00Z" },
];

const snapshot: AiSearchSnapshot = { run, calls, probes, citations };
const ready: AiSearchRead = { phase: "ready", snapshot };

type Rows = Record<string, unknown[]>;
function fakeClient(rows: Rows, failing?: string): AiReadClient {
  return {
    from(view: string) {
      const result = () => Promise.resolve(failing === view ? { data: null, error: { message: `${view} failed` } } : { data: rows[view] ?? [], error: null });
      const ranged = Object.assign(result(), { range: () => result() });
      return { select: () => Object.assign(result(), { order: () => ranged }) };
    },
  } as AiReadClient;
}

test("one explicit published run: none, many, and other-run rows", async () => {
  assert.deepEqual(await loadAiSearchRead(fakeClient({ canvas_ai_current_run: [] })), { phase: "no-run" });
  const many = await loadAiSearchRead(fakeClient({ canvas_ai_current_run: [run, { ...run, audit_run_id: OLD }] }));
  assert.equal(many.phase, "error");
  const read = await loadAiSearchRead(
    fakeClient({ canvas_ai_current_run: [run], canvas_ai_simulations: [...calls, archived], canvas_ai_probes: probes, canvas_ai_citations: [...citations, cite("c99", 1, "https://x.com/a", "x.com")] }),
  );
  assert.equal(read.phase, "ready");
  if (read.phase !== "ready") return;
  assert.equal(read.snapshot.calls.length, calls.length);
  assert.ok(read.snapshot.calls.every((row) => row.audit_run_id === RUN));
  assert.ok(read.snapshot.citations.every((row) => row.audit_run_id === RUN));
});

test("a failed view is an error state, not zeros", async () => {
  const read = await loadAiSearchRead(fakeClient({ canvas_ai_current_run: [run] }, "canvas_ai_citations"));
  assert.equal(read.phase, "error");
  for (const phase of [{ phase: "loading" }, { phase: "error", message: "boom" }, { phase: "no-run" }] as AiSearchRead[]) {
    const faces = aiNodeFaces(phase);
    const text = Object.values(faces).flatMap((f) => [f.title, ...f.stats, f.meta ?? ""]).join(" ");
    assert.doesNotMatch(text, /\d/, `${phase.phase} faces show no count`);
    const metrics = Object.values(aiMetrics(phase));
    assert.ok(metrics.every((m) => !/^\d/.test(m.value)), `${phase.phase} metrics show no count`);
    assert.deepEqual(aiPriorityItems(phase), []);
  }
});

test("commercial win rate: exact numerator and denominator, probes and errors apart", () => {
  const t = tallyCommercial(calls);
  assert.equal(t.calls, 7);
  assert.equal(t.fenderWins, 2, "c1 and c9; c3 is disqualified");
  assert.equal(t.disqualified, 1);
  assert.equal(t.competitorWins, 2);
  assert.equal(t.resolved, 5, "disqualified stays in the denominator");
  assert.equal(t.unresolved, 1);
  assert.equal(t.errors, 1);
  assert.equal(t.winPct, 40);
  const s = summarizeRun(snapshot);
  assert.equal(s.probesAnswered, 1);
  assert.match(aiSpokeDesc(ready), /2 of 5 resolved answers \(40\.0%\)/);
});

test("probes never appear as a commercial category or competitor", () => {
  assert.ok(categoryBattles(calls).every((b) => b.category !== "hallucinations"));
  assert.deepEqual(competitorTallies(calls).map((t) => t.brand), ["Taylor", "Yamaha"]);
  assert.ok(summarizeRun(snapshot).categories.every((c) => c.key !== "hallucinations"));
});

test("engine and model provenance, with small samples flagged", () => {
  assert.deepEqual(enginesAndModels(calls), [
    { engine: "chatgpt", models: [] },
    { engine: "gemini", models: ["3.6 Flash"] },
    { engine: "perplexity", models: ["turbo"] },
  ]);
  assert.equal(modelLabel(null), "Model not recorded");
  const engines = engineTallies(calls);
  assert.deepEqual(engines.map((e) => [e.key, e.resolved]), [["chatgpt", 2], ["gemini", 2], ["perplexity", 1]]);
  assert.equal(isSmallSample(7, 28), true);
  assert.equal(isSmallSample(28, 28), false);
});

test("engine tags never reach visible prompts", () => {
  assert.equal(cleanPrompt("Best travel acoustic [gemini]"), "Best travel acoustic");
  assert.equal(cleanPrompt("Mustang Micro tubes? (chatgpt)"), "Mustang Micro tubes?");
  assert.equal(cleanPrompt("Best amp | Perplexity"), "Best amp");
  assert.equal(cleanPrompt("Fender vs PRS"), "Fender vs PRS");
});

test("citations: canonical URLs, literal null dropped, Fender-owned apart from third party", () => {
  assert.equal(isValidCitationUrl("null"), false);
  assert.equal(isValidCitationUrl(""), false);
  assert.equal(canonicalUrl("https://www.fender.com/a/?utm_source=x#frag"), "https://fender.com/a");
  const read = citationEvidence(calls, citations, "commercial");
  assert.equal(read.stored, 6);
  assert.equal(read.invalid, 2);
  assert.equal(read.duplicates, 1);
  assert.deepEqual(read.rows.map((r) => r.domain), ["fender.com", "reddit.com", "sweetwater.com"]);
  assert.equal(read.answersWithCitation, 3);
  assert.equal(read.answered, 6);
  assert.equal(classifySource("uk.fender.com"), "fender_owned");
  assert.equal(classifySource("reddit.com"), "community");
  const domains = groupCitations(read.rows, (r) => r.domain);
  assert.equal(domains.find((d) => d.key === "fender.com")?.fenderOwnedRows, 1);
  assert.equal(citationEvidence(calls, citations, "probe").rows.length, 1);
});

test("remediation shows only when genuine", () => {
  assert.equal(genuineGuidance(null), null);
  assert.equal(genuineGuidance("  "), null);
  assert.equal(genuineGuidance("null"), null);
  const answer = "The Player II has a 9.5 inch radius and modern C neck profile.";
  assert.equal(genuineGuidance("The Player II has a 9.5 inch radius", answer), null);
  assert.equal(genuineGuidance("Add fingerboardRadius to the Player II JSON-LD", answer), "Add fingerboardRadius to the Player II JSON-LD");
});

test("AI Drift uses verified probe evidence only", () => {
  const d = driftRead(calls, probes);
  assert.equal(d.checked, 1);
  assert.equal(d.confirmed, 0);
  assert.equal(d.errors, 1);
  assert.equal(d.commercialConfirmed, 1);
  assert.equal(d.probes[0].prompt, "Mustang Micro tubes?");
  const confirmedNoEvidence = driftRead(calls, [{ ...probes[0], material_hallucination: "confirmed" }]);
  assert.equal(confirmedNoEvidence.confirmed, 0, "confirmed without evidence is never shown as confirmed");
  assert.equal(confirmedNoEvidence.unverified, 1);
});

test("AI freshness is the run's completion time, and partial runs say so", () => {
  const faces = aiNodeFaces(ready);
  assert.match(faces.satPrompts.meta ?? "", /Completed Oct 12, 2026, 5:02 PM UTC/);
  assert.match(faces.spokeAeo.meta ?? "", /Partial run · 7 of 9 answered/);
  assert.doesNotMatch(faces.satPrompts.tooltip.desc, /latest battery/i);
  assert.match(aiSpokeDesc(ready), /provider errors/);
});

test("client priorities come from run evidence, never pipeline work", () => {
  const items = aiPriorityItems(ready);
  assert.deepEqual(items.map((i) => i.id), ["ai-confirmed-contradiction", "ai-competitor-gap"]);
  const gap = items[1];
  assert.match(gap.title, /Taylor and Yamaha out-mention Fender\/Squier in 2 of 3 resolved acoustics answers/);
  assert.equal(gap.subTab, "Competitor Wins");
  const text = items.map((i) => `${i.title} ${i.why} ${i.impact}`).join(" ");
  assert.doesNotMatch(text, /collector|battery|normaliz|parse|schema column|database|retry/i);
});

test("drill-down links map to explorer filters", () => {
  assert.deepEqual(parseEvidence("sim:1161"), { field: "sim", value: "1161" });
  assert.equal(parseEvidence("bogus:1"), null);
  const errors = applyExplorerFilter(calls, filterFromEvidence({ field: "outcome", value: "error" }));
  assert.deepEqual(errors.map((r) => r.id), ["c5", "c7"]);
  const resolved = applyExplorerFilter(calls, filterFromEvidence({ field: "outcome", value: "resolved" }));
  assert.equal(resolved.length, 5);
  const yamaha = applyExplorerFilter(calls, filterFromEvidence({ field: "competitor", value: "Yamaha" }));
  assert.deepEqual(yamaha.map((r) => r.id), ["c2"]);
  assert.ok(applyExplorerFilter(calls, DEFAULT_FILTER).every((r) => r.prompt_kind === "commercial"));
  assert.deepEqual(applyExplorerFilter(calls, filterFromEvidence({ field: "kind", value: "probe" })).map((r) => r.id), ["c6", "c7"]);
});
