"use client";

import { EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { ExternalLink } from "@/components/v3/live/ai-search/ExternalLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { PROBE_STATE_LABELS, type ProbeEvidence, type ProbeState } from "@/lib/ai-search/drift";
import { engineLabel, formatRunTime, modelLabel } from "@/lib/ai-search/run-metrics";

const STATE_TONE: Record<ProbeState, string> = {
  confirmed: "tag-danger",
  no_contradiction: "tag-success",
  no_fact: "tag-neutral",
  provider_error: "tag-warning",
  unverified: "tag-warning",
};

export function FactCheckTable({ rows }: { rows: ProbeEvidence[] }) {
  return (
    <div className="content-box ai-probe-table" style={{ marginTop: 12 }}>
      <div className="content-box-title">Every product fact check in this run</div>
      {rows.length === 0 ? <EmptyRows>This run sent no product fact checks.</EmptyRows> : null}
      {rows.length ? (
        <table className="table-sm">
          <thead>
            <tr>
              <th>Question checked</th>
              <th>Engine</th>
              <th>Result</th>
              <th>Verified Fender fact</th>
              <th>Checked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} data-probe-state={row.state} data-sim-id={row.simId}>
                <td>
                  <EvidenceLink focus={{ field: "sim", value: String(row.simId) }} tab={AI_TABS.simulations}>
                    {row.prompt}
                  </EvidenceLink>
                </td>
                <td>
                  {engineLabel(row.engine)}
                  <div style={mutedText}>{modelLabel(row.model)}</div>
                </td>
                <td>
                  <span className={`tag-badge ${STATE_TONE[row.state]}`}>{PROBE_STATE_LABELS[row.state]}</span>
                </td>
                <td style={{ wordBreak: "break-word" }}>
                  {row.claim ? (
                    <>
                      {row.claim} <ExternalLink href={row.sourceUrl}>Fender source</ExternalLink>
                    </>
                  ) : (
                    "Not verified yet"
                  )}
                  {row.evidence ? <div style={mutedText}>Conflicting text: {row.evidence}</div> : null}
                </td>
                <td>{formatRunTime(row.checkedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
