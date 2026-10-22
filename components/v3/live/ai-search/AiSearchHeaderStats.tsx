"use client";

import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { aiSpokeHeaderChips } from "@/lib/ai-search/canvas-surfaces";

export function AiSearchHeaderStats() {
  const read = useAiSearch();
  const history = useAiHistoryOptional();
  const chips = aiSpokeHeaderChips(read, {
    modeKind: history?.mode.kind,
  });
  if (chips.length === 0) return null;
  return (
    <div className="drilldown-header-stats" data-ai-header-stats>
      {chips.map((chip) => (
        <div
          key={chip.id}
          className={`drilldown-stat-chip${chip.tone === "warning" ? " is-warning" : ""}`}
          data-ai-stat={chip.id}
        >
          <span className="drilldown-stat-label">{chip.label}</span>
          <strong className="drilldown-stat-value">{chip.value}</strong>
        </div>
      ))}
    </div>
  );
}
