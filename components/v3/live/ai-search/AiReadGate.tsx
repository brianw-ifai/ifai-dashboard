"use client";

import type { ReactNode } from "react";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { errorLine, runStateLabel, summarizeRun } from "@/lib/ai-search/summary";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

export const mutedText = { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 } as const;

function Notice({ heading, children, tone }: { heading: string; children: ReactNode; tone: string }) {
  return (
    <div className="content-box" data-ai-state={tone}>
      <div className="content-box-title">{heading}</div>
      <p style={mutedText}>{children}</p>
    </div>
  );
}

/** AI-specific freshness: the published run's own completion time, not any other job's. */
export function RunFreshness({ snapshot, stale }: { snapshot: AiSearchSnapshot; stale?: boolean }) {
  const s = summarizeRun(snapshot);
  const { completeness: run } = s;
  return (
    <div
      className="ai-run-freshness"
      style={{ ...mutedText, fontSize: 11, display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}
    >
      <span className={`tag-badge ${run.isPartial ? "tag-warning" : "tag-success"}`}>
        {run.isPartial ? <AiTerm term="partial run">Partial run</AiTerm> : runStateLabel(run.state)}
      </span>
      <span>
        <AiTerm term="published run">Published run</AiTerm> {s.shortRunId} · completed {s.completedAt}
      </span>
      <span>
        {run.answered ?? "Unknown"} of {run.expected ?? "unknown"} calls answered · {errorLine(s)}
      </span>
      {stale ? <span className="tag-badge tag-warning">Refresh failed, showing the last good read</span> : null}
    </div>
  );
}

/** Loading, failed, and missing reads never fall through to zeros or demo figures. */
export function AiReadGate({ children }: { children: (snapshot: AiSearchSnapshot) => ReactNode }) {
  return (
    <div className="ai-search-panel">
      <GateBody>{children}</GateBody>
    </div>
  );
}

function GateBody({ children }: { children: (snapshot: AiSearchSnapshot) => ReactNode }) {
  const read = useAiSearch();
  if (read.phase === "loading") {
    return (
      <Notice heading="Loading the published AI run" tone="loading">
        Reading the published AI run. Figures appear when it loads.
      </Notice>
    );
  }
  if (read.phase === "error") {
    return (
      <Notice heading="The AI run did not load" tone="error">
        The published AI run did not load, so no AI Search figure is shown. {read.message}
      </Notice>
    );
  }
  if (read.phase === "no-run") {
    return (
      <Notice heading="No published AI run" tone="empty">
        No AI run has been published yet. Figures appear once IntoFocus publishes a completed or partial run.
      </Notice>
    );
  }
  return (
    <div data-ai-state={read.snapshot.run.run_state}>
      <RunFreshness snapshot={read.snapshot} stale={read.stale} />
      {children(read.snapshot)}
    </div>
  );
}

export function EmptyRows({ children }: { children: ReactNode }) {
  return (
    <p className="ai-empty" style={{ ...mutedText, fontStyle: "italic" }}>
      {children}
    </p>
  );
}
