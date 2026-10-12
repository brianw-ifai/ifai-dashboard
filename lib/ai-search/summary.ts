import { citationEvidence, groupCitations } from "@/lib/ai-search/citations";
import { largestCompetitorGap, type CategoryBattle, competitorTallies } from "@/lib/ai-search/competitors";
import { driftRead, type DriftRead } from "@/lib/ai-search/drift";
import {
  categoryTallies,
  engineLabel,
  engineTallies,
  enginesAndModels,
  errorsByEngine,
  formatRunTime,
  isSmallSample,
  runCompleteness,
  tallyCommercial,
  type EngineModel,
  type ErrorEngine,
  type GroupTally,
  type OutcomeTally,
  type RunCompleteness,
} from "@/lib/ai-search/run-metrics";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

/** Everything the map, widgets, tour, and command center say about the published run. */
export type AiRunSummary = {
  runId: string;
  shortRunId: string;
  completeness: RunCompleteness;
  completedAt: string;
  commercial: OutcomeTally;
  probesAnswered: number;
  engines: GroupTally[];
  /** Engines whose resolved sample is too small to rank against the largest one. */
  smallSampleEngines: string[];
  categories: GroupTally[];
  enginesAndModels: EngineModel[];
  errorEngines: ErrorEngine[];
  drift: DriftRead;
  citations: {
    rows: number;
    domains: number;
    answered: number;
    answersWithCitation: number;
    fenderOwnedRows: number;
    stored: number;
    invalid: number;
    duplicates: number;
  };
  competitorWins: number;
  topCompetitor: { brand: string; wins: number; resolved: number } | null;
  largestGap: CategoryBattle | null;
};

export function summarizeRun(snapshot: AiSearchSnapshot): AiRunSummary {
  const { run, calls, probes, citations } = snapshot;
  const engines = engineTallies(calls);
  const largest = Math.max(0, ...engines.map((engine) => engine.resolved));
  const cited = citationEvidence(calls, citations, "commercial");
  const competitors = competitorTallies(calls);
  const drift = driftRead(calls, probes);

  return {
    runId: run.audit_run_id,
    shortRunId: run.audit_run_id.slice(0, 8),
    completeness: runCompleteness(run, calls),
    completedAt: formatRunTime(run.completed_at),
    commercial: tallyCommercial(calls),
    probesAnswered: drift.answered,
    engines,
    smallSampleEngines: engines
      .filter((engine) => isSmallSample(engine.resolved, largest))
      .map((engine) => engine.key),
    categories: categoryTallies(calls),
    enginesAndModels: enginesAndModels(calls),
    errorEngines: errorsByEngine(calls),
    drift,
    citations: {
      rows: cited.rows.length,
      domains: groupCitations(cited.rows, (row) => row.domain).length,
      answered: cited.answered,
      answersWithCitation: cited.answersWithCitation,
      fenderOwnedRows: cited.rows.filter((row) => row.sourceClass === "fender_owned").length,
      stored: cited.stored,
      invalid: cited.invalid,
      duplicates: cited.duplicates,
    },
    competitorWins: competitors.reduce((sum, c) => sum + c.wins, 0),
    topCompetitor: competitors[0]
      ? { brand: competitors[0].brand, wins: competitors[0].wins, resolved: competitors[0].resolved }
      : null,
    largestGap: largestCompetitorGap(calls),
  };
}

export function pct(numerator: number, denominator: number): string {
  return denominator > 0 ? `${((100 * numerator) / denominator).toFixed(1)}%` : "No resolved answers";
}

/** "ChatGPT (model not recorded), Gemini (3.6 Flash), Perplexity (turbo)" */
export function engineModelLine(list: EngineModel[]): string {
  return list
    .map(({ engine, models }) =>
      `${engineLabel(engine)} (${models.length ? models.join(", ") : "model not recorded"})`,
    )
    .join(", ");
}

/** "27 provider errors, all Perplexity" or "9 provider errors (6 Perplexity, 3 Gemini)". */
export function errorLine(summary: AiRunSummary): string {
  const engines = summary.errorEngines;
  if (engines.length === 0) return "No provider errors";
  const total = engines.reduce((sum, entry) => sum + entry.errors, 0);
  const noun = total === 1 ? "provider error" : "provider errors";
  if (engines.length === 1) return `${total} ${noun}, all ${engineLabel(engines[0].engine)}`;
  return `${total} ${noun} (${engines.map((e) => `${e.errors} ${engineLabel(e.engine)}`).join(", ")})`;
}

export function runStateLabel(state: string): string {
  if (state === "completed") return "Complete";
  if (state === "partial") return "Partial";
  return state ? state.charAt(0).toUpperCase() + state.slice(1) : "State not recorded";
}

export function winRateHeadline(summary: AiRunSummary): string {
  const { fenderWins, resolved } = summary.commercial;
  return `${pct(fenderWins, resolved)} Fender lead (${fenderWins} of ${resolved} resolved)`;
}
