"use client";

import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { BriefingFindingCard } from "@/components/v3/live/BriefingFindingCard";
import { useFindability } from "@/components/v3/live/findability/FindabilityContext";
import { briefingFindingsLead } from "@/lib/fender-canvas/briefing-retail-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

/**
 * Strategy Roadmap · first tab: the same five Summary Briefing findings.
 * Figures open first. No dated plan copy, dollars, or history line.
 * Buy Box monthly lost-revenue stays Not available* on Summary Briefing, not here.
 */
export function RoadmapFindingsPanel({ read }: { read: RetailCanvasRead }) {
  const findability = useFindability();
  const ai = useAiSearch();
  const { findings } = briefingFindingsLead(read, findability, ai);

  return (
    <div data-roadmap-findings-panel="">
      <div className="briefing-findings" data-roadmap-findings="">
        {findings.map((finding) => (
          <BriefingFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
      <p className="metric-card-sub" style={{ marginTop: 12 }} data-roadmap-findings-note="">
        Current findings. Open one to see the evidence on its home screen.
      </p>
    </div>
  );
}
