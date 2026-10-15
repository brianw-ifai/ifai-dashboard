import { STORED_RUN_COPY_DATA } from "@/lib/ai-search/stored-run-copy-data";
import { STORED_RUN_COPY_LABEL } from "@/lib/ai-search/review-runs";
import type { AiCallRow, AiCitationRow, AiCurrentRun, AiProbeRow, AiSearchSnapshot } from "@/lib/ai-search/types";

/**
 * A bundled copy of the three stored review runs, so the history preview can
 * be inspected before the history views are applied. It is not a live read.
 */
export { STORED_RUN_COPY_LABEL };

export function storedRunSnapshots(): AiSearchSnapshot[] {
  return STORED_RUN_COPY_DATA.runs.map((entry) => ({
    run: { ...entry.run } as AiCurrentRun,
    calls: entry.calls.map((call) => ({ ...call })) as AiCallRow[],
    probes: entry.probes.map((probe) => ({ ...probe })) as AiProbeRow[],
    citations: entry.citations.map((citation) => ({ ...citation })) as AiCitationRow[],
    storedCitationCount: entry.storedCitationCount,
  }));
}

export function storedRunSnapshot(runId: string): AiSearchSnapshot | null {
  return storedRunSnapshots().find((snapshot) => snapshot.run.audit_run_id === runId) ?? null;
}
