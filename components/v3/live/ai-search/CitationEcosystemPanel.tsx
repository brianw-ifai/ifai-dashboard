"use client";

import { useMemo, useState } from "react";
import { AiReadGate, EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { CitationEvidenceTable } from "@/components/v3/live/ai-search/CitationEvidenceTable";
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
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

type CitationPick = { field: "domain" | "class" | "engine" | "category"; value: string } | null;

const SCOPES: Array<[CitationScope, string]> = [
  ["commercial", "Commercial answers"],
  ["probe", "Fact-check probes"],
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
  const filtered = read.rows.filter((row) => matches(row, pick));
  const pickLabel = !pick
    ? "every valid link"
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
          <span>Which pages AI answers cite</span>
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
        <ul style={{ ...mutedText, paddingLeft: 16, margin: 0 }}>
          <li data-ai-cited-answers>
            {read.answersWithCitation} of {read.answered} answered calls cited at least one valid link ({pct(read.answersWithCitation, read.answered)}).
          </li>
          <li>{read.rows.length} valid links across {domains.length} domains.</li>
          <li data-ai-fender-owned>
            Fender-owned pages: {fender.length} of {read.rows.length} links ({pct(fender.length, read.rows.length)}), in {fenderAnswers} answers. Third-party pages: {read.rows.length - fender.length} links.
          </li>
          <li>
            {read.stored} stored rows in this scope. {read.duplicates} repeat the same <AiTerm term="canonical URL" /> in one answer and {read.invalid} were empty or invalid, so they are left out.
          </li>
        </ul>
        <p style={{ ...mutedText, marginTop: 8 }}>
          A cited page appears alongside an answer. This read does not measure whether the page caused the answer.
        </p>
      </div>

      {read.rows.length === 0 ? (
        <div className="content-box" style={{ marginTop: 12 }}>
          <EmptyRows>No answer in this scope cited a valid link.</EmptyRows>
        </div>
      ) : (
        <>
          <div className="content-box" style={{ marginTop: 12 }}>
            <div className="content-box-title">By <AiTerm term="source class" /></div>
            <table className="table-sm">
              <thead><tr><th>Class</th><th>Links</th><th>Share</th><th>Answers</th></tr></thead>
              <tbody>
                {classes.map((g) => (
                  <tr key={g.key} data-source-class={g.key}>
                    <td><PickButton pick={{ field: "class", value: g.key }} onPick={setPick}>{SOURCE_CLASS_LABELS[g.key as SourceClass]}</PickButton></td>
                    <td>{g.rows}</td>
                    <td>{pct(g.rows, read.rows.length)}</td>
                    <td>{g.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="content-box ai-top-domains" style={{ marginTop: 12 }}>
            <div className="content-box-title">Top domains</div>
            <table className="table-sm">
              <thead><tr><th>Domain</th><th>Class</th><th>Links</th><th>Answers</th></tr></thead>
              <tbody>
                {domains.slice(0, 15).map((g) => (
                  <tr key={g.key} data-domain={g.key}>
                    <td style={{ wordBreak: "break-all" }}><PickButton pick={{ field: "domain", value: g.key }} onPick={setPick}>{g.key}</PickButton></td>
                    <td>{SOURCE_CLASS_LABELS[read.rows.find((r) => r.domain === g.key)?.sourceClass ?? "other"]}</td>
                    <td>{g.rows}</td>
                    <td>{g.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {domains.length > 15 ? <p style={mutedText}>{domains.length - 15} more domains are in the cited pages table below.</p> : null}
          </div>

          <div className="content-box" style={{ marginTop: 12 }}>
            <div className="content-box-title">By engine and category</div>
            <table className="table-sm">
              <thead><tr><th>Engine</th><th>Cited answers</th><th>Links</th><th>Fender-owned</th></tr></thead>
              <tbody>
                {byEngine.map((g) => (
                  <tr key={g.key} data-engine={g.key}>
                    <td><PickButton pick={{ field: "engine", value: g.key }} onPick={setPick}>{engineLabel(g.key)}</PickButton></td>
                    <td>{g.cited} of {g.answered}</td>
                    <td>{engineLinks.get(g.key)?.rows ?? 0}</td>
                    <td>{engineLinks.get(g.key)?.fenderOwnedRows ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scope !== "probe" ? (
              <table className="table-sm" style={{ marginTop: 8 }}>
                <thead><tr><th>Category</th><th>Cited answers</th><th>Links</th><th>Fender-owned</th></tr></thead>
                <tbody>
                  {byCategory.map((g) => (
                    <tr key={g.key} data-category={g.key}>
                      <td><PickButton pick={{ field: "category", value: g.key }} onPick={setPick}>{g.key === "hallucinations" ? "Fact-check probes" : categoryLabel(g.key)}</PickButton></td>
                      <td>{g.cited} of {g.answered}</td>
                      <td>{categoryLinks.get(g.key)?.rows ?? 0}</td>
                      <td>{categoryLinks.get(g.key)?.fenderOwnedRows ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
