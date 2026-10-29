"use client";

import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { BriefingFindingCard } from "@/components/v3/live/BriefingFindingCard";
import { useFindability } from "@/components/v3/live/findability/FindabilityContext";
import {
  briefingFindingsLead,
  type BriefingLostRevenuePlaceholder,
} from "@/lib/fender-canvas/briefing-retail-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

function LostRevenuePlaceholder({ placeholder }: { placeholder: BriefingLostRevenuePlaceholder }) {
  return (
    <div
      className="briefing-revenue-placeholder"
      data-briefing-revenue-placeholder=""
      aria-label={`${placeholder.label}: ${placeholder.figure}`}
    >
      <span className="metric-card-label" data-briefing-revenue-label="">
        {placeholder.label}
      </span>
      <span className="ai-lead-figure" data-briefing-revenue-figure="">
        {placeholder.figure}
      </span>
      <span className="metric-card-sub" data-briefing-revenue-explainer="">
        {placeholder.explainer}
      </span>
    </div>
  );
}

/**
 * Summary Briefing hero: five executive findings in one row.
 * Buy Box sits with the monthly lost-revenue placeholder; that placeholder is not a sixth finding.
 */
export function BriefingRetailHero({ read }: { read: RetailCanvasRead }) {
  const findability = useFindability();
  const ai = useAiSearch();
  const { findings, lostRevenue } = briefingFindingsLead(read, findability, ai);
  const [buyBox, ...rest] = findings;

  return (
    <div className="briefing-findings" data-briefing-retail-hero="" data-briefing-findings="">
      <div className="briefing-buy-box-cluster" data-briefing-buy-box-cluster="">
        <BriefingFindingCard finding={buyBox} />
        <LostRevenuePlaceholder placeholder={lostRevenue} />
      </div>
      {rest.map((finding) => (
        <BriefingFindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}
