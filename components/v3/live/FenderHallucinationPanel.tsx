"use client";

import { useEffect, useState } from "react";
import { hallucinationCauseRowsQuery } from "@/lib/canvasData";
import {
  groupHallucinationCauses,
  type HallucinationCauseSummary,
} from "@/lib/fender-canvas/hallucination-causes";
import { formatInt } from "@/lib/fender-canvas/format";

export function FenderHallucinationPanel() {
  const [summary, setSummary] = useState<HallucinationCauseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void hallucinationCauseRowsQuery().then(({ data, error: queryError }) => {
      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        return;
      }
      setSummary(groupHallucinationCauses(data));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="content-box">
        <div className="content-box-title">Stored spec hallucination root causes</div>
        <p style={{ fontSize: 12 }}>The simulation read did not return. {error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="content-box">
        <p style={{ fontSize: 12 }}>Loading stored root causes…</p>
      </div>
    );
  }

  return (
    <div className="content-box">
      <div className="content-box-title">
        <span>Stored spec hallucination root causes</span>
        <span className="tag-badge tag-danger">{formatInt(summary.flagged)} flagged answers</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
        Each card is a root cause stored on the flagged simulation rows. The count is how many of
        those rows share that text.
      </p>
      {summary.groups.map((group) => (
        <div key={group.rootCause} className="action-card critical" style={{ marginTop: 8 }}>
          <div className="action-head">
            <span>{group.rootCause}</span>
            <span className="tag-badge tag-neutral">{formatInt(group.count)} answers</span>
          </div>
          <div className="action-details">
            {group.engines.length ? `Engines: ${group.engines.join(", ")}. ` : ""}
            {group.categories.length ? `Categories: ${group.categories.join(", ")}.` : ""}
            {group.examplePrompt ? (
              <>
                <br />
                Example prompt: {group.examplePrompt}
              </>
            ) : null}
          </div>
        </div>
      ))}
      {summary.missingRootCause > 0 ? (
        <p style={{ fontSize: 12, marginTop: 8 }}>
          {formatInt(summary.missingRootCause)} flagged answers have no stored root cause.
        </p>
      ) : null}
      {summary.groups.length === 0 && summary.missingRootCause === 0 ? (
        <p style={{ fontSize: 12 }}>This read returned no flagged answers.</p>
      ) : null}
    </div>
  );
}
