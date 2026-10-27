"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { DefinedCopy } from "@/components/v3/live/DefinedTerm";
import { briefingRetailLead } from "@/lib/fender-canvas/briefing-retail-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

/**
 * Opening figure on Summary Briefing: the same retail headline Catalog Health uses,
 * with a disc of that count versus the rest of the checked population.
 */
export function BriefingRetailHero({ read }: { read: RetailCanvasRead }) {
  const lead = briefingRetailLead(read);
  return (
    <div className="content-box" data-briefing-retail-hero="" style={{ marginBottom: 12 }}>
      <div className="metric-card-label" data-briefing-retail-label="">
        {lead.label}
      </div>
      <div
        data-briefing-retail-row=""
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          maxWidth: "100%",
          marginTop: 4,
        }}
      >
        <span
          className="ai-lead-figure"
          data-briefing-retail-figure=""
          style={lead.color ? { color: lead.color } : undefined}
        >
          {lead.figure}
        </span>
        {lead.pie ? (
          <CitationPieDisc
            pie={lead.pie}
            sizeClass="citation-pie-disc citation-pie-disc-accuracy"
            tip={lead.tip ?? undefined}
          />
        ) : null}
      </div>
      {lead.missingMessage ? (
        <p className="retail-missing" data-briefing-retail-missing="" style={{ marginTop: 8 }}>
          <DefinedCopy text={lead.missingMessage} />
        </p>
      ) : null}
    </div>
  );
}
