"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import type { BriefingFinding } from "@/lib/fender-canvas/briefing-retail-lead";

const BRIEFING_PIE_SIZE = "citation-pie-disc citation-pie-disc-retail";

/** One Summary Briefing / Current findings share: percent, N of M, optional pie. */
export function BriefingFindingCard({ finding }: { finding: BriefingFinding }) {
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
