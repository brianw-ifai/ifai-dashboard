"use client";

import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { BriefingFindingCard } from "@/components/v3/live/BriefingFindingCard";
import { useFindability } from "@/components/v3/live/findability/FindabilityContext";
import { briefingFindingsLead } from "@/lib/fender-canvas/briefing-retail-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

/**
 * Strategy Roadmap · first tab: the same five Summary Briefing findings.
 * Replaces the example 30-60-90 phase cards. No dated plan copy, dollars, or history line.
 */
export function RoadmapFindingsPanel({ read }: { read: RetailCanvasRead }) {
  const findability = useFindability();
  const ai = useAiSearch();
  const { findings } = briefingFindingsLead(read, findability, ai);

  return (
    <div className="content-box" data-roadmap-findings-panel="">
      <div className="content-box-title">Current findings</div>
      <div className="briefing-findings" data-roadmap-findings="">
        {findings.map((finding) => (
          <BriefingFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
}
