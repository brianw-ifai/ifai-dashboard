"use client";

import type { ReactNode } from "react";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { HistoryTrendsPanel } from "@/components/v3/live/ai-search/HistoryTrendsPanel";
import { LegacyRunInspect } from "@/components/v3/live/ai-search/LegacyRunInspect";

/** Keeps the AI Search tabs in place. Range and legacy views replace only this panel body. */
export function AiSearchSurface({ children }: { children: ReactNode }) {
  const history = useAiHistoryOptional();
  if (history?.mode.kind === "range" || history?.mode.kind === "all") {
    return (
      <div className="ai-search-panel">
        <HistoryTrendsPanel />
      </div>
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
