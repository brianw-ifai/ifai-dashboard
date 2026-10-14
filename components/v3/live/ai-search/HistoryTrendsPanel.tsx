"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useAiHistory } from "@/components/v3/live/ai-search/AiHistoryContext";
import { HistoryBanner } from "@/components/v3/live/ai-search/HistoryBanner";
import { HistoryPointDetail } from "@/components/v3/live/ai-search/HistoryPointDetail";
import { HistoryTrendChart } from "@/components/v3/live/ai-search/HistoryTrendChart";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { isTrustworthyRun, utcDay } from "@/lib/ai-search/history-eligibility";
import { formatDay } from "@/lib/ai-search/history-eligibility";
import { rangeFromMode } from "@/lib/ai-search/history-mode";
import {
  boundaryLabel,
  buildHistoryTrend,
  coverageLabel,
  ONE_RUN_TREND_MESSAGE,
  queryChoices,
  rateLabel,
  type QueryChoice,
  type TrendMetric,
} from "@/lib/ai-search/history-trends";
import { ROLE_LABELS } from "@/lib/ai-search/question-role";
import { cleanPrompt } from "@/lib/ai-search/run-metrics";

function choiceValue(choice: QueryChoice): string {
  if (choice.kind === "all") return "all";
  if (choice.kind === "lineage") return `lineage:${choice.promptKey}`;
  return `version:${choice.versionKey}`;
}

function choiceLabel(choice: QueryChoice): string {
  if (choice.kind === "all") return "All questions in this rate";
  if (choice.kind === "lineage") return `All wordings of ${choice.promptKey}`;
  const text = cleanPrompt(choice.promptText);
  return text.length > 72 ? `${text.slice(0, 69)}...` : text;
}

export function HistoryTrendsPanel() {
  const history = useAiHistory();
  const [metric, setMetric] = useState<TrendMetric>("unbranded_discovery");
  const [breakdown, setBreakdown] = useState<"overall" | "engine">("overall");
  const [query, setQuery] = useState<QueryChoice>({ kind: "all" });
  const [picked, setPicked] = useState<{ runId: string; seriesKey: string } | null>(null);
  const { from, to } = rangeFromMode(history.mode);
  const runs = history.catalog.phase === "ready" ? history.catalog.runs : [];
  const trusted = runs.filter(isTrustworthyRun).filter((run) => {
    const day = utcDay(run.published_at ?? run.completed_at);
    if (!day) return false;
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });

  const model = useMemo(() => {
    if (history.trend.phase !== "ready") return null;
    return buildHistoryTrend({
      snapshots: history.trend.snapshots,
      metric,
      breakdown,
      fromDay: from,
      toDay: to,
      query,
    });
  }, [breakdown, from, history.trend, metric, query, to]);

  const choices = useMemo(
    () => (history.trend.phase === "ready" ? queryChoices(history.trend.snapshots, metric) : [{ kind: "all" as const }]),
    [history.trend, metric],
  );

  const period = history.mode.kind === "all" ? "All time" : history.mode.kind === "range" ? `${formatDay(history.mode.from)} to ${formatDay(history.mode.to)}` : "Trends";

  let body: ReactNode = null;
  if (history.catalog.phase === "loading" || history.trend.phase === "loading") {
    body = <p className="ai-history-note" data-ai-history-state="loading">Loading run history.</p>;
  } else if (history.catalog.phase === "error") {
    body = <p className="ai-history-note" data-ai-history-state="error">Run history did not load. {history.catalog.message}</p>;
  } else if (history.trend.phase === "unavailable" || history.trend.phase === "error") {
    body = (
      <p className="ai-history-note" data-ai-history-state="unavailable">
        {history.trend.message} No trend line is drawn.
      </p>
    );
  } else if (trusted.length === 1 || model?.status === "one-run") {
    body = (
      <p className="ai-history-note" data-ai-history-state="one-run">
        {trusted.length === 1 ? ONE_RUN_TREND_MESSAGE : model?.message ?? ONE_RUN_TREND_MESSAGE}
      </p>
    );
  } else if (trusted.length === 0 || model?.status === "empty") {
    body = <p className="ai-history-note" data-ai-history-state="empty">No trustworthy published run falls in this range.</p>;
  } else if (model?.status === "ready") {
    const active = model.series.flatMap((series) => series.points.map((point) => ({ point, series }))).find(
      (item) => item.point.runId === picked?.runId && item.series.key === picked?.seriesKey,
    );
    const snapshot = history.trend.phase === "ready"
      ? history.trend.snapshots.find((item) => item.run.audit_run_id === active?.point.runId) ?? null
      : null;
    body = (
      <>
        <HistoryTrendChart
          model={model}
          activeKey={active ? `${active.point.runId}:${active.series.key}` : null}
          onPick={(point, seriesKey) => setPicked({ runId: point.runId, seriesKey })}
        />
        {model.boundaries.map((boundary) => (
          <div key={`${boundary.afterRunId}-${boundary.beforeRunId}`} className="ai-history-boundary" data-ai-history-boundary>
            <strong>
              {boundary.promptSetChanged ? <AiTerm term="question set">Question set changed</AiTerm> : null}
              {boundary.promptSetChanged && boundary.queryVersionChanged ? ". " : null}
              {boundary.queryVersionChanged ? <AiTerm term="query version">Question wording changed</AiTerm> : null}
              {!boundary.promptSetChanged && !boundary.queryVersionChanged ? boundaryLabel(boundary) : null}
            </strong>
            <p>
              {formatDay(boundary.afterDay)} to {formatDay(boundary.beforeDay)}. Open the questions on each side before comparing the rates.
            </p>
            <details>
              <summary>Questions before and after</summary>
              <div>
                <p>Before</p>
                <ul>
                  {boundary.beforeQuestions.map((question) => (
                    <li key={question.versionKey}>{cleanPrompt(question.promptText)}</li>
                  ))}
                </ul>
                <p>After</p>
                <ul>
                  {boundary.afterQuestions.map((question) => (
                    <li key={question.versionKey}>{cleanPrompt(question.promptText)}</li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        ))}
        <table className="table-sm ai-history-table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Series</th>
              <th>Rate</th>
              <th>Outside the rate</th>
            </tr>
          </thead>
          <tbody>
            {model.series.flatMap((series) =>
              series.points.map((point) => (
                <tr key={`${point.runId}:${series.key}`} data-ai-trend-row={`${point.runId}:${series.key}`}>
                  <td>{formatDay(point.day)}{point.partial ? " · Partial" : ""}</td>
                  <td>{series.label}</td>
                  <td>{rateLabel(point)}</td>
                  <td>{coverageLabel(point)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
        {active && snapshot ? (
          <HistoryPointDetail snapshot={snapshot} point={active.point} metric={metric} query={query} />
        ) : (
          <p className="ai-history-note">Choose a point to see the calls behind it.</p>
        )}
      </>
    );
  }

  return (
    <div data-ai-history-trends>
      <HistoryBanner
        heading={period}
        detail="Trends use trustworthy published runs only. Legacy test runs stay out of this chart."
      />
      <div className="ai-history-toggles">
        <div className="segmented-control" role="group" aria-label="Rate">
          {(["unbranded_discovery", "branded_consideration"] as const).map((role) => (
            <button
              key={role}
              type="button"
              className={`segmented-btn${metric === role ? " active" : ""}`}
              aria-pressed={metric === role}
              onClick={() => {
                setMetric(role);
                setQuery({ kind: "all" });
                setPicked(null);
              }}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
        <div className="segmented-control" role="group" aria-label="Breakdown">
          <button type="button" className={`segmented-btn${breakdown === "overall" ? " active" : ""}`} aria-pressed={breakdown === "overall"} onClick={() => setBreakdown("overall")}>
            Overall
          </button>
          <button type="button" className={`segmented-btn${breakdown === "engine" ? " active" : ""}`} aria-pressed={breakdown === "engine"} onClick={() => setBreakdown("engine")}>
            By engine
          </button>
        </div>
      </div>
      <p className="ai-history-note">
        <AiTerm term="unbranded discovery">Unbranded discovery</AiTerm> and{" "}
        <AiTerm term="branded consideration">branded consideration</AiTerm> use the same denominators as the current run.{" "}
        <AiTerm term="provider error">Provider errors</AiTerm> and <AiTerm term="no clear leader">unresolved answers</AiTerm> stay outside.
      </p>
      <label className="ai-history-query">
        Question
        <select
          value={choiceValue(query)}
          aria-label="Question version"
          onChange={(event) => {
            const next = choices.find((choice) => choiceValue(choice) === event.target.value) ?? { kind: "all" as const };
            setQuery(next);
            setPicked(null);
          }}
        >
          {choices.map((choice) => (
            <option key={choiceValue(choice)} value={choiceValue(choice)}>
              {choiceLabel(choice)}
            </option>
          ))}
        </select>
      </label>
      {body}
    </div>
  );
}
