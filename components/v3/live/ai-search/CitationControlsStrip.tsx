"use client";

import type { CitationScope } from "@/lib/ai-search/citations";
import type { CitationRead } from "@/lib/ai-search/citations";
import { engineLabel } from "@/lib/ai-search/run-metrics";
import { pct } from "@/lib/ai-search/summary";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

const SCOPES: Array<[CitationScope, string]> = [
  ["commercial", "Shopping answers"],
  ["probe", "Product fact checks"],
  ["all", "All answers"],
];

export function CitationControlsStrip({
  snapshot,
  read,
  scope,
  onScope,
  scopeNoun,
}: {
  snapshot: AiSearchSnapshot;
  read: CitationRead;
  scope: CitationScope;
  onScope: (scope: CitationScope) => void;
  scopeNoun: string;
}) {
  const engines = [
    ...new Set(
      snapshot.calls
        .filter((call) => call.call_status === "answered")
        .map((call) => engineLabel(call.engine)),
    ),
  ].sort();

  return (
    <div className="citation-controls" data-citation-controls>
      <div className="citation-controls-meta" data-citation-run-context>
        <span data-ai-cited-answers>
          {read.answersWithCitation} of {read.answered} {scopeNoun} cited web sources (
          {pct(read.answersWithCitation, read.answered)})
        </span>
        <span aria-hidden="true">·</span>
        <span data-ai-cited-links>
          {read.rows.length} cited links
        </span>
        <span aria-hidden="true">·</span>
        <span>{engines.length ? engines.join(", ") : "No engines"}</span>
      </div>
      <div role="group" aria-label="Citation scope" className="citation-scope-group">
        {SCOPES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`segmented-btn${scope === value ? " active" : ""}`}
            aria-pressed={scope === value}
            onClick={() => onScope(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
