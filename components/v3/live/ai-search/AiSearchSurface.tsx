"use client";

import type { ReactNode } from "react";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { HistoryBanner } from "@/components/v3/live/ai-search/HistoryBanner";
import { HistoryTrendsPanel } from "@/components/v3/live/ai-search/HistoryTrendsPanel";
import { LegacyRunInspect } from "@/components/v3/live/ai-search/LegacyRunInspect";

/**
 * The range chart belongs on Run Summary. The other AI Search tabs keep their own panels.
 * Those panels stay on the current published run, so the range is not mixed into one rate.
 */
export function AiSearchSurface({ children, trend = false }: { children: ReactNode; trend?: boolean }) {
  const history = useAiHistoryOptional();
  const ranged = history?.mode.kind === "range" || history?.mode.kind === "all";
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
