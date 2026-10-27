"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { DefinedCopy } from "@/components/v3/live/DefinedTerm";
import { retailOverviewLead } from "@/lib/fender-canvas/retail-overview-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

/**
 * First content on Retail Overview: large headline count beside a checked-population disc.
 * Matches the ai-lead-figure + CitationPieDisc language from AI Search tabs.
 */
export function RetailOverviewLead({ read }: { read: RetailCanvasRead }) {
  if (read.phase === "loading") {
    return <p className="retail-missing">Loading the retail reading…</p>;
  }
  if (read.phase === "error") {
    return <p className="retail-missing">The retail read could not be loaded.</p>;
  }

  const lead = retailOverviewLead(read.snapshot);

  return (
    <div className="content-box" data-retail-overview-lead="" data-retail-lead-finding={lead.findingId ?? "none"}>
      <div className="metric-card-label" data-retail-lead-label="">
        {lead.label}
      </div>
      <div
        data-retail-lead-row=""
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
          data-retail-lead-figure=""
          data-retail-lead-tone={lead.tone}
          style={{ color: lead.color }}
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
        <p className="retail-missing" data-retail-lead-missing="" style={{ marginTop: 8 }}>
          <DefinedCopy text={lead.missingMessage} />
        </p>
      ) : null}
    </div>
  );
}
