"use client";

import { useMemo, useState, type ReactNode } from "react";
import { clientColumn, ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { AiReadGate, EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { CitationEvidenceTable } from "@/components/v3/live/ai-search/CitationEvidenceTable";
import {
  CitationInterpretationNote,
  CitationRoleNote,
} from "@/components/v3/live/ai-search/CitationRoleNote";
import { useEvidenceFocus } from "@/components/v3/live/ai-search/useEvidenceFocus";
import {
  citationEvidence,
  citedAnswers,
  groupCitations,
  SOURCE_CLASS_LABELS,
  type CitationEvidence,
  type CitationScope,
  type SourceClass,
} from "@/lib/ai-search/citations";
import { categoryLabel, engineLabel } from "@/lib/ai-search/run-metrics";
import { pct } from "@/lib/ai-search/summary";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

function CountTable<T>({
  tableId,
  columns,
  rows,
  value,
  renderRow,
}: {
  tableId: string;
  columns: readonly RetailColumn[];
  rows: readonly T[];
  value: (row: T, columnId: string) => SortInput;
  renderRow: (row: T) => ReactNode;
}) {
  const sorted = useClientTableSort(rows, columns, value);
  return (
    <ResizableTable
      tableId={tableId}
      columns={columns}
      freezeHeader
      maxHeight={520}
      sort={sorted.sort}
      onSort={sorted.onSort}
    >
      <tbody>{sorted.rows.map((row) => renderRow(row))}</tbody>
    </ResizableTable>
  );
}

const CLASS_COLUMNS = [
  clientColumn("class", "Class", "text", 180, 110),
  clientColumn("links", "Links", "number", 90, 72),
  clientColumn("share", "Share", "number", 90, 72),
  clientColumn("answers", "Answers", "number", 100, 80),
];

const DOMAIN_COLUMNS = [
  clientColumn("domain", "Domain", "text", 200, 120),
  clientColumn("class", "Class", "text", 140, 100),
  clientColumn("links", "Links", "number", 90, 72),
  clientColumn("answers", "Answers", "number", 100, 80),
];

const ENGINE_COLUMNS = [
  clientColumn("engine", "Engine", "text", 140, 100),
  clientColumn("cited", "Cited answers", "number", 140, 110),
  clientColumn("links", "Links", "number", 90, 72),
  clientColumn("owned", "Fender-owned", "number", 130, 100),
];

const CATEGORY_COLUMNS = [
  clientColumn("category", "Category", "text", 180, 120),
  clientColumn("cited", "Cited answers", "number", 140, 110),
  clientColumn("links", "Links", "number", 90, 72),
  clientColumn("owned", "Fender-owned", "number", 130, 100),
];

type CitationPick = { field: "domain" | "class" | "engine" | "category"; value: string } | null;

const SCOPES: Array<[CitationScope, string]> = [
  ["commercial", "Shopping answers"],
  ["probe", "Product fact checks"],
  ["all", "All answers"],
];

function matches(row: CitationEvidence, pick: CitationPick) {
  if (!pick) return true;
  if (pick.field === "domain") return row.domain === pick.value;
  if (pick.field === "class") return row.sourceClass === pick.value;
  if (pick.field === "engine") return row.engine === pick.value;
  return row.category === pick.value;
}

function PickButton({ pick, onPick, children }: { pick: NonNullable<CitationPick>; onPick: (p: CitationPick) => void; children: string }) {
  return (
    <button
      type="button"
      className="ifai-evidence-link"
      data-ai-pick={`${pick.field}:${pick.value}`}
      onClick={() => onPick(pick)}
      style={{ background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 600, color: "var(--text-main)", textDecoration: "underline", cursor: "pointer", textAlign: "left" }}
    >
      {children}
    </button>
  );
}

function Ecosystem({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const focus = useEvidenceFocus();
  const [scope, setScope] = useState<CitationScope>("commercial");
  const [pick, setPick] = useState<CitationPick>(() =>
    focus?.field === "domain" || focus?.field === "class" ? { field: focus.field, value: focus.value } : null,
  );

  const [appliedFocus, setAppliedFocus] = useState(focus);
  if (focus !== appliedFocus) {
    setAppliedFocus(focus);
    if (focus?.field === "domain" || focus?.field === "class") setPick({ field: focus.field, value: focus.value });
  }

  const read = useMemo(() => citationEvidence(snapshot.calls, snapshot.citations, scope), [snapshot, scope]);
  const fender = read.rows.filter((row) => row.sourceClass === "fender_owned");
  const fenderAnswers = new Set(fender.map((row) => row.simulationId)).size;
  const domains = groupCitations(read.rows, (row) => row.domain);
  const classes = groupCitations(read.rows, (row) => row.sourceClass);
  const byEngine = citedAnswers(snapshot.calls, read.rows, scope, (call) => (call.engine ?? "").toLowerCase());
  const engineLinks = new Map(groupCitations(read.rows, (row) => row.engine).map((g) => [g.key, g]));
  const byCategory = citedAnswers(snapshot.calls, read.rows, scope, (call) => call.category ?? "");
  const categoryLinks = new Map(groupCitations(read.rows, (row) => row.category).map((g) => [g.key, g]));
  const scopeNoun = scope === "probe" ? "fact-check answers" : scope === "all" ? "answers" : "shopping answers";
  const filtered = read.rows.filter((row) => matches(row, pick));
  const pickLabel = !pick
    ? "every cited link"
    : pick.field === "class"
      ? SOURCE_CLASS_LABELS[pick.value as SourceClass]
      : pick.field === "engine"
        ? engineLabel(pick.value)
        : pick.field === "category"
          ? categoryLabel(pick.value)
          : pick.value;

  return (
    <>
      <div className="content-box ai-citation-summary">
        <div className="content-box-title">
          <span>Which web sources AI answers cite</span>
          <div role="group" aria-label="Citation scope" style={{ display: "flex", gap: 4 }}>
            {SCOPES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`segmented-btn${scope === value ? " active" : ""}`}
                aria-pressed={scope === value}
                onClick={() => {
                  setScope(value);
                  setPick(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 6px" }} data-ai-cited-answers>
          {read.answersWithCitation} of {read.answered} {scopeNoun} cited web sources ({pct(read.answersWithCitation, read.answered)}).
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 6px" }} data-ai-cited-links>
          Those answers contained {read.rows.length} <AiTerm term="cited link">cited links</AiTerm> across{" "}
          {domains.length} domains.{" "}
          <span data-ai-fender-owned>
            {fender.length} links, or {pct(fender.length, read.rows.length)}, led to{" "}
            <AiTerm term="Fender-owned">Fender-owned</AiTerm> sites.
          </span>
        </p>
        <ul style={{ ...mutedText, paddingLeft: 16, margin: 0 }}>
          <li>
            Answers and links are separate counts. {read.answersWithCitation} {scopeNoun} produced{" "}
            {read.rows.length} links, so one answer can cite several pages.
          </li>
          <li>
            Fender-owned links appear in {fenderAnswers} of those answers. The other{" "}
            {read.rows.length - fender.length} links point to sites Fender does not control.
          </li>
          {read.duplicates + read.invalid > 0 ? (
            <li>
              {read.stored} stored rows in this view. Left out:{" "}
              {read.duplicates > 0 ? (
                <>
                  {read.duplicates} that repeat the same <AiTerm term="canonical URL" /> inside one answer
                </>
              ) : null}
              {read.duplicates > 0 && read.invalid > 0 ? ", and " : null}
              {read.invalid > 0 ? `${read.invalid} with no usable address` : null}.
            </li>
          ) : null}
        </ul>
        <p style={{ ...mutedText, marginTop: 8 }}>
          A cited link appears alongside an answer. This read does not measure whether the page caused the
          recommendation, and a citation is not an endorsement of Fender by that source.
        </p>
      </div>

      <CitationRoleNote />

      {read.rows.length === 0 ? (
        <div className="content-box" style={{ marginTop: 12 }}>
          <EmptyRows>No answer in this view returned a cited link.</EmptyRows>
        </div>
      ) : (
        <>
          <div className="content-box" style={{ marginTop: 12 }}>
            <div className="content-box-title">
              <span>
                By <AiTerm term="source class" />
              </span>
            </div>
            <CitationInterpretationNote partial={snapshot.run.run_state === "partial"} />
            <CountTable
              tableId="citation-classes"
              columns={CLASS_COLUMNS}
              rows={classes}
              value={(g, id) => {
                if (id === "class") return SOURCE_CLASS_LABELS[g.key as SourceClass];
                if (id === "links") return g.rows;
                if (id === "share") return read.rows.length ? g.rows / read.rows.length : null;
                return g.answers;
              }}
              renderRow={(g) => (
                <tr key={g.key} data-source-class={g.key}>
                  <td><PickButton pick={{ field: "class", value: g.key }} onPick={setPick}>{SOURCE_CLASS_LABELS[g.key as SourceClass]}</PickButton></td>
                  <td>{g.rows}</td>
                  <td>{pct(g.rows, read.rows.length)}</td>
                  <td>{g.answers}</td>
                </tr>
              )}
            />
          </div>

          <div className="content-box ai-top-domains" style={{ marginTop: 12 }}>
            <div className="content-box-title">Top domains</div>
            <CountTable
              tableId="citation-domains"
              columns={DOMAIN_COLUMNS}
              rows={domains.slice(0, 15)}
              value={(g, id) => {
                if (id === "domain") return g.key;
                if (id === "class") return SOURCE_CLASS_LABELS[read.rows.find((r) => r.domain === g.key)?.sourceClass ?? "other"];
                if (id === "links") return g.rows;
                return g.answers;
              }}
              renderRow={(g) => (
                <tr key={g.key} data-domain={g.key}>
                  <td style={{ wordBreak: "break-all" }}><PickButton pick={{ field: "domain", value: g.key }} onPick={setPick}>{g.key}</PickButton></td>
                  <td>{SOURCE_CLASS_LABELS[read.rows.find((r) => r.domain === g.key)?.sourceClass ?? "other"]}</td>
                  <td>{g.rows}</td>
                  <td>{g.answers}</td>
                </tr>
              )}
            />
            {domains.length > 15 ? <p style={mutedText}>{domains.length - 15} more domains are in the cited pages table below.</p> : null}
          </div>

          <div className="content-box" style={{ marginTop: 12 }}>
            <div className="content-box-title">By engine and category</div>
            <CountTable
              tableId="citation-engines"
              columns={ENGINE_COLUMNS}
              rows={byEngine}
              value={(g, id) => {
                if (id === "engine") return engineLabel(g.key);
                if (id === "cited") return g.cited;
                if (id === "links") return engineLinks.get(g.key)?.rows ?? 0;
                return engineLinks.get(g.key)?.fenderOwnedRows ?? 0;
              }}
              renderRow={(g) => (
                <tr key={g.key} data-engine={g.key}>
                  <td><PickButton pick={{ field: "engine", value: g.key }} onPick={setPick}>{engineLabel(g.key)}</PickButton></td>
                  <td>{g.cited} of {g.answered}</td>
                  <td>{engineLinks.get(g.key)?.rows ?? 0}</td>
                  <td>{engineLinks.get(g.key)?.fenderOwnedRows ?? 0}</td>
                </tr>
              )}
            />
            {scope !== "probe" ? (
              <CountTable
                tableId="citation-categories"
                columns={CATEGORY_COLUMNS}
                rows={byCategory}
                value={(g, id) => {
                  if (id === "category") return g.key === "hallucinations" ? "Product fact checks" : categoryLabel(g.key);
                  if (id === "cited") return g.cited;
                  if (id === "links") return categoryLinks.get(g.key)?.rows ?? 0;
                  return categoryLinks.get(g.key)?.fenderOwnedRows ?? 0;
                }}
                renderRow={(g) => (
                  <tr key={g.key} data-category={g.key}>
                    <td><PickButton pick={{ field: "category", value: g.key }} onPick={setPick}>{g.key === "hallucinations" ? "Product fact checks" : categoryLabel(g.key)}</PickButton></td>
                    <td>{g.cited} of {g.answered}</td>
                    <td>{categoryLinks.get(g.key)?.rows ?? 0}</td>
                    <td>{categoryLinks.get(g.key)?.fenderOwnedRows ?? 0}</td>
                  </tr>
                )}
              />
            ) : null}
          </div>
        </>
      )}

      <CitationEvidenceTable rows={filtered} label={pickLabel} onClear={pick ? () => setPick(null) : undefined} />
    </>
  );
}

export function CitationEcosystemPanel() {
  return <AiReadGate>{(snapshot) => <Ecosystem snapshot={snapshot} />}</AiReadGate>;
}
