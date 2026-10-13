"use client";

import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { AiReadGate, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { categoryLabel, engineLabel, formatRunTime, type GroupTally } from "@/lib/ai-search/run-metrics";
import type { SortInput } from "@/lib/fender-canvas/table-sort";

const ENGINE_COLUMNS = [
  clientColumn("engine", "Engine", "text", 140, 100),
  clientColumn("model", "Model", "text", 180, 110),
  clientColumn("lead", "Fender lead", "number", 160, 110),
  clientColumn("resolved", "Resolved", "number", 120, 90),
  clientColumn("leader", "No leader", "number", 110, 80),
  clientColumn("errors", "Errors", "number", 90, 72),
];

const CATEGORY_COLUMNS = [
  clientColumn("category", "Category", "text", 160, 110),
  clientColumn("lead", "Fender lead", "number", 160, 110),
  clientColumn("resolved", "Resolved", "number", 120, 90),
  clientColumn("leader", "No leader", "number", 110, 80),
  clientColumn("errors", "Errors", "number", 90, 72),
];

function groupSortValue(row: GroupTally, columnId: string, label: string): SortInput {
  if (columnId === "engine" || columnId === "category") return label;
  if (columnId === "model") return row.models.join(", ") || null;
  if (columnId === "lead") return row.winPct;
  if (columnId === "resolved") return row.resolved;
  if (columnId === "leader") return row.unresolved;
  return row.errors;
}
import { engineModelLine, errorLine, pct, runStateLabel, summarizeRun } from "@/lib/ai-search/summary";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

const SIM = AI_TABS.simulations;

function RunCard({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const s = summarizeRun(snapshot);
  const { run } = snapshot;
  const rowsShort = s.completeness.expected != null && s.completeness.rowsRead < s.completeness.expected;
  return (
    <div className="content-box ai-run-card">
      <div className="content-box-title">
        <span>Run completeness</span>
        <span className={`tag-badge ${s.completeness.isPartial ? "tag-warning" : "tag-success"}`}>
          {runStateLabel(s.completeness.state)}
        </span>
      </div>
      <table className="table-sm">
        <tbody>
          <tr><td>Run</td><td style={{ wordBreak: "break-all" }}>{run.audit_run_id}</td></tr>
          <tr><td>Prompt set</td><td style={{ wordBreak: "break-all" }}>{run.prompt_set_hash ?? "Not recorded"}</td></tr>
          <tr><td>Collector</td><td>{run.collector_version ?? "Not recorded"}</td></tr>
          <tr><td>Started</td><td>{formatRunTime(run.started_at)}</td></tr>
          <tr><td>Completed</td><td>{formatRunTime(run.completed_at)}</td></tr>
          <tr><td>Published</td><td>{formatRunTime(run.published_at)}</td></tr>
          <tr><td>Expected calls</td><td>{run.expected_calls ?? "Not recorded"}</td></tr>
          <tr><td>Answered calls</td><td>{run.answered_calls ?? "Not recorded"}</td></tr>
          <tr>
            <td>Provider errors</td>
            <td>
              <EvidenceLink focus={{ field: "outcome", value: "error" }} tab={SIM}>
                {errorLine(s)}
              </EvidenceLink>
            </td>
          </tr>
          <tr><td>Missing answers</td><td>{run.missing_calls ?? "Not recorded"}</td></tr>
          <tr><td>Engines and models</td><td>{engineModelLine(s.enginesAndModels)}</td></tr>
        </tbody>
      </table>
      {s.completeness.isPartial ? (
        <p style={{ ...mutedText, marginTop: 8 }}>
          This run is partial. Every figure below covers answered calls only. Unanswered calls are not losses.
        </p>
      ) : null}
      {rowsShort ? (
        <p style={{ ...mutedText, marginTop: 8, color: "var(--warning-text)" }}>
          The read returned {s.completeness.rowsRead} call rows for {s.completeness.expected} expected calls.
        </p>
      ) : null}
    </div>
  );
}

function WinCard({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const s = summarizeRun(snapshot);
  const c = s.commercial;
  return (
    <div className="content-box ai-win-card" style={{ marginTop: 12 }}>
      <div className="content-box-title">
        <span>Commercial prompts: how often Fender/Squier leads</span>
      </div>
      <div className="metric-grid-2">
        <div className="metric-card-sm">
          <span className="metric-card-label"><AiTerm term="Fender lead">Fender lead</AiTerm></span>
          <div className="metric-card-val" data-ai-win-rate>
            {pct(c.fenderWins, c.resolved)}
          </div>
          <span className="metric-card-sub">
            <EvidenceLink focus={{ field: "outcome", value: "fender_win" }} tab={SIM}>
              {c.fenderWins} Fender/Squier leads
            </EvidenceLink>{" "}
            of{" "}
            <EvidenceLink focus={{ field: "outcome", value: "resolved" }} tab={SIM}>
              {c.resolved}
            </EvidenceLink>{" "}
            <AiTerm term="resolved" /> answers
          </span>
        </div>
        <div className="metric-card-sm">
          <span className="metric-card-label">Kept out of the rate</span>
          <ul style={{ ...mutedText, margin: "4px 0 0", paddingLeft: 16 }}>
            <li>
              <EvidenceLink focus={{ field: "outcome", value: "competitor_win" }} tab={SIM}>
                {c.competitorWins} competitor leads
              </EvidenceLink>{" "}
              (in the denominator)
            </li>
            <li>
              <EvidenceLink focus={{ field: "outcome", value: "unresolved" }} tab={SIM}>
                {c.unresolved} answers
              </EvidenceLink>{" "}
              with <AiTerm term="no clear leader" />
            </li>
            <li>
              <EvidenceLink focus={{ field: "outcome", value: "error" }} tab={SIM}>
                {c.errors} commercial calls
              </EvidenceLink>{" "}
              with a <AiTerm term="provider error" />
            </li>
            <li>
              <EvidenceLink focus={{ field: "kind", value: "probe" }} tab={SIM}>
                {s.probesAnswered} answered
              </EvidenceLink>{" "}
              <AiTerm term="product fact check">product fact checks</AiTerm> (not buying prompts)
            </li>
            {c.disqualified > 0 ? (
              <li>
                {c.disqualified} Fender leads with a <AiTerm term="confirmed contradiction" />, not counted as wins
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EngineTable({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const s = summarizeRun(snapshot);
  const small = new Set(s.smallSampleEngines);
  const sorted = useClientTableSort(s.engines, ENGINE_COLUMNS, (row, columnId) =>
    groupSortValue(row, columnId, engineLabel(row.key)),
  );
  return (
    <div className="content-box ai-engine-table" style={{ marginTop: 12 }}>
      <div className="content-box-title">By engine and model</div>
      <ResizableTable
        tableId="ai-run-engines"
        columns={ENGINE_COLUMNS}
        freezeHeader
        maxHeight={520}
        sort={sorted.sort}
        onSort={sorted.onSort}
      >
        <tbody>
          {sorted.rows.map((engine) => (
            <tr key={engine.key} data-engine={engine.key}>
              <td>
                <EvidenceLink focus={{ field: "engine", value: engine.key }} tab={SIM}>
                  {engineLabel(engine.key)}
                </EvidenceLink>
              </td>
              <td>{engine.models.join(", ")}</td>
              <td>
                {small.has(engine.key) ? (
                  <span data-small-sample>
                    {engine.fenderWins} of {engine.resolved},{" "}
                    <AiTerm term="small sample">too few to compare</AiTerm>
                  </span>
                ) : (
                  `${pct(engine.fenderWins, engine.resolved)} (${engine.fenderWins} of ${engine.resolved})`
                )}
              </td>
              <td>{engine.resolved} of {engine.calls}</td>
              <td>{engine.unresolved}</td>
              <td>{engine.errors}</td>
            </tr>
          ))}
        </tbody>
      </ResizableTable>
    </div>
  );
}

function CategoryTable({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const s = summarizeRun(snapshot);
  const sorted = useClientTableSort(s.categories, CATEGORY_COLUMNS, (row, columnId) =>
    groupSortValue(row, columnId, categoryLabel(row.key)),
  );
  return (
    <div className="content-box ai-category-table" style={{ marginTop: 12 }}>
      <div className="content-box-title">By commercial category</div>
      <ResizableTable
        tableId="ai-run-categories"
        columns={CATEGORY_COLUMNS}
        freezeHeader
        maxHeight={520}
        sort={sorted.sort}
        onSort={sorted.onSort}
      >
        <tbody>
          {sorted.rows.map((row) => (
            <tr key={row.key} data-category={row.key}>
              <td>
                <EvidenceLink focus={{ field: "category", value: row.key }} tab={SIM}>
                  {categoryLabel(row.key)}
                </EvidenceLink>
              </td>
              <td>{row.resolved ? `${pct(row.fenderWins, row.resolved)} (${row.fenderWins} of ${row.resolved})` : "No resolved answers"}</td>
              <td>{row.resolved} of {row.calls}</td>
              <td>{row.unresolved}</td>
              <td>{row.errors}</td>
            </tr>
          ))}
        </tbody>
      </ResizableTable>
      <p style={{ ...mutedText, marginTop: 8 }}>
        Product fact checks are not a shopping category. They are on the Product Fact Checks tab.
      </p>
    </div>
  );
}

export function RunSummaryPanel() {
  return (
    <AiReadGate>
      {(snapshot) => (
        <>
          <WinCard snapshot={snapshot} />
          <EngineTable snapshot={snapshot} />
          <CategoryTable snapshot={snapshot} />
          <div style={{ marginTop: 12 }}>
            <RunCard snapshot={snapshot} />
          </div>
        </>
      )}
    </AiReadGate>
  );
}
