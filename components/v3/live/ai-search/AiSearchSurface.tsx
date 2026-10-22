"use client";

import type { ReactNode } from "react";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { HistoryBanner } from "@/components/v3/live/ai-search/HistoryBanner";
import { HistoryTrendsPanel } from "@/components/v3/live/ai-search/HistoryTrendsPanel";
import { LegacyRunInspect } from "@/components/v3/live/ai-search/LegacyRunInspect";

/**
 * Run Summary replaces its body with the range chart.
 * Citation Ecosystem follows those same runs, one snapshot at a time.
 * The other AI Search tabs stay on the current published run.
 */
export function AiSearchSurface({
  children,
  trend = false,
  followsRange = false,
}: {
  children: ReactNode;
  trend?: boolean;
  /** This tab computes its own figures from the runs in All time or a date range. */
  followsRange?: boolean;
}) {
  const history = useAiHistoryOptional();
  const ranged = history?.mode.kind === "range" || history?.mode.kind === "all";
  if (ranged && followsRange) return children;
  if (ranged && trend) {
    return (
      <div className="ai-search-panel">
        <HistoryTrendsPanel />
      </div>
    );
  }
  if (ranged) {
    const heading = history.mode.kind === "all" ? "All time" : "Selected range";
    return (
      <>
        <HistoryBanner
          heading={heading}
          detail="This tab shows the current published run. The selected range is charted on Run Summary."
        />
        {children}
      </>
    );
  }
  if (history?.mode.kind === "legacy") {
    return (
      <div className="ai-search-panel">
        <LegacyRunInspect />
      </div>
    );
  }
  return children;
}
