"use client";

import { AiReadGate, EmptyRows, mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { ExternalLink } from "@/components/v3/live/ai-search/ExternalLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import { driftRead, PROBE_STATE_LABELS, type ProbeState } from "@/lib/ai-search/drift";
import { engineLabel, formatRunTime, modelLabel } from "@/lib/ai-search/run-metrics";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

const STATE_TONE: Record<ProbeState, string> = {
  confirmed: "tag-danger",
  no_contradiction: "tag-success",
  no_fact: "tag-neutral",
  provider_error: "tag-warning",
  unverified: "tag-warning",
};

function Drift({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const d = driftRead(snapshot.calls, snapshot.probes);
  const confirmed = d.probes.filter((p) => p.state === "confirmed");

  return (
    <>
      <div className="content-box ai-drift-summary">
        <div className="content-box-title">
          <span>Confirmed errors against verified Fender facts</span>
          <span className={`tag-badge ${d.confirmed ? "tag-danger" : "tag-success"}`} data-ai-confirmed>
            {d.confirmed} confirmed
          </span>
        </div>
        <ul style={{ ...mutedText, paddingLeft: 16, margin: 0 }}>
          <li>
            {d.checked} answered <AiTerm term="probe">probes</AiTerm> were compared with a fact verified on a Fender
            page. {d.confirmed} had a <AiTerm term="confirmed contradiction" />. {d.noContradiction} had{" "}
            <AiTerm term="no contradiction matched" />, which means the check found nothing wrong, not that the whole
            answer is accurate.
          </li>
          <li>{d.noFact} answered probes have no verified fact yet, so they were not checked.</li>
          <li>
            {d.errors} probe calls failed with a <AiTerm term="provider error" /> and have no answer to check.
          </li>
          <li>
            Commercial answers: {d.commercialChecked} of {d.commercialAnswered} were fact-checked in this run.{" "}
            {d.commercialConfirmed} had a confirmed contradiction and none of those counts as a Fender lead.
          </li>
          <li>
            Unverified flags in this run: {d.unverified}. Flags from earlier runs were never verified and are not
            shown as confirmed.
          </li>
        </ul>
      </div>

      {confirmed.length ? (
        <div className="content-box" style={{ marginTop: 12 }}>
          <div className="content-box-title">Contradictions</div>
          {confirmed.map((p) => (
            <div key={p.key} className="action-card critical" style={{ marginTop: 6 }}>
              <div className="action-head">{p.prompt}</div>
              <div className="action-details">
                {engineLabel(p.engine)} · {modelLabel(p.model)}. Expected: {p.claim}. Evidence: {p.evidence}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="content-box ai-probe-table" style={{ marginTop: 12 }}>
        <div className="content-box-title">Every probe call in the run</div>
        {d.probes.length === 0 ? <EmptyRows>This run has no probe calls.</EmptyRows> : null}
        <table className="table-sm">
          <thead>
            <tr><th>Prompt</th><th>Engine</th><th>State</th><th>Verified fact</th><th>Checked</th></tr>
          </thead>
          <tbody>
            {d.probes.map((p) => (
              <tr key={p.key} data-probe-state={p.state} data-sim-id={p.simId}>
                <td>
                  <EvidenceLink focus={{ field: "sim", value: String(p.simId) }} tab={AI_TABS.simulations}>
                    {p.prompt}
                  </EvidenceLink>
                </td>
                <td>{engineLabel(p.engine)}<div style={mutedText}>{modelLabel(p.model)}</div></td>
                <td><span className={`tag-badge ${STATE_TONE[p.state]}`}>{PROBE_STATE_LABELS[p.state]}</span></td>
                <td style={{ wordBreak: "break-word" }}>
                  {p.claim ? (
                    <>
                      {p.claim}{" "}
                      <ExternalLink href={p.sourceUrl}>Source</ExternalLink>
                    </>
                  ) : (
                    "No verified fact"
                  )}
                  {p.evidence ? <div style={mutedText}>Evidence: {p.evidence}</div> : null}
                </td>
                <td>{formatRunTime(p.checkedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {d.facts.length ? (
          <p style={{ ...mutedText, marginTop: 8 }}>
            Each verified fact was taken from the linked Fender page on {formatRunTime(d.facts[0].verifiedAt)}.
          </p>
        ) : null}
      </div>
    </>
  );
}

export function AiDriftPanel() {
  return <AiReadGate>{(snapshot) => <Drift snapshot={snapshot} />}</AiReadGate>;
}
