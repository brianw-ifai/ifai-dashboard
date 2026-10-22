"use client";

import type { ReactNode } from "react";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { HistoryTrendsPanel } from "@/components/v3/live/ai-search/HistoryTrendsPanel";
import { LegacyRunInspect } from "@/components/v3/live/ai-search/LegacyRunInspect";

/**
 * Month, range, and all open the tab children on the pooled selection.
 * Run Summary also keeps the trend chart above those children.
 * Citation Ecosystem still follows range and all through followsRange.
 * Legacy stays on LegacyRunInspect. The map stays on the published run.
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
  const kind = history?.mode.kind;
  const windowed = kind === "month" || kind === "range" || kind === "all";
  if (windowed && followsRange) return children;
  if (windowed && trend) {
    return (
      <>
        <HistoryTrendsPanel />
        {children}
      </>
    );
  }
  if (windowed) return children;
  if (kind === "legacy") {
    return (
      <div className="ai-search-panel">
        <LegacyRunInspect />
      </div>
    );
  }
  return children;
}
