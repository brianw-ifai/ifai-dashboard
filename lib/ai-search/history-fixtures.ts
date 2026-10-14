import { utcDay } from "@/lib/ai-search/history-eligibility";
import type { HistoryRunSummary } from "@/lib/ai-search/history-eligibility";
import type { AiCallRow, AiCitationRow, AiCurrentRun, AiProbeRow, AiSearchSnapshot } from "@/lib/ai-search/types";

/**
 * Review fixtures for the history control. They are not live runs.
 * Open them with `?ai-history=fixture`. Headline rates still use questionRole and tallyCommercial.
 */

const ENGINES = ["chatgpt", "gemini", "perplexity"] as const;

const BEGINNER_A = "What is the best beginner electric guitar?";
const BEGINNER_B = "What is the best first electric guitar for a new player?";
const TRAVEL = "What is the best acoustic guitar for travel?";
const STRAT = "Is a Fender Stratocaster a good first electric guitar?";
const VERSUS = "Fender Player vs Yamaha Pacifica for a beginner";
const ASSOCIATED = "Best Stratocaster for blues";
const GUIDANCE = "How much should a beginner spend on an electric guitar?";
const FACT = "What pickup types does a Stratocaster have?";
const PROBE = "What is the scale length of a Jaguar?";

type OutcomeName = "fender_win" | "competitor_win" | "unresolved" | "error";

type PromptSpec = {
  key: string;
  text: string;
  kind: "commercial" | "probe";
  category: string;
  engines: Record<(typeof ENGINES)[number], OutcomeName>;
};

const SHARED: Omit<PromptSpec, "engines">[] = [
  { key: "p-travel", text: TRAVEL, kind: "commercial", category: "acoustics" },
  { key: "p-strat", text: STRAT, kind: "commercial", category: "electrics" },
  { key: "p-vs", text: VERSUS, kind: "commercial", category: "electrics" },
  { key: "p-associated", text: ASSOCIATED, kind: "commercial", category: "electrics" },
  { key: "p-guidance", text: GUIDANCE, kind: "commercial", category: "electrics" },
  { key: "p-fact", text: FACT, kind: "commercial", category: "electrics" },
  { key: "p-probe", text: PROBE, kind: "probe", category: "electrics" },
];

function grid(
  beginner: string,
  beginnerEngines: PromptSpec["engines"],
  rest: Record<string, PromptSpec["engines"]>,
): PromptSpec[] {
  return [
    { key: "p-beginner", text: beginner, kind: "commercial", category: "electrics", engines: beginnerEngines },
    ...SHARED.map((prompt) => ({ ...prompt, engines: rest[prompt.key] })),
  ];
}

const QUIET: PromptSpec["engines"] = { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "unresolved" };

const RUNS: Array<{
  id: string;
  day: string;
  state: "completed" | "partial";
  hash: string;
  published: boolean;
  collector: string;
  prompts: PromptSpec[];
}> = [
  {
    id: "fx-2026-09-07",
    day: "2026-09-07",
    state: "completed",
    hash: "set-alpha",
    published: true,
    collector: "v11",
    prompts: grid(BEGINNER_A, { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "fender_win" }, {
      "p-travel": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "unresolved" },
      "p-strat": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
      "p-vs": { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "error" },
      "p-associated": QUIET,
      "p-guidance": { chatgpt: "unresolved", gemini: "competitor_win", perplexity: "fender_win" },
      "p-fact": { chatgpt: "fender_win", gemini: "unresolved", perplexity: "error" },
      "p-probe": { chatgpt: "fender_win", gemini: "unresolved", perplexity: "error" },
    }),
  },
  {
    id: "fx-2026-09-14",
    day: "2026-09-14",
    state: "partial",
    hash: "set-alpha",
    published: true,
    collector: "v11",
    prompts: grid(BEGINNER_A, { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "competitor_win" }, {
      "p-travel": { chatgpt: "competitor_win", gemini: "unresolved", perplexity: "error" },
      "p-strat": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "error" },
      "p-vs": { chatgpt: "competitor_win", gemini: "unresolved", perplexity: "error" },
      "p-associated": QUIET,
      "p-guidance": QUIET,
      "p-fact": QUIET,
      "p-probe": { chatgpt: "fender_win", gemini: "error", perplexity: "unresolved" },
    }),
  },
  {
    id: "fx-2026-09-21",
    day: "2026-09-21",
    state: "completed",
    hash: "set-alpha",
    published: true,
    collector: "v11",
    prompts: grid(BEGINNER_A, { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "fender_win" }, {
      "p-travel": { chatgpt: "competitor_win", gemini: "fender_win", perplexity: "competitor_win" },
      "p-strat": { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "fender_win" },
      "p-vs": { chatgpt: "competitor_win", gemini: "fender_win", perplexity: "unresolved" },
      "p-associated": QUIET,
      "p-guidance": QUIET,
      "p-fact": QUIET,
      "p-probe": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
    }),
  },
  {
    id: "fx-2026-09-28",
    day: "2026-09-28",
    state: "completed",
    hash: "set-beta",
    published: true,
    collector: "v11",
    prompts: grid(BEGINNER_B, { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" }, {
      "p-travel": { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "fender_win" },
      "p-strat": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "competitor_win" },
      "p-vs": { chatgpt: "fender_win", gemini: "competitor_win", perplexity: "fender_win" },
      "p-associated": QUIET,
      "p-guidance": QUIET,
      "p-fact": QUIET,
      "p-probe": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "error" },
    }),
  },
  {
    id: "fx-2026-10-05",
    day: "2026-10-05",
    state: "completed",
    hash: "set-beta",
    published: true,
    collector: "v11",
    prompts: grid(BEGINNER_B, { chatgpt: "competitor_win", gemini: "fender_win", perplexity: "competitor_win" }, {
      "p-travel": { chatgpt: "unresolved", gemini: "competitor_win", perplexity: "fender_win" },
      "p-strat": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
      "p-vs": { chatgpt: "competitor_win", gemini: "fender_win", perplexity: "error" },
      "p-associated": QUIET,
      "p-guidance": QUIET,
      "p-fact": QUIET,
      "p-probe": { chatgpt: "error", gemini: "fender_win", perplexity: "unresolved" },
    }),
  },
  {
    id: "fx-legacy-2026-08-01",
    day: "2026-08-01",
    state: "completed",
    hash: "set-legacy",
    published: false,
    collector: "v8",
    prompts: grid(BEGINNER_A, { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" }, {
      "p-travel": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
      "p-strat": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
      "p-vs": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
      "p-associated": QUIET,
      "p-guidance": QUIET,
      "p-fact": QUIET,
      "p-probe": { chatgpt: "fender_win", gemini: "fender_win", perplexity: "fender_win" },
    }),
  },
];

function callFrom(runId: string, when: string, sim: number, prompt: PromptSpec, engine: (typeof ENGINES)[number]): AiCallRow {
  const outcome = prompt.engines[engine];
  const failed = outcome === "error";
  const brand = outcome === "fender_win" ? "Fender/Squier" : outcome === "competitor_win" ? "Yamaha" : null;
  return {
    id: `${runId}-${prompt.key}-${engine}`,
    audit_run_id: runId,
    sim_id: sim,
    engine,
    model: engine === "gemini" ? "fixture-model" : null,
    category: prompt.category,
    prompt: prompt.text,
    prompt_key: prompt.key,
    prompt_kind: prompt.kind,
    call_status: failed ? "error" : "answered",
    outcome: prompt.kind === "probe" ? (failed ? "error" : "not_scored") : outcome,
    primary_brand: prompt.kind === "probe" ? null : brand,
    material_hallucination: prompt.kind === "probe" ? "not_evaluated" : "none",
    hallucination_evidence: null,
    root_cause: null,
    remediation_patch: null,
    error_message: failed ? "Provider failed the job" : null,
    attempt_no: 1,
    repeat_no: 1,
    created_at: when,
    answer_text: failed ? null : `Fixture answer for ${prompt.key} on ${engine}.`,
  };
}

function snapshotFor(spec: (typeof RUNS)[number]): AiSearchSnapshot {
  const when = `${spec.day}T16:00:00.000Z`;
  const calls: AiCallRow[] = [];
  let sim = 1;
  for (const prompt of spec.prompts) {
    for (const engine of ENGINES) {
      calls.push(callFrom(spec.id, when, sim, prompt, engine));
      sim += 1;
    }
  }
  const answered = calls.filter((call) => call.call_status === "answered").length;
  const errors = calls.length - answered;
  const run: AiCurrentRun = {
    audit_run_id: spec.id,
    run_state: spec.state,
    collector_version: spec.collector,
    prompt_set_hash: spec.hash,
    expected_calls: calls.length,
    attempted_calls: calls.length,
    answered_calls: answered,
    error_calls: errors,
    started_at: `${spec.day}T15:00:00.000Z`,
    completed_at: when,
    published_at: spec.published ? `${spec.day}T18:00:00.000Z` : null,
    missing_calls: errors,
    is_published: spec.published,
    run_kind: "ai_simulation",
  };
  const probes: AiProbeRow[] = calls
    .filter((call) => call.prompt_kind === "probe")
    .map((call) => ({
      audit_run_id: spec.id,
      sim_id: call.sim_id,
      prompt_key: call.prompt_key,
      prompt: call.prompt,
      engine: call.engine,
      model: call.model,
      call_status: call.call_status,
      material_hallucination: call.call_status === "error" ? "not_evaluated" : "not_evaluated",
      hallucination_evidence: null,
      verified_claim: null,
      verified_source_url: null,
      verified_at: null,
      created_at: when,
    }));
  const cited = calls.find((call) => call.prompt_kind === "commercial" && call.call_status === "answered");
  const citations: AiCitationRow[] = cited
    ? [
        {
          audit_run_id: spec.id,
          sim_id: cited.sim_id,
          simulation_id: cited.id,
          prompt_key: cited.prompt_key,
          prompt_kind: cited.prompt_kind,
          category: cited.category,
          engine: cited.engine,
          position: 1,
          url: "https://www.example.com/guitar-guide",
          domain: "example.com",
          title: "Guitar guide",
        },
      ]
    : [];
  return { run, calls, probes, citations };
}

const SNAPSHOTS = new Map(RUNS.map((spec) => [spec.id, snapshotFor(spec)]));

export function historyFixtureSnapshots(): AiSearchSnapshot[] {
  return [...SNAPSHOTS.values()];
}

export function historyFixtureSnapshot(runId: string): AiSearchSnapshot | null {
  return SNAPSHOTS.get(runId) ?? null;
}

export function historyFixtureSummaries(): HistoryRunSummary[] {
  return historyFixtureSnapshots().map((snapshot) => ({
    audit_run_id: snapshot.run.audit_run_id,
    run_kind: snapshot.run.run_kind ?? "ai_simulation",
    run_state: snapshot.run.run_state,
    collector_version: snapshot.run.collector_version,
    prompt_set_hash: snapshot.run.prompt_set_hash,
    expected_calls: snapshot.run.expected_calls,
    attempted_calls: snapshot.run.attempted_calls,
    answered_calls: snapshot.run.answered_calls,
    error_calls: snapshot.run.error_calls,
    is_published: snapshot.run.is_published ?? false,
    published_at: snapshot.run.published_at,
    started_at: snapshot.run.started_at,
    completed_at: snapshot.run.completed_at,
  }));
}

export const FIXTURE_BEGINNER_A = BEGINNER_A;
export const FIXTURE_BEGINNER_B = BEGINNER_B;
export const FIXTURE_BOUNDARY_DAYS = ["2026-09-21", "2026-09-28"] as const;

export function fixtureDay(runId: string): string | null {
  const snapshot = SNAPSHOTS.get(runId);
  return snapshot ? utcDay(snapshot.run.published_at ?? snapshot.run.completed_at) : null;
}
