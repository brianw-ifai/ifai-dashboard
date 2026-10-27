"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import { useFindability } from "@/components/v3/live/findability/FindabilityContext";
import {
  briefingFindingsLead,
  type BriefingFinding,
  type BriefingLostRevenuePlaceholder,
} from "@/lib/fender-canvas/briefing-retail-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

const BRIEFING_PIE_SIZE = "citation-pie-disc citation-pie-disc-retail";

function BriefingFindingCard({ finding }: { finding: BriefingFinding }) {
  return (
    <div
      className="retail-finding retail-overview-hero briefing-finding"
      data-ifai-open={finding.spokeId}
      data-ifai-tab={finding.tab}
      data-briefing-finding={finding.id}
    >
      <button type="button" className="retail-finding-hit">
        <span className="metric-card-label" data-briefing-finding-label="">
          {finding.label}
        </span>
        <span className="retail-overview-hero-row" data-briefing-finding-row="">
          <span className="retail-overview-hero-figures">
            <span
              className="ai-lead-figure"
              data-briefing-finding-percent=""
              data-briefing-finding-tone={finding.tone}
              data-briefing-finding-numerator={finding.numerator ?? ""}
              data-briefing-finding-denominator={finding.denominator ?? ""}
              style={{ color: finding.color }}
            >
              {finding.percent}
            </span>
            {finding.ratio ? (
              <span className="retail-overview-hero-ratio" data-briefing-finding-ratio="">
                {finding.ratio}
              </span>
            ) : null}
          </span>
          {finding.pie ? (
            <CitationPieDisc
              pie={finding.pie}
              sizeClass={BRIEFING_PIE_SIZE}
              tip={finding.tip ?? undefined}
            />
          ) : null}
        </span>
        <span className="metric-card-sub" data-briefing-finding-explainer="">
          {finding.explainer}
        </span>
      </button>
    </div>
  );
}

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
