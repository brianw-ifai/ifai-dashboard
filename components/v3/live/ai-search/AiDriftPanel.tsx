"use client";

import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { AiReadGate, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { FactCheckTable } from "@/components/v3/live/ai-search/FactCheckTable";
import { driftRead } from "@/lib/ai-search/drift";
import {
  FACT_CHECK_SCOPE,
  FACT_CHECK_SHOPPING_SCOPE,
  FACT_CHECK_SHOPPING_SCOPE_WINDOW,
  factCheckCoverageNote,
  factCheckHeadline,
  factCheckPendingNote,
} from "@/lib/ai-search/fact-check-copy";
import { engineLabel, formatRunTime, modelLabel } from "@/lib/ai-search/run-metrics";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";
import { isWindowHistoryKind } from "@/lib/ai-search/window-display";

function FactChecks({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const history = useAiHistoryOptional();
  const windowed = isWindowHistoryKind(history?.mode.kind);
  const drift = driftRead(snapshot.calls, snapshot.probes);
  const { coverage } = drift;
  const contradictions = drift.probes.filter((row) => row.state === "confirmed");
  const coverageNote = factCheckCoverageNote(coverage);
  const pendingNote = factCheckPendingNote(coverage);
  const shoppingScope = windowed ? FACT_CHECK_SHOPPING_SCOPE_WINDOW : FACT_CHECK_SHOPPING_SCOPE;

  return (
    <>
      <div className="content-box ai-drift-summary">
        <div className="content-box-title">
          <span>Do AI answers match Fender&apos;s published product facts?</span>
          <span
            className={`tag-badge ${coverage.contradictions ? "tag-danger" : "tag-success"}`}
            data-ai-fact-result
          >
            {coverage.contradictions ? `${coverage.contradictions} contradictions` : "No contradictions found"}
          </span>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: "0 0 6px" }} data-ai-fact-headline>
          {factCheckHeadline(coverage, windowed)}
        </p>
        <p style={{ ...mutedText, margin: 0 }}>{FACT_CHECK_SCOPE}</p>
        <p style={{ ...mutedText, marginBottom: 0 }}>
          IntoFocus sends {coverage.questionsSent} product questions to every engine on purpose, and compares each
          answer with a fact taken from an official Fender page. A{" "}
          <AiTerm term="product fact check">product fact check</AiTerm> is not a buying prompt, so it never counts
          toward a win rate or a competitor&apos;s share.
        </p>
      </div>

      {contradictions.length ? (
        <div className="content-box" style={{ marginTop: 12 }}>
          <div className="content-box-title">Answers that contradict a Fender fact</div>
          {contradictions.map((row) => (
            <div key={row.key} className="action-card critical" style={{ marginTop: 6 }}>
              <div className="action-head">{row.prompt}</div>
              <div className="action-details">
                {engineLabel(row.engine)} · {modelLabel(row.model)}. Fender publishes: {row.claim}. The answer said:{" "}
                {row.evidence}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <FactCheckTable rows={drift.probes} windowed={windowed} />

      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">What this does and does not cover</div>
        <ul style={{ ...mutedText, paddingLeft: 16, margin: 0 }}>
          <li>{shoppingScope}</li>
          <li>
            A result of <AiTerm term="no contradiction found" /> means nothing in that answer conflicted with the one
            fact being checked. It is not a clean bill of health for the whole answer.
          </li>
          {pendingNote ? <li data-ai-pending-fact>{pendingNote}</li> : null}
          {coverageNote ? <li data-ai-coverage-note>{coverageNote}</li> : null}
          {drift.unverified > 0 ? (
            <li>
              {drift.unverified} answers carry a flag that was never verified against a Fender page, so they are not
              reported as contradictions.
            </li>
          ) : null}
          {drift.facts.length ? (
            <li>
              Each verified fact was read from the linked Fender page on {formatRunTime(drift.facts[0].verifiedAt)}.
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}

export function AiDriftPanel() {
  return <AiReadGate>{(snapshot) => <FactChecks snapshot={snapshot} />}</AiReadGate>;
}
