"use client";

import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { ExternalLink } from "@/components/v3/live/ai-search/ExternalLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { PROBE_STATE_LABELS, type ProbeEvidence, type ProbeState } from "@/lib/ai-search/drift";
import { engineLabel, formatRunTime, modelLabel } from "@/lib/ai-search/run-metrics";
import type { SortInput } from "@/lib/fender-canvas/table-sort";

const STATE_TONE: Record<ProbeState, string> = {
  confirmed: "tag-danger",
  no_contradiction: "tag-success",
  no_fact: "tag-neutral",
  provider_error: "tag-warning",
  unverified: "tag-warning",
};

const COLUMNS = [
  clientColumn("question", "Question checked", "text", 240, 140),
  clientColumn("engine", "Engine", "text", 140, 100),
  clientColumn("result", "Result", "text", 240, 160),
  clientColumn("fact", "Verified Fender fact", "text", 260, 140),
  clientColumn("checked", "Checked", "date", 170, 120),
];

function factSortValue(row: ProbeEvidence, columnId: string): SortInput {
  if (columnId === "question") return row.prompt.trim() || null;
  if (columnId === "engine") return engineLabel(row.engine);
  if (columnId === "result") return PROBE_STATE_LABELS[row.state];
  if (columnId === "fact") return row.claim?.trim() || null;
  return row.checkedAt;
}

export function FactCheckTable({ rows }: { rows: ProbeEvidence[] }) {
  const sorted = useClientTableSort(rows, COLUMNS, factSortValue);
  return (
    <div className="content-box ai-probe-table" style={{ marginTop: 12 }}>
      <div className="content-box-title">Every product fact check in this run</div>
      {rows.length === 0 ? <EmptyRows>This run sent no product fact checks.</EmptyRows> : null}
      {rows.length ? (
        <ResizableTable
          tableId="product-fact-checks"
          columns={COLUMNS}
          freezeHeader
          maxHeight={520}
          sort={sorted.sort}
          onSort={sorted.onSort}
        >
          <tbody>
            {sorted.rows.map((row) => (
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
        </ResizableTable>
      ) : null}
    </div>
  );
}
