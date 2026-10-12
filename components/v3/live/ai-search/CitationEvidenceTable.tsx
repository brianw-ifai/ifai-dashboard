"use client";

import { useState } from "react";
import { EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { ExternalLink } from "@/components/v3/live/ai-search/ExternalLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { SOURCE_CLASS_LABELS, type CitationEvidence } from "@/lib/ai-search/citations";
import { engineLabel, modelLabel } from "@/lib/ai-search/run-metrics";

const PAGE = 25;

export function CitationEvidenceTable({
  rows,
  label,
  onClear,
}: {
  rows: CitationEvidence[];
  label: string;
  onClear?: () => void;
}) {
  const [limit, setLimit] = useState(PAGE);
  const shown = rows.slice(0, limit);
  return (
    <div className="content-box ai-citation-evidence" style={{ marginTop: 12 }}>
      <div className="content-box-title">
        <span>Cited pages: {label}</span>
        <span className="tag-badge tag-neutral" data-ai-citation-count>{rows.length} links</span>
      </div>
      {onClear ? (
        <button type="button" className="segmented-btn" onClick={onClear} style={{ marginBottom: 6 }}>
          Show every cited page
        </button>
      ) : null}
      {rows.length === 0 ? <EmptyRows>No valid cited page matches this selection.</EmptyRows> : null}
      {rows.length ? (
        <table className="table-sm">
          <thead>
            <tr><th>Prompt and answer</th><th>Engine</th><th>Page</th><th>Domain and class</th></tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.key} data-domain={row.domain} data-source-class={row.sourceClass}>
                <td style={{ wordBreak: "break-word" }}>
                  <EvidenceLink focus={{ field: "sim", value: String(row.simId) }} tab={AI_TABS.simulations}>
                    {row.prompt}
                  </EvidenceLink>
                  <div style={mutedText}>Answer {row.simId}</div>
                </td>
                <td>{engineLabel(row.engine)}<div style={mutedText}>{modelLabel(row.model)}</div></td>
                <td style={{ wordBreak: "break-all" }}>
                  <ExternalLink href={row.rawUrl}>{row.title ?? row.canonicalUrl}</ExternalLink>
                  <div style={mutedText}>Raw: {row.rawUrl}</div>
                  {row.canonicalUrl !== row.rawUrl ? <div style={mutedText}>Canonical: {row.canonicalUrl}</div> : null}
                </td>
                <td>{row.domain}<div style={mutedText}>{SOURCE_CLASS_LABELS[row.sourceClass]}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {rows.length > limit ? (
        <button type="button" className="segmented-btn" style={{ marginTop: 6 }} onClick={() => setLimit((n) => n + PAGE)}>
          Show {Math.min(PAGE, rows.length - limit)} more of {rows.length - limit}
        </button>
      ) : null}
    </div>
  );
}
