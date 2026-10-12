"use client";

import { useEffect, useState } from "react";
import { mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { ExternalLink } from "@/components/v3/live/ai-search/ExternalLink";
import { SOURCE_CLASS_LABELS, type CitationEvidence } from "@/lib/ai-search/citations";
import { ACCURACY_LABELS, accuracyState } from "@/lib/ai-search/explorer-filter";
import { answerTextQuery } from "@/lib/ai-search/queries";
import { genuineGuidance } from "@/lib/ai-search/remediation";
import {
  callOutcome,
  categoryLabel,
  cleanPrompt,
  engineLabel,
  formatRunTime,
  modelLabel,
  OUTCOME_LABELS,
} from "@/lib/ai-search/run-metrics";
import type { AiCallRow } from "@/lib/ai-search/types";
import { getCanvasSupabase } from "@/lib/supabase/canvas-client";

type Answer = { status: "loading" } | { status: "ready"; text: string | null } | { status: "error"; message: string };

function useAnswer(id: string): Answer {
  const [answer, setAnswer] = useState<Answer>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    void answerTextQuery(getCanvasSupabase() as never, id).then(({ answer: text, error }) => {
      if (cancelled) return;
      setAnswer(error ? { status: "error", message: error } : { status: "ready", text });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return answer;
}

export function SimulationEvidenceDrawer({
  row,
  citations,
  onClose,
}: {
  row: AiCallRow;
  citations: CitationEvidence[];
  onClose: () => void;
}) {
  const answer = useAnswer(row.id);
  const answerText = answer.status === "ready" ? answer.text : null;
  const outcome = callOutcome(row);
  const rootCause = answer.status === "ready" ? genuineGuidance(row.root_cause, answerText) : null;
  const remediation = answer.status === "ready" ? genuineGuidance(row.remediation_patch, answerText) : null;
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div
      className="content-box ai-evidence-drawer"
      role="region"
      aria-label={`Evidence for call ${row.sim_id}`}
      data-sim-id={row.sim_id}
      style={{ marginTop: 6, borderColor: "var(--border-glow)" }}
    >
      <div className="content-box-title">
        <span>Call {row.sim_id} evidence</span>
        <button type="button" className="segmented-btn" onClick={onClose}>Close</button>
      </div>
      <table className="table-sm">
        <tbody>
          <tr><td>Prompt</td><td>{cleanPrompt(row.prompt)}</td></tr>
          <tr><td>Prompt key</td><td>{row.prompt_key ?? "Not recorded"}</td></tr>
          <tr>
            <td>Type</td>
            <td>{row.prompt_kind === "probe" ? <AiTerm term="probe">Fact-check probe</AiTerm> : `Commercial · ${categoryLabel(row.category)}`}</td>
          </tr>
          <tr><td>Engine</td><td>{engineLabel(row.engine)}</td></tr>
          <tr><td>Model</td><td>{modelLabel(row.model)}</td></tr>
          <tr><td>Outcome</td><td>{OUTCOME_LABELS[outcome]}</td></tr>
          {row.primary_brand && outcome !== "error" ? <tr><td>Brand named most</td><td>{row.primary_brand}</td></tr> : null}
          <tr><td>Accuracy</td><td>{ACCURACY_LABELS[accuracyState(row)]}</td></tr>
          {row.hallucination_evidence?.trim() ? (
            <tr><td>Contradiction evidence</td><td>{row.hallucination_evidence}</td></tr>
          ) : null}
          {row.error_message?.trim() ? <tr><td>Provider message</td><td>{row.error_message}</td></tr> : null}
          <tr><td>Checked</td><td>{formatRunTime(row.created_at)}</td></tr>
          <tr><td>Attempt</td><td>{row.attempt_no ?? "Not recorded"}</td></tr>
          <tr><td>Run</td><td style={{ wordBreak: "break-all" }}>{row.audit_run_id}</td></tr>
          <tr><td>Answer ID</td><td style={{ wordBreak: "break-all" }}>{row.id}</td></tr>
        </tbody>
      </table>

      {rootCause ? (
        <p style={{ fontSize: 12, marginTop: 8 }} data-ai-root-cause>
          <strong>Root cause:</strong> {rootCause}
        </p>
      ) : null}
      {remediation ? (
        <p style={{ fontSize: 12, marginTop: 8 }} data-ai-remediation>
          <strong>Recommended change:</strong> {remediation}
        </p>
      ) : null}

      <div style={{ marginTop: 8 }}>
        <strong style={{ fontSize: 12 }}>Cited pages ({citations.length})</strong>
        {citations.length === 0 ? (
          <p style={mutedText}>{outcome === "error" ? "The call failed, so there is no answer to cite from." : "This answer cited no valid link."}</p>
        ) : (
          <ol style={{ fontSize: 11, paddingLeft: 18, margin: "4px 0" }}>
            {citations.map((c) => (
              <li key={c.key} style={{ marginBottom: 4, wordBreak: "break-all" }}>
                <ExternalLink href={c.rawUrl}>{c.title ?? c.canonicalUrl}</ExternalLink>
                <div style={mutedText}>
                  {c.domain} · {SOURCE_CLASS_LABELS[c.sourceClass]} · <AiTerm term="canonical URL" />: {c.canonicalUrl}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {outcome !== "error" ? (
        <div style={{ marginTop: 8 }}>
          <button type="button" className="segmented-btn" onClick={() => setShowAnswer((v) => !v)} aria-expanded={showAnswer}>
            {showAnswer ? "Hide answer text" : "Show answer text"}
          </button>
          {showAnswer ? (
            <p style={{ ...mutedText, whiteSpace: "pre-wrap", marginTop: 6 }} data-ai-answer>
              {answer.status === "loading"
                ? "Loading the stored answer."
                : answer.status === "error"
                  ? `The answer did not load. ${answer.message}`
                  : (answer.text ?? "No answer text was stored for this call.")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
