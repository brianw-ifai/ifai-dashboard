"use client";

import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { formatRunTime } from "@/lib/ai-search/run-metrics";
import { engineModelLine, errorLine, runStateLabel, summarizeRun } from "@/lib/ai-search/summary";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";
import {
  callDaySpan,
  distinctCallRunIds,
  isWindowHistoryKind,
  pooledCompletenessCopy,
} from "@/lib/ai-search/window-display";

const SIM = AI_TABS.simulations;

/** Single-run completeness, including partial wording. */
function SingleRunCard({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const s = summarizeRun(snapshot);
  const { run } = snapshot;
  const rowsShort = s.completeness.expected != null && s.completeness.rowsRead < s.completeness.expected;
  return (
    <div className="content-box ai-run-card">
      <div className="content-box-title">
        <span>Run completeness</span>
        <span className={`tag-badge ${s.completeness.isPartial ? "tag-warning" : "tag-success"}`}>
          {runStateLabel(s.completeness.state)}
        </span>
      </div>
      <table className="table-sm">
        <tbody>
          <tr><td>Run</td><td style={{ wordBreak: "break-all" }}>{run.audit_run_id}</td></tr>
          <tr><td>Prompt set</td><td style={{ wordBreak: "break-all" }}>{run.prompt_set_hash ?? "Not recorded"}</td></tr>
          <tr><td>Collector</td><td>{run.collector_version ?? "Not recorded"}</td></tr>
          <tr><td>Started</td><td>{formatRunTime(run.started_at)}</td></tr>
          <tr><td>Completed</td><td>{formatRunTime(run.completed_at)}</td></tr>
          <tr><td>Published</td><td>{formatRunTime(run.published_at)}</td></tr>
          <tr><td>Expected calls</td><td>{run.expected_calls ?? "Not recorded"}</td></tr>
          <tr><td>Answered calls</td><td>{run.answered_calls ?? "Not recorded"}</td></tr>
          <tr>
            <td>Provider errors</td>
            <td>
              <EvidenceLink focus={{ field: "outcome", value: "error" }} tab={SIM}>
                {errorLine(s)}
              </EvidenceLink>
            </td>
          </tr>
          <tr><td>Missing answers</td><td>{run.missing_calls ?? "Not recorded"}</td></tr>
          <tr><td>Engines and models</td><td>{engineModelLine(s.enginesAndModels)}</td></tr>
        </tbody>
      </table>
      {s.completeness.isPartial ? (
        <p style={{ ...mutedText, marginTop: 8 }}>
          This run is partial. Every figure below covers answered calls only. Unanswered calls are not losses.
        </p>
      ) : null}
      {rowsShort ? (
        <p style={{ ...mutedText, marginTop: 8, color: "var(--warning-text)" }}>
          The read returned {s.completeness.rowsRead} call rows for {s.completeness.expected} expected calls.
        </p>
      ) : null}
    </div>
  );
}

/** Pooled month / range / all: run count and date span, not the latest run's badge. */
function WindowCard({ snapshot, selectionLabel }: { snapshot: AiSearchSnapshot; selectionLabel: string }) {
  const s = summarizeRun(snapshot);
  const runIds = distinctCallRunIds(snapshot);
  const span = callDaySpan(snapshot);
  const copy = pooledCompletenessCopy({
    selectionLabel,
    runCount: runIds.length,
    span,
  });
  return (
    <div className="content-box ai-run-card" data-ai-window-completeness>
      <div className="content-box-title">
        <span>Selection completeness</span>
        <span className="tag-badge tag-neutral">
          {runIds.length} {runIds.length === 1 ? "run" : "runs"}
        </span>
      </div>
      <p style={{ ...mutedText, margin: "0 0 8px" }} data-ai-window-completeness-copy>
        {copy}
      </p>
      <table className="table-sm">
        <tbody>
          <tr><td>Runs in this selection</td><td>{runIds.length}</td></tr>
          <tr>
            <td>Provider errors</td>
            <td>
              <EvidenceLink focus={{ field: "outcome", value: "error" }} tab={SIM}>
                {errorLine(s)}
              </EvidenceLink>
            </td>
          </tr>
          <tr><td>Engines and models</td><td>{engineModelLine(s.enginesAndModels)}</td></tr>
          <tr><td>Answered call rows</td><td>{s.completeness.rowsRead}</td></tr>
        </tbody>
      </table>
      <p style={{ ...mutedText, marginTop: 8 }}>
        Lead rates below add answered calls from those runs. They are not one run&apos;s partial status or expected-call
        count.
      </p>
    </div>
  );
}

export function RunCompletenessCard({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const history = useAiHistoryOptional();
  const kind = history?.mode.kind;
  if (history && isWindowHistoryKind(kind)) {
    return <WindowCard snapshot={snapshot} selectionLabel={history.controlLabel} />;
  }
  return <SingleRunCard snapshot={snapshot} />;
}
