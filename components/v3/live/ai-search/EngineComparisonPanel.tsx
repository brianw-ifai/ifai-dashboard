"use client";

import { AiReadGate, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { competitorTallies } from "@/lib/ai-search/competitors";
import {
  categoryLabel,
  engineLabel,
  engineTallies,
  isCommercial,
  isSmallSample,
  tallyCommercial,
} from "@/lib/ai-search/run-metrics";
import { pct } from "@/lib/ai-search/summary";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

function Comparison({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const engines = engineTallies(snapshot.calls);
  const largest = Math.max(0, ...engines.map((e) => e.resolved));
  const brands = competitorTallies(snapshot.calls).map((t) => t.brand);
  const categories = [...new Set(snapshot.calls.filter(isCommercial).map((r) => r.category ?? ""))].sort();

  return (
    <>
      <div className="content-box ai-engine-comparison">
        <div className="content-box-title">Commercial outcomes by engine</div>
        <p style={mutedText}>
          Engines are compared only when each has a comparable number of <AiTerm term="resolved" /> answers. An engine
          marked <AiTerm term="small sample" /> is listed with its counts and is not ranked.
        </p>
        <table className="table-sm">
          <thead>
            <tr>
              <th>Engine</th>
              <th>Fender leads</th>
              {brands.map((b) => <th key={b}>{b}</th>)}
              <th>No leader</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {engines.map((e) => {
              const small = isSmallSample(e.resolved, largest);
              const losses = snapshot.calls.filter(
                (r) => isCommercial(r) && (r.engine ?? "").toLowerCase() === e.key && r.outcome === "competitor_win",
              );
              return (
                <tr key={e.key} data-engine={e.key} data-small-sample={small ? "true" : undefined}>
                  <td>
                    <EvidenceLink focus={{ field: "engine", value: e.key }} tab={AI_TABS.simulations}>
                      {engineLabel(e.key)}
                    </EvidenceLink>
                    <div style={mutedText}>{e.models.join(", ")}</div>
                  </td>
                  <td>
                    {e.fenderWins} of {e.resolved}
                    <div style={mutedText}>{small ? "Too few to compare" : pct(e.fenderWins, e.resolved)}</div>
                  </td>
                  {brands.map((b) => (
                    <td key={b}>{losses.filter((r) => r.primary_brand === b).length}</td>
                  ))}
                  <td>{e.unresolved}</td>
                  <td>{e.errors}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">Fender leads by engine and category</div>
        <table className="table-sm">
          <thead>
            <tr>
              <th>Category</th>
              {engines.map((e) => <th key={e.key}>{engineLabel(e.key)}</th>)}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category} data-category={category}>
                <td>{categoryLabel(category)}</td>
                {engines.map((e) => {
                  const t = tallyCommercial(
                    snapshot.calls.filter(
                      (r) => r.category === category && (r.engine ?? "").toLowerCase() === e.key,
                    ),
                  );
                  return (
                    <td key={e.key}>
                      {t.resolved ? `${t.fenderWins} of ${t.resolved}` : "None resolved"}
                      {t.errors ? <div style={mutedText}>{t.errors} errors</div> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ ...mutedText, marginTop: 8 }}>
          Counts, not rates: most cells hold only a few resolved answers.
        </p>
      </div>
    </>
  );
}

export function EngineComparisonPanel() {
  return <AiReadGate>{(snapshot) => <Comparison snapshot={snapshot} />}</AiReadGate>;
}
