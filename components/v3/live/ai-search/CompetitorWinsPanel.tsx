"use client";

import { useMemo, useState } from "react";
import { AiReadGate, EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { useEvidenceFocus } from "@/components/v3/live/ai-search/useEvidenceFocus";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { citationEvidence, groupCitations } from "@/lib/ai-search/citations";
import { competitorTallies } from "@/lib/ai-search/competitors";
import { callOutcome, categoryLabel, cleanPrompt, engineLabel, modelLabel } from "@/lib/ai-search/run-metrics";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

function Wins({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const focus = useEvidenceFocus();
  const [brand, setBrand] = useState(focus?.field === "competitor" ? focus.value : "");

  const [appliedFocus, setAppliedFocus] = useState(focus);
  if (focus !== appliedFocus) {
    setAppliedFocus(focus);
    if (focus?.field === "competitor") setBrand(focus.value);
    if (focus?.field === "outcome" && focus.value === "competitor_win") setBrand("");
  }

  const tallies = competitorTallies(snapshot.calls);
  const losses = useMemo(
    () =>
      snapshot.calls
        .filter((row) => callOutcome(row) === "competitor_win")
        .sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "") || a.sim_id - b.sim_id),
    [snapshot.calls],
  );
  const cited = useMemo(
    () => citationEvidence(snapshot.calls, snapshot.citations, "commercial").rows,
    [snapshot],
  );
  const shown = brand ? losses.filter((row) => row.primary_brand === brand) : losses;

  if (losses.length === 0) {
    return (
      <div className="content-box">
        <EmptyRows>No competitor was named most in a resolved commercial answer in this run.</EmptyRows>
      </div>
    );
  }

  return (
    <>
      <div className="content-box ai-competitor-tallies">
        <div className="content-box-title">Competitors named more than Fender/Squier</div>
        <table className="table-sm">
          <thead><tr><th>Competitor</th><th>Leads</th><th>Categories</th><th>Engines</th></tr></thead>
          <tbody>
            {tallies.map((t) => (
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
                <td>{t.wins} of {t.resolved} resolved</td>
                <td>{t.byCategory.map((c) => `${categoryLabel(c.category)} ${c.wins} of ${c.resolved}`).join(", ")}</td>
                <td>{t.byEngine.map((e) => `${engineLabel(e.engine)} ${e.wins} of ${e.resolved}`).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <EvidenceLink focus={{ field: "sim", value: String(row.sim_id) }} tab={AI_TABS.simulations}>
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
