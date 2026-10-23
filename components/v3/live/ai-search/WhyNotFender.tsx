"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { mutedText } from "@/components/v3/live/ai-search/AiReadGate";
import { ExternalLink } from "@/components/v3/live/ai-search/ExternalLink";
import { answerCopy, useAnswerText } from "@/components/v3/live/ai-search/useAnswerText";
import type { CitationEvidence } from "@/lib/ai-search/citations";
import { answerLookupId, whyNotFender } from "@/lib/ai-search/why-not-fender";
import type { AiCallRow } from "@/lib/ai-search/types";

/** Stored answer and cited pages for one competitor-led answer. The link is an association. */
export function WhyNotFender({ row, pages }: { row: AiCallRow; pages: CitationEvidence[] }) {
  const lookup = answerLookupId(row.id);
  const stored = lookup === null || row.answer_text !== undefined ? (row.answer_text ?? null) : undefined;
  const answer = useAnswerText(lookup ?? row.id, stored);
  const view = whyNotFender({
    answerText: answer.status === "ready" ? answer.text : null,
    pages: pages.map((page) => ({ href: page.rawUrl, label: page.title || page.domain })),
  });

  return (
    <div data-ai-why-not={row.id} style={{ marginTop: 8 }}>
      <div className="action-details" style={{ fontSize: 12 }}>
        Why not Fender? <AiTerm term="association">Association</AiTerm>
      </div>
      <p style={{ ...mutedText, margin: "4px 0" }}>{view.note}</p>
      {view.pages.length ? (
        <ul style={{ ...mutedText, margin: "4px 0", paddingLeft: 18 }}>
          {view.pages.map((page) => (
            <li key={page.href} data-ai-why-page={page.href}>
              <ExternalLink href={page.href}>{page.label}</ExternalLink>{" "}
              <AiTerm term="association">Association</AiTerm>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ ...mutedText, margin: "4px 0" }} data-ai-why-page="none">
          No cited page was stored.
        </p>
      )}
      <details>
        <summary>Stored answer</summary>
        <p style={{ ...mutedText, whiteSpace: "pre-wrap", margin: "4px 0 0" }} data-ai-why-answer>
          {answer.status === "ready" && view.answer
            ? view.answer
            : answerCopy(answer, "No answer text was stored for this call.")}
        </p>
      </details>
    </div>
  );
}
