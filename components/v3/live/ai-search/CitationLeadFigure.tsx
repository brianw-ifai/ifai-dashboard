"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { citationOwnedLinksLead } from "@/lib/ai-search/citation-lead";

/**
 * Opening figure on Citation Ecosystem: Fender-owned share of cited links.
 * Sits above the panel title. Uses the same rows the charts already show.
 */
export function CitationLeadFigure({
  owned,
  total,
  ready,
}: {
  owned: number;
  total: number;
  /** False when citation URLs are not loaded or storage caution applies. */
  ready: boolean;
}) {
  if (!ready) return null;
  const lead = citationOwnedLinksLead(owned, total);
  return (
    <div data-citation-lead data-citation-lead-total={total} data-citation-lead-owned={owned}>
      <span className="ai-lead-figure" data-citation-lead-figure>
        {lead.figure}
      </span>
      {lead.population ? (
        <>
          <span data-citation-lead-label>
            <AiTerm term="Fender-owned">Fender-Owned</AiTerm> Links
          </span>
          <span className="ai-lead-explainer" data-citation-lead-population>
            {owned} of {total} cited links lead to <AiTerm term="Fender-owned">Fender-owned</AiTerm>{" "}
            sites
          </span>
        </>
      ) : null}
    </div>
  );
}
