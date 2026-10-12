"use client";

import { Fragment, useMemo, useState } from "react";
import { AiReadGate, EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { SimulationEvidenceDrawer } from "@/components/v3/live/ai-search/SimulationEvidenceDrawer";
import { SimulationFilters } from "@/components/v3/live/ai-search/SimulationFilters";
import { useEvidenceFocus } from "@/components/v3/live/ai-search/useEvidenceFocus";
import { citationEvidence, type CitationEvidence } from "@/lib/ai-search/citations";
import { driftRead } from "@/lib/ai-search/drift";
import { setEvidenceFocus } from "@/lib/ai-search/evidence-focus";
import {
  ACCURACY_LABELS,
  accuracyState,
  applyExplorerFilter,
  filterFromEvidence,
  sortExplorerRows,
  type ExplorerFilter,
} from "@/lib/ai-search/explorer-filter";
import {
  callOutcome,
  categoryLabel,
  cleanPrompt,
  engineLabel,
  formatRunTime,
  modelLabel,
  OUTCOME_LABELS,
  type CallOutcome,
} from "@/lib/ai-search/run-metrics";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

const OUTCOME_TONE: Record<CallOutcome, string> = {
  fender_win: "tag-success",
  fender_win_disqualified: "tag-danger",
  competitor_win: "tag-danger",
  unresolved: "tag-neutral",
  error: "tag-warning",
  probe: "tag-neutral",
  unsupported: "tag-neutral",
};

function Explorer({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const focus = useEvidenceFocus();
  const [filter, setFilter] = useState<ExplorerFilter>(() => filterFromEvidence(focus));
  const [openId, setOpenId] = useState<string | null>(() => {
    const simId = filterFromEvidence(focus).simId;
    return simId != null ? (snapshot.calls.find((call) => call.sim_id === simId)?.id ?? null) : null;
  });

  const [appliedFocus, setAppliedFocus] = useState(focus);
  if (focus !== appliedFocus) {
    setAppliedFocus(focus);
    if (focus) {
      const next = filterFromEvidence(focus);
      setFilter(next);
      setOpenId(next.simId != null ? (snapshot.calls.find((call) => call.sim_id === next.simId)?.id ?? null) : null);
    }
  }

  const citations = useMemo(() => {
    const byCall = new Map<string, CitationEvidence[]>();
    for (const row of citationEvidence(snapshot.calls, snapshot.citations, "all").rows) {
      byCall.set(row.simulationId, [...(byCall.get(row.simulationId) ?? []), row]);
    }
    return byCall;
  }, [snapshot]);

  const drift = useMemo(() => driftRead(snapshot.calls, snapshot.probes), [snapshot]);

  const rows = useMemo(
    () => sortExplorerRows(applyExplorerFilter(snapshot.calls, filter)),
    [snapshot.calls, filter],
  );

  const changeFilter = (next: ExplorerFilter) => {
    setOpenId(null);
    setFilter(next);
    if (focus) setEvidenceFocus(null);
  };

  return (
    <div className="content-box ai-simulations">
      <div className="content-box-title">
        <span>Simulations in the published run</span>
        <span className="tag-badge tag-neutral" data-ai-row-count>
          {rows.length} of {snapshot.calls.length} calls
        </span>
      </div>
      <p style={mutedText}>
        Shopping prompts are buying questions, scored by which brand the answer names most. A{" "}
        <AiTerm term="product fact check">product fact check</AiTerm> tests one published Fender fact instead, so it is
        never scored as a win. A <AiTerm term="provider error" /> or an answer with <AiTerm term="no clear leader" /> is
        neither a win nor a loss.
      </p>
      <SimulationFilters rows={snapshot.calls} filter={filter} onChange={changeFilter} />
      {filter.brand ? (
        <p style={mutedText}>
          Showing answers where {filter.brand} was named most.{" "}
          <button type="button" className="segmented-btn" onClick={() => changeFilter({ ...filter, brand: "" })}>
            Clear brand
          </button>
        </p>
      ) : null}
      {rows.length === 0 ? <EmptyRows>No call in this run matches these filters.</EmptyRows> : null}
      <div id="ai-simulation-list" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((row) => {
          const outcome = callOutcome(row);
          const open = openId === row.id;
          const cited = citations.get(row.id) ?? [];
          return (
            <Fragment key={row.id}>
              <button
                type="button"
                className="action-card ai-sim-row"
                data-sim-id={row.sim_id}
                data-outcome={outcome}
                data-kind={row.prompt_kind ?? ""}
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : row.id)}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="action-head" style={{ gap: 8 }}>
                  <span data-ai-prompt>{cleanPrompt(row.prompt)}</span>
                  <span className={`tag-badge ${OUTCOME_TONE[outcome]}`}>
                    {outcome === "competitor_win" && row.primary_brand ? `${row.primary_brand} named most` : OUTCOME_LABELS[outcome]}
                  </span>
                </div>
                <div className="action-details" style={{ fontSize: 11 }}>
                  {engineLabel(row.engine)} · {modelLabel(row.model)} ·{" "}
                  {row.prompt_kind === "probe" ? "Product fact check" : categoryLabel(row.category)} ·{" "}
                  {ACCURACY_LABELS[accuracyState(row)]} · {cited.length} cited links · checked {formatRunTime(row.created_at)}
                </div>
              </button>
              {open ? (
                <SimulationEvidenceDrawer
                  row={row}
                  probe={drift.probes.find((p) => p.simId === row.sim_id) ?? null}
                  citations={cited}
                  questionsSent={drift.coverage.questionsSent}
                  onClose={() => setOpenId(null)}
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function SimulationsExplorer() {
  return <AiReadGate>{(snapshot) => <Explorer snapshot={snapshot} />}</AiReadGate>;
}
