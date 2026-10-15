import { compareRuns, isTrustworthyRun, type HistoryRunSummary } from "@/lib/ai-search/history-eligibility";

/**
 * Internal history review. These are the only stored runs the calendar offers.
 * Counts were re-queried from simulation rows on 2026-10-14. The audit-run
 * counter for the earlier October 12 run still says 72 answered and 30 errors;
 * the simulation rows are 73 and 29. This module does not change stored rows.
 */

export const OCTOBER_11_RUN_ID = "7c3e9f52-4b1a-4d8e-9a6f-2e5d81b0c4a7";
export const EARLIER_OCTOBER_12_RUN_ID = "e775ee16-ec5b-45b0-8918-579181b44aff";
export const PUBLISHED_OCTOBER_12_RUN_ID = "b28d6086-65f3-4d12-a775-ea724ea58f22";

/** The two runs the history view adds. The published run already matches the v11 rule. */
export const ADDITIONAL_REVIEW_RUN_IDS = [OCTOBER_11_RUN_ID, EARLIER_OCTOBER_12_RUN_ID] as const;

export const REVIEW_RUN_IDS = [OCTOBER_11_RUN_ID, EARLIER_OCTOBER_12_RUN_ID, PUBLISHED_OCTOBER_12_RUN_ID] as const;

export const STORED_RUN_COPY_LABEL =
  "Copy of the stored runs, captured for review before the history views are applied. Not a live database read.";

export type ScoringMethod = "original_winner" | "mention_share";

export const SCORING_LABELS: Record<ScoringMethod, string> = {
  original_winner: "Original winner labels",
  mention_share: "Mention-based scoring",
};

/** Simulation-row counts. The earlier run's audit columns are stale. */
export const ROW_LEVEL_COUNTS: Record<string, { answered: number; errors: number; calls: number; citations: number }> = {
  [OCTOBER_11_RUN_ID]: { answered: 100, errors: 0, calls: 100, citations: 468 },
  [EARLIER_OCTOBER_12_RUN_ID]: { answered: 73, errors: 29, calls: 102, citations: 2 },
  [PUBLISHED_OCTOBER_12_RUN_ID]: { answered: 75, errors: 27, calls: 102, citations: 243 },
};

export const CITATION_STORAGE_CAUTION =
  "Citations were mostly not stored for this run. These 2 stored citations are not evidence that the citation ecosystem changed.";

const ADDITIONAL = new Set<string>(ADDITIONAL_REVIEW_RUN_IDS);

export function isAdditionalReviewRun(runId: string | null | undefined): boolean {
  return runId != null && ADDITIONAL.has(runId);
}

/** Published full v11 runs, plus the two named stored runs. Fragments stay out. */
export function isReviewHistoryRun(run: HistoryRunSummary): boolean {
  if (isAdditionalReviewRun(run.audit_run_id)) return true;
  return isTrustworthyRun(run);
}

export function scoringMethodFor(run: { audit_run_id?: string | null; collector_version?: string | null }): ScoringMethod | null {
  if (run.audit_run_id === OCTOBER_11_RUN_ID) return "original_winner";
  if (run.audit_run_id === EARLIER_OCTOBER_12_RUN_ID || run.audit_run_id === PUBLISHED_OCTOBER_12_RUN_ID) return "mention_share";
  if (run.collector_version === "v11") return "mention_share";
  return null;
}

export function scoringLabel(run: { audit_run_id?: string | null; collector_version?: string | null }): string | null {
  const method = scoringMethodFor(run);
  return method ? SCORING_LABELS[method] : null;
}

export function citationStorageCaution(runId: string | null | undefined): string | null {
  return runId === EARLIER_OCTOBER_12_RUN_ID ? CITATION_STORAGE_CAUTION : null;
}

/** Prefer simulation-row counts over a stale audit-run counter. */
export function withRowLevelCounts<T extends HistoryRunSummary>(run: T): T {
  const counts = ROW_LEVEL_COUNTS[run.audit_run_id];
  if (!counts) return run;
  return { ...run, answered_calls: counts.answered, error_calls: counts.errors, attempted_calls: counts.calls };
}

export function reviewCatalog(runs: readonly HistoryRunSummary[]): HistoryRunSummary[] {
  return runs.filter(isReviewHistoryRun).map((run) => withRowLevelCounts(run)).sort(compareRuns);
}

export function previousReviewRun(runs: readonly HistoryRunSummary[], anchorId: string | null): HistoryRunSummary | null {
  const trusted = [...runs].sort(compareRuns);
  if (!anchorId) return trusted.length >= 2 ? trusted[trusted.length - 2] : null;
  const index = trusted.findIndex((run) => run.audit_run_id === anchorId);
  if (index > 0) return trusted[index - 1];
  if (index === 0) return null;
  return trusted.length >= 2 ? trusted[trusted.length - 2] : null;
}

export function hasPartialCoverage(run: HistoryRunSummary): boolean {
  if (run.run_state === "partial" || run.run_state === "historical") return true;
  if ((run.error_calls ?? 0) > 0) return true;
  if (run.audit_run_id === OCTOBER_11_RUN_ID) return true;
  return false;
}
