"use client";

import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { competitorsSpokeDesc } from "@/lib/ai-search/canvas-surfaces";

/**
 * Competitive Radar's opening sentence.
 * The spec string is built from the published run. This reads the snapshot the tables use.
 */
export function CompetitorsSpokeDescription() {
  return <span data-ai-competitor-desc="">{competitorsSpokeDesc(useAiSearch())}</span>;
}
