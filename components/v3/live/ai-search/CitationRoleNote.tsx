"use client";

import { mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";

/** What each kind of cited source does for the brand, and what a count cannot tell you. */
export function CitationRoleNote() {
  return (
    <div className="ceo-callout" style={{ marginTop: 12 }}>
      <div className="ceo-callout-header">
        <span>Why this matters</span>
      </div>
      <div className="ceo-callout-body">
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          <li>
            <AiTerm term="Fender-owned">Fender-owned</AiTerm> sources provide canonical product facts.
          </li>
          <li>Retailer sources help shoppers find products they can buy.</li>
          <li>Editorial and community sources provide independent authority.</li>
          <li>
            Depending on third parties gives Fender less control over the facts assistants repeat. A useful authorized
            retailer citation is not a worse outcome than a Fender page, so read this mix as a balance rather than a
            target.
          </li>
        </ul>
      </div>
    </div>
  );
}

export function CitationInterpretationNote({ partial }: { partial: boolean }) {
  return (
    <p style={{ ...mutedText, marginTop: 8 }} data-ai-citation-interpretation>
      These are explicit links returned in {partial ? "this partial run" : "this run"}. A low count does not prove a
      source had no influence on the model, and an engine can use a source without returning it as a{" "}
      <AiTerm term="cited link" />.
    </p>
  );
}
