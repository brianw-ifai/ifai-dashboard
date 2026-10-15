"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { callsBehindPoint, rateLabel, type QueryChoice, type TrendMetric, type TrendPoint } from "@/lib/ai-search/history-trends";
import { questionsInRun } from "@/lib/ai-search/history-trends";
import { cleanPrompt, engineLabel, OUTCOME_LABELS, callOutcome } from "@/lib/ai-search/run-metrics";
import { ROLE_LABELS } from "@/lib/ai-search/question-role";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

export function HistoryPointDetail({
  snapshot,
  point,
  metric,
  query,
}: {
  snapshot: AiSearchSnapshot;
  point: TrendPoint;
  metric: TrendMetric;
  query: QueryChoice;
}) {
  const { inRate, outside } = callsBehindPoint(snapshot, point, metric, query);
  const questions = questionsInRun(snapshot.calls.filter((call) => call.audit_run_id === snapshot.run.audit_run_id));
  return (
    <div className="ai-history-detail" data-ai-trend-detail={point.runId}>
      <p>
        {rateLabel(point)}. {inRate.length} resolved {inRate.length === 1 ? "call" : "calls"} are in this rate.
      </p>
      <table className="table-sm">
        <thead>
          <tr>
            <th>Question</th>
            <th>Engine</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {inRate.map((call) => (
            <tr key={call.id} data-ai-trend-call={call.id} data-ai-trend-bucket="rate">
              <td>{cleanPrompt(call.prompt)}</td>
              <td>{engineLabel(call.engine)}</td>
              <td>{OUTCOME_LABELS[callOutcome(call)]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Outside this rate: {outside.length === 0 ? "none in this question and engine." : `${outside.length} calls.`}{" "}
        <AiTerm term="no clear leader">Unresolved answers</AiTerm> and <AiTerm term="provider error">provider errors</AiTerm> stay
        out of the denominator.
      </p>
      {outside.length > 0 ? (
        <ul>
          {outside.map((call) => (
            <li key={call.id} data-ai-trend-call={call.id} data-ai-trend-bucket="outside">
              {engineLabel(call.engine)}: {OUTCOME_LABELS[callOutcome(call)]}
            </li>
          ))}
        </ul>
      ) : null}
      <details>
        <summary>Questions in this run</summary>
        <ul>
          {questions.map((question) => (
            <li key={question.versionKey}>
              {ROLE_LABELS[question.role]}: {cleanPrompt(question.promptText)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
