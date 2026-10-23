"use client";

import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { competitorsSpokeLead } from "@/lib/ai-search/canvas-surfaces";

/**
 * Competitive Radar's opening sentence.
 * The spec string is built from the published run. This reads the snapshot the tables use.
 * The N-of-M clause is the figure. The rest of the sentence sits under it.
 */
export function CompetitorsSpokeDescription() {
  const { figure, explainer } = competitorsSpokeLead(useAiSearch());
  return (
    <span data-ai-competitor-desc="">
      {explainer ? <span className="ai-lead-figure">{figure}</span> : figure}
      {explainer ? <span className="ai-lead-explainer">{explainer}</span> : null}
    </span>
  );
}
