"use client";

import { AiReadGate, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { AI_TABS, RADAR_TABS } from "@/lib/ai-search/canvas-surfaces";
import { categoryBattles } from "@/lib/ai-search/competitors";
import { categoryLabel, isSmallSample, tallyCommercial } from "@/lib/ai-search/run-metrics";
import { pct } from "@/lib/ai-search/summary";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

function Battlecards({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const battles = categoryBattles(snapshot.calls);
  const total = tallyCommercial(snapshot.calls);
  const largest = Math.max(0, ...battles.map((b) => b.resolved));

  return (
    <>
      <div className="ceo-callout">
        <div className="ceo-callout-header">
          <span>Who out-mentions Fender/Squier in AI buying answers?</span>
        </div>
        <div className="ceo-callout-body">
          Each row is one product category of commercial buying prompts in the published run. A{" "}
          <AiTerm term="Fender lead" /> means Fender or Squier was named more than any other brand. Squier counts with
          Fender because it is Fender&apos;s entry-level line against Yamaha and Ibanez. Fact-check probes, provider
          errors, and answers with no clear leader are not in these shares.
        </div>
      </div>

      <div className="content-box ai-battlecards" style={{ marginTop: 12 }}>
        <div className="content-box-title">Category battlecards</div>
        <table className="table-sm">
          <thead>
            <tr>
              <th>Category</th>
              <th>Fender win share</th>
              <th>Top competitor</th>
              <th>Competitor leads</th>
              <th>No leader</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {battles.map((b) => {
              const top = b.leaders[0];
              return (
                <tr key={b.category} data-category={b.category}>
                  <td>
                    <EvidenceLink focus={{ field: "category", value: b.category }} tab={AI_TABS.simulations}>
                      {categoryLabel(b.category)}
                    </EvidenceLink>
                  </td>
                  <td>
                    {b.resolved ? `${pct(b.fenderWins, b.resolved)} (${b.fenderWins} of ${b.resolved})` : "No resolved answers"}
                    {b.resolved && isSmallSample(b.resolved, largest) ? (
                      <div style={mutedText}><AiTerm term="small sample" /></div>
                    ) : null}
                  </td>
                  <td>
                    {top ? (
                      <EvidenceLink focus={{ field: "competitor", value: top.brand }} spokeId="competitors" tab={RADAR_TABS.wins}>
                        {`${top.brand} (${top.wins})`}
                      </EvidenceLink>
                    ) : (
                      "None"
                    )}
                  </td>
                  <td>{b.competitorWins} of {b.resolved}</td>
                  <td>{b.unresolved}</td>
                  <td>{b.errors}</td>
                </tr>
              );
            })}
            <tr data-category="all">
              <td><strong>All commercial prompts</strong></td>
              <td><strong>{pct(total.fenderWins, total.resolved)} ({total.fenderWins} of {total.resolved})</strong></td>
              <td>
                <EvidenceLink focus={{ field: "outcome", value: "competitor_win" }} spokeId="competitors" tab={RADAR_TABS.wins}>
                  All competitors
                </EvidenceLink>
              </td>
              <td>{total.competitorWins} of {total.resolved}</td>
              <td>{total.unresolved}</td>
              <td>{total.errors}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CategoryBattlecardsPanel() {
  return <AiReadGate>{(snapshot) => <Battlecards snapshot={snapshot} />}</AiReadGate>;
}
