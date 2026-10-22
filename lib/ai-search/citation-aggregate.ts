import { formatDay, utcDay, type HistoryRunSummary } from "@/lib/ai-search/history-eligibility";
import { isReviewHistoryRun, scoringMethodFor, citationStorageCaution } from "@/lib/ai-search/review-runs";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

/** Inclusive day count for the citation tab's default window. */
export const CITATION_MONTH_DAYS = 30;

export function addUtcDays(day: string, delta: number): string | null {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return null;
  const next = new Date(Date.UTC(year, month - 1, date));
  next.setUTCDate(next.getUTCDate() + delta);
  return next.toISOString().slice(0, 10);
}

export function citationMonthBounds(endDay: string): { from: string; to: string } | null {
  const from = addUtcDays(endDay, -(CITATION_MONTH_DAYS - 1));
  if (!from) return null;
  return { from, to: endDay };
}

export type CitationWindow =
  | { kind: "month"; from: string; to: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "all" }
  | { kind: "run" };

/** Review runs whose day falls in the citation window. Order follows the catalog. */
export function runsInCitationWindow(
  runs: readonly HistoryRunSummary[],
  window: CitationWindow,
): HistoryRunSummary[] {
  return runs.filter(isReviewHistoryRun).filter((run) => {
    if (window.kind === "all" || window.kind === "run") return window.kind === "all";
    const day = utcDay(run.published_at ?? run.completed_at);
    if (!day) return false;
    return day >= window.from && day <= window.to;
  });
}

/** A run can enter a citation total only when its cited URLs were actually stored. */
export function citationSnapshotUsable(snapshot: AiSearchSnapshot): boolean {
  if (citationStorageCaution(snapshot.run.audit_run_id)) return false;
  const declared = snapshot.storedCitationCount ?? snapshot.citations.length;
  if (snapshot.citations.length < declared) return false;
  return snapshot.citations.length > 0 && snapshot.calls.length > 0;
}

/**
 * One snapshot whose calls and cited links are the sum of the included runs.
 * Ids are namespaced so the same simulation id cannot collide across runs.
 */
export function poolCitationSnapshots(snapshots: readonly AiSearchSnapshot[]): AiSearchSnapshot | null {
  if (snapshots.length === 0) return null;
  const ordered = [...snapshots].sort((a, b) => {
    const at = a.run.published_at ?? a.run.completed_at ?? "";
    const bt = b.run.published_at ?? b.run.completed_at ?? "";
    return at.localeCompare(bt) || a.run.audit_run_id.localeCompare(b.run.audit_run_id);
  });
  const calls = [];
  const citations = [];
  const probes = [];
  for (const snapshot of ordered) {
    const prefix = snapshot.run.audit_run_id;
    const ids = new Map<string, string>();
    for (const call of snapshot.calls) {
      const id = `${prefix}:${call.id}`;
      ids.set(call.id, id);
      calls.push({ ...call, id });
    }
    for (const citation of snapshot.citations) {
      citations.push({
        ...citation,
        simulation_id: ids.get(citation.simulation_id) ?? `${prefix}:${citation.simulation_id}`,
      });
    }
    probes.push(...snapshot.probes);
  }
  const latest = ordered[ordered.length - 1];
  return {
    run: latest.run,
    calls,
    probes,
    citations,
    storedCitationCount: citations.length,
  };
}

export function citationAggregateCopy(input: {
  window: CitationWindow;
  included: readonly AiSearchSnapshot[];
  omitted: number;
}): string {
  const runs = input.included.length;
  const runWord = runs === 1 ? "run" : "runs";
  const days = input.included
    .map((snapshot) => utcDay(snapshot.run.published_at ?? snapshot.run.completed_at))
    .filter((day): day is string => day != null)
    .sort();
  const span = days.length > 0 ? `${formatDay(days[0])} to ${formatDay(days[days.length - 1])}` : "dates not recorded";
  const lead =
    input.window.kind === "month"
      ? `Last ${CITATION_MONTH_DAYS} days, ${span}.`
      : input.window.kind === "all"
        ? `All time, ${span}.`
        : input.window.kind === "range"
          ? `${formatDay(input.window.from)} to ${formatDay(input.window.to)}.`
          : "This run only.";
  const added = `Figures add ${runs} ${runWord}.`;
  const leftOut =
    input.omitted > 0
      ? ` ${input.omitted} ${input.omitted === 1 ? "run is" : "runs are"} left out because citations were not stored.`
      : "";
  const methods = new Set(
    input.included
      .map((snapshot) => scoringMethodFor(snapshot.run))
      .filter((method): method is NonNullable<typeof method> => method != null),
  );
  const scoring =
    methods.size > 1
      ? " Lead rates and gaps add runs that named the leader in different ways."
      : "";
  return `${lead} ${added}${leftOut}${scoring}`;
}
