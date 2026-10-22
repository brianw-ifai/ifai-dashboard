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
  part = "all",
}: {
  snapshot: AiSearchSnapshot;
  read: CitationRead;
  scope: CitationScope;
  onScope: (scope: CitationScope) => void;
  scopeNoun: string;
  /** Scopes stay in the first view. The cited-any-source line sits under the executive facts. */
  part?: "all" | "scopes" | "meta";
}) {
  const engines = [
    ...new Set(
      snapshot.calls
        .filter((call) => call.call_status === "answered")
        .map((call) => engineLabel(call.engine)),
    ),
  ].sort();

  const scopes = (
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
  );
  const meta = (
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
  );
  if (part === "scopes") return <div className="citation-controls citation-controls-scopes" data-citation-controls>{scopes}</div>;
  if (part === "meta") return meta;
  return (
    <div className="citation-controls" data-citation-controls>
      {meta}
      {scopes}
    </div>
  );
}
