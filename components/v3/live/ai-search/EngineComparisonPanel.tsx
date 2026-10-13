"use client";

import { clientColumn, ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
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
  type GroupTally,
} from "@/lib/ai-search/run-metrics";
import { pct } from "@/lib/ai-search/summary";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import type { AiCallRow, AiSearchSnapshot } from "@/lib/ai-search/types";

function brandId(brand: string): string {
  return `brand:${brand}`;
}

function engineColumns(brands: string[]): RetailColumn[] {
  return [
    clientColumn("engine", "Engine", "text", 160, 110),
    clientColumn("fender", "Fender leads", "number", 140, 110),
    ...brands.map((brand) => clientColumn(brandId(brand), brand, "number", 110, 80)),
    clientColumn("unresolved", "No leader", "number", 110, 80),
    clientColumn("errors", "Errors", "number", 90, 72),
  ];
}

function engineSortValue(
  row: GroupTally,
  columnId: string,
  brandWins: (engine: string, brand: string) => number,
): SortInput {
  if (columnId === "engine") return engineLabel(row.key);
  if (columnId === "fender") return row.fenderWins;
  if (columnId === "unresolved") return row.unresolved;
  if (columnId === "errors") return row.errors;
  if (columnId.startsWith("brand:")) return brandWins(row.key, columnId.slice("brand:".length));
  return null;
}

function Comparison({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const engines = engineTallies(snapshot.calls);
  const largest = Math.max(0, ...engines.map((e) => e.resolved));
  const brands = competitorTallies(snapshot.calls).map((t) => t.brand);
  const categories = [...new Set(snapshot.calls.filter(isCommercial).map((r) => r.category ?? ""))].sort();
  const columns = engineColumns(brands);
  const categoryColumns = [
    clientColumn("category", "Category", "text", 160, 110),
    ...engines.map((engine) => clientColumn(engine.key, engineLabel(engine.key), "number", 140, 100)),
  ];
  const losses = (engine: string, brand: string) =>
    snapshot.calls.filter(
      (row) =>
        isCommercial(row) &&
        (row.engine ?? "").toLowerCase() === engine &&
        row.outcome === "competitor_win" &&
        row.primary_brand === brand,
    ).length;
  const sortedEngines = useClientTableSort(engines, columns, (row, columnId) =>
    engineSortValue(row, columnId, losses),
  );
  const sortedCategories = useClientTableSort(categories, categoryColumns, (category, columnId) => {
    if (columnId === "category") return categoryLabel(category);
    const tally = tallyCommercial(
      snapshot.calls.filter(
        (row) => row.category === category && (row.engine ?? "").toLowerCase() === columnId,
      ),
    );
    return tally.resolved ? tally.fenderWins : null;
  });

  return (
    <>
      <div className="content-box ai-engine-comparison">
        <div className="content-box-title">Commercial outcomes by engine</div>
        <p style={mutedText}>
          Engines are compared only when each has a comparable number of <AiTerm term="resolved" /> answers. An engine
          marked <AiTerm term="small sample" /> is listed with its counts and is not ranked.
        </p>
        <ResizableTable
          tableId="engine-comparison"
          columns={columns}
          freezeHeader
          maxHeight={520}
          sort={sortedEngines.sort}
          onSort={sortedEngines.onSort}
        >
          <tbody>
            {sortedEngines.rows.map((e) => {
              const small = isSmallSample(e.resolved, largest);
              const engineLosses = snapshot.calls.filter(
                (r: AiCallRow) =>
                  isCommercial(r) && (r.engine ?? "").toLowerCase() === e.key && r.outcome === "competitor_win",
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
                    <td key={b}>{engineLosses.filter((r) => r.primary_brand === b).length}</td>
                  ))}
                  <td>{e.unresolved}</td>
                  <td>{e.errors}</td>
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>

      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">Fender leads by engine and category</div>
        <ResizableTable
          tableId="engine-category"
          columns={categoryColumns}
          freezeHeader
          maxHeight={520}
          sort={sortedCategories.sort}
          onSort={sortedCategories.onSort}
        >
          <tbody>
            {sortedCategories.rows.map((category) => (
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
        </ResizableTable>
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
