"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import {
  exactPageFigure,
  exactPageLeadPie,
  exactPageLeadTip,
  exactPageShareColor,
} from "@/lib/findability/lead";
import { OUTCOME_DEFINITION, OUTCOME_LABEL } from "@/lib/findability/copy";
import type { OutcomeCounts } from "@/lib/findability/outcomes";

const LABEL = OUTCOME_LABEL.exact_official_product;
const DEFINITION = OUTCOME_DEFINITION.exact_official_product;

/**
 * Findability tab hero: exact official product pages out of this read, beside
 * a disc of exact versus the rest. Prose and outcome cards stay below.
 */
export function FindabilityLead({ counts }: { counts: OutcomeCounts }) {
  if (counts.total <= 0) {
    return (
      <div className="content-box" data-findability-lead="">
        <span
          className="ai-lead-figure"
          data-findability-lead-figure=""
          data-findability-headline=""
        >
          This official-page read has no listings.
        </span>
      </div>
    );
  }

  const figure = exactPageFigure(counts);
  const pie = exactPageLeadPie(counts);
  const color = exactPageShareColor(counts);

  return (
    <div className="content-box" data-findability-lead="">
      <div>
        <span
          className="ifai-term"
          data-ifai-tooltip-title={LABEL}
          data-ifai-tooltip-desc={DEFINITION}
          tabIndex={0}
          aria-label={`${LABEL}: ${DEFINITION}`}
        >
          {LABEL}
        </span>
      </div>
      <div
        data-findability-lead-row=""
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginTop: 4,
          maxWidth: "100%",
        }}
      >
        <span
          className="ai-lead-figure"
          style={color ? { color } : undefined}
          data-findability-lead-figure=""
          data-findability-exact={counts.exact_official_product}
          data-findability-lead-total={counts.total}
        >
          {figure}
        </span>
        {pie ? (
          <CitationPieDisc
            pie={pie}
            sizeClass="citation-pie-disc citation-pie-disc-accuracy"
            tip={exactPageLeadTip(counts)}
          />
        ) : null}
      </div>
    </div>
  );
}
