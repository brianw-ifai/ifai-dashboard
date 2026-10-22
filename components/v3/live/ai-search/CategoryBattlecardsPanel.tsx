"use client";

import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { AiReadGate } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { KeptOutNote, RoleCount, RoleSumLine, largestResolved, roleColumn, roleRateSort } from "@/components/v3/live/ai-search/RoleRateTable";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import {
  categoryRoleTallies,
  headlineAside,
  headlineCompetitorWins,
  type RoleGroupTally,
} from "@/lib/ai-search/question-role";
import { categoryLabel } from "@/lib/ai-search/run-metrics";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";
import { hasMixedScoringMethods, isWindowHistoryKind, MIXED_SCORING_NOTE } from "@/lib/ai-search/window-display";

const COLUMNS = [
  clientColumn("category", "Category", "text", 160, 110),
  roleColumn("unbranded_discovery"),
  roleColumn("branded_consideration"),
  clientColumn("competitor", "Top competitor", "text", 170, 120),
  clientColumn("leads", "Competitor leads", "number", 150, 110),
  clientColumn("leader", "No leader", "number", 110, 80),
  clientColumn("errors", "Errors", "number", 90, 72),
];

function battleSortValue(
  row: RoleGroupTally,
  columnId: string,
  top: { brand: string; wins: number } | undefined,
  largest: { unbranded: number; branded: number },
): SortInput {
  const aside = headlineAside(row);
  if (columnId === "category") return categoryLabel(row.key);
  if (columnId === "unbranded_discovery") return roleRateSort(row.roles.unbranded_discovery, largest.unbranded);
  if (columnId === "branded_consideration") return roleRateSort(row.roles.branded_consideration, largest.branded);
  if (columnId === "competitor") return top ? `${top.brand} (${top.wins})` : "None";
  if (columnId === "leads") return aside.competitorWins;
  if (columnId === "leader") return aside.unresolved;
  return aside.errors;
}

function Battlecards({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const history = useAiHistoryOptional();
  const showSmallSample = !isWindowHistoryKind(history?.mode.kind);
  const mixed = hasMixedScoringMethods(snapshot);
  const battles = [...categoryRoleTallies(snapshot.calls)].sort((a, b) => {
    const wins = (row: RoleGroupTally) => headlineAside(row).competitorWins;
    return wins(b) - wins(a) || a.key.localeCompare(b.key);
  });
  const largest = {
    unbranded: largestResolved(battles, "unbranded_discovery"),
    branded: largestResolved(battles, "branded_consideration"),
  };
  const leadersFor = (category: string) =>
    headlineCompetitorWins(snapshot.calls.filter((row) => (row.category ?? "") === category));
  const sorted = useClientTableSort(battles, COLUMNS, (row, columnId) =>
    battleSortValue(row, columnId, leadersFor(row.key)[0], largest),
  );

  return (
    <div className="ai-role-rates">
      <div className="ceo-callout">
        <div className="ceo-callout-header">
          <span>Who out-mentions Fender/Squier in AI buying answers?</span>
        </div>
        <div className="ceo-callout-body">
          Each category shows two Fender-lead rates, <AiTerm term="unbranded discovery">unbranded discovery</AiTerm> and{" "}
          <AiTerm term="branded consideration">branded consideration</AiTerm>. A <AiTerm term="Fender lead" /> means
          Fender or Squier was named more than any other brand. Squier counts with Fender because it is Fender&apos;s
          entry-level line against Yamaha and Ibanez. The top competitor and Competitor leads columns use unbranded
          discovery only.
        </div>
      </div>

      <div className="content-box ai-battlecards" style={{ marginTop: 12 }}>
        <div className="content-box-title">Category battlecards</div>
        <RoleSumLine groups={battles} preface="Fender/Squier leads, by the kind of question." />
        {mixed ? (
          <p className="ai-role-footnote" data-ai-mixed-scoring>
            {MIXED_SCORING_NOTE}
          </p>
        ) : null}
        <ResizableTable
          tableId="category-battlecards"
          columns={COLUMNS}
          freezeHeader
          maxHeight={520}
          sort={sorted.sort}
          onSort={sorted.onSort}
        >
          <tbody>
            {sorted.rows.map((battle) => {
              const top = leadersFor(battle.key)[0];
              const aside = headlineAside(battle);
              return (
                <tr key={battle.key} data-category={battle.key}>
                  <td>
                    <EvidenceLink focus={{ field: "category", value: battle.key }} tab={AI_TABS.simulations}>
                      {categoryLabel(battle.key)}
                    </EvidenceLink>
                  </td>
                  <td>
                    <RoleCount
                      role="unbranded_discovery"
                      tally={battle.roles.unbranded_discovery}
                      largestResolved={largest.unbranded}
                      showSmallSample={showSmallSample}
                    />
                  </td>
                  <td>
                    <RoleCount
                      role="branded_consideration"
                      tally={battle.roles.branded_consideration}
                      largestResolved={largest.branded}
                      showSmallSample={showSmallSample}
                    />
                  </td>
                  <td>{top ? `${top.brand} (${top.wins})` : "None"}</td>
                  <td>{aside.competitorWins}</td>
                  <td>{aside.unresolved}</td>
                  <td>{aside.errors}</td>
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
        <p className="ai-role-footnote">
          Competitor leads count wins inside <AiTerm term="unbranded discovery">unbranded discovery</AiTerm> only.
          Branded consideration stays in its Fender-lead column and is not part of this rate. A competitor win on a
          question kept out below does not appear in these columns.
        </p>
        <KeptOutNote snapshot={snapshot} />
      </div>
    </div>
  );
}

export function CategoryBattlecardsPanel() {
  return <AiReadGate>{(snapshot) => <Battlecards snapshot={snapshot} />}</AiReadGate>;
}
