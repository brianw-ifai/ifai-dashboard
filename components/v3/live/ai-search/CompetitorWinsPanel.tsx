"use client";

import { useMemo, useState } from "react";
import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { AiReadGate, EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { useEvidenceFocus } from "@/components/v3/live/ai-search/useEvidenceFocus";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { citationEvidence, groupCitations } from "@/lib/ai-search/citations";
import { competitorTallies, isUnbrandedDiscovery, type CompetitorTally } from "@/lib/ai-search/competitors";
import { callOutcome, categoryLabel, cleanPrompt, engineLabel, modelLabel } from "@/lib/ai-search/run-metrics";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";
import { hasMixedScoringMethods, isWindowHistoryKind, MIXED_SCORING_NOTE } from "@/lib/ai-search/window-display";

const COLUMNS = [
  clientColumn("competitor", "Competitor", "text", 160, 110),
  clientColumn("leads", "Leads", "number", 140, 100),
  clientColumn("categories", "Categories", "text", 280, 140),
  clientColumn("engines", "Engines", "text", 240, 120),
];

function tallySortValue(row: CompetitorTally, columnId: string): SortInput {
  if (columnId === "competitor") return row.brand;
  if (columnId === "leads") return row.wins;
  if (columnId === "categories") {
    return row.byCategory.map((c) => `${categoryLabel(c.category)} ${c.wins} of ${c.resolved}`).join(", ") || null;
  }
  return row.byEngine.map((e) => `${engineLabel(e.engine)} ${e.wins} of ${e.resolved}`).join(", ") || null;
}

function Wins({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const history = useAiHistoryOptional();
  const windowed = isWindowHistoryKind(history?.mode.kind);
  const mixed = hasMixedScoringMethods(snapshot);
  const focus = useEvidenceFocus();
  const [brand, setBrand] = useState(focus?.field === "competitor" ? focus.value : "");

  const [appliedFocus, setAppliedFocus] = useState(focus);
  if (focus !== appliedFocus) {
    setAppliedFocus(focus);
    if (focus?.field === "competitor") setBrand(focus.value);
    if (focus?.field === "outcome" && focus.value === "competitor_win") setBrand("");
  }

  const tallies = competitorTallies(snapshot.calls);
  const sorted = useClientTableSort(tallies, COLUMNS, tallySortValue);
  const losses = useMemo(
    () =>
      snapshot.calls
        .filter((row) => isUnbrandedDiscovery(row) && callOutcome(row) === "competitor_win")
        .sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "") || a.sim_id - b.sim_id),
    [snapshot.calls],
  );
  const cited = useMemo(
    () => citationEvidence(snapshot.calls, snapshot.citations, "commercial").rows,
    [snapshot],
  );
  const shown = brand ? losses.filter((row) => row.primary_brand === brand) : losses;
  const emptyUnit = windowed ? "selection" : "run";

  if (losses.length === 0) {
    return (
      <div className="content-box">
        <EmptyRows>
          No competitor was named most in a resolved <AiTerm term="unbranded discovery">unbranded discovery</AiTerm>{" "}
          answer in this {emptyUnit}.
        </EmptyRows>
      </div>
    );
  }

  return (
    <>
      <div className="content-box ai-competitor-tallies">
        <div className="content-box-title">Competitors named more than Fender/Squier</div>
        <p style={mutedText}>
          Each lead is a win of that many resolved <AiTerm term="unbranded discovery">unbranded discovery</AiTerm>{" "}
          answers. Branded consideration is not in this rate.
        </p>
        {mixed ? (
          <p style={mutedText} data-ai-mixed-scoring>
            {MIXED_SCORING_NOTE}
          </p>
        ) : null}
        <ResizableTable
          tableId="competitor-wins"
          columns={COLUMNS}
          freezeHeader
          maxHeight={520}
          sort={sorted.sort}
          onSort={sorted.onSort}
        >
          <tbody>
            {sorted.rows.map((t) => (
              <tr key={t.brand} data-competitor={t.brand}>
                <td>
                  <button
                    type="button"
                    className={`segmented-btn${brand === t.brand ? " active" : ""}`}
                    aria-pressed={brand === t.brand}
                    onClick={() => setBrand(brand === t.brand ? "" : t.brand)}
                  >
                    {t.brand}
                  </button>
                </td>
                <td>
                  {t.wins} of {t.resolved} resolved
                </td>
                <td>{t.byCategory.map((c) => `${categoryLabel(c.category)} ${c.wins} of ${c.resolved}`).join(", ")}</td>
                <td>{t.byEngine.map((e) => `${engineLabel(e.engine)} ${e.wins} of ${e.resolved}`).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </ResizableTable>
      </div>

      <div className="content-box ai-competitor-answers" style={{ marginTop: 12 }}>
        <div className="content-box-title">
          <span>{brand ? `Answers where ${brand} led` : "Every answer a competitor led"}</span>
          <span className="tag-badge tag-neutral">{shown.length} answers</span>
        </div>
        <p style={mutedText}>
          The stored evidence for each loss is the prompt, the engine and model, the brand named most, and the pages
          the answer cited. Open a prompt to read the full answer.
        </p>
        {shown.map((row) => {
          const domains = groupCitations(cited.filter((c) => c.simulationId === row.id), (c) => c.domain);
          return (
            <div key={row.id} className="action-card" data-sim-id={row.sim_id} style={{ marginTop: 6 }}>
              <div className="action-head">
                <EvidenceLink focus={{ field: "sim", value: row.id }} tab={AI_TABS.simulations}>
                  {cleanPrompt(row.prompt)}
                </EvidenceLink>
                <span className="tag-badge tag-danger">{row.primary_brand} named most</span>
              </div>
              <div className="action-details" style={{ fontSize: 11 }}>
                {categoryLabel(row.category)} · {engineLabel(row.engine)} · {modelLabel(row.model)} ·{" "}
                {domains.length ? `cited ${domains.map((d) => d.key).join(", ")}` : "no valid cited page"}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function CompetitorWinsPanel() {
  return <AiReadGate>{(snapshot) => <Wins snapshot={snapshot} />}</AiReadGate>;
}
