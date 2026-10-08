"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { AiAnswerDetailRow } from "@/lib/dashboard-v2/data/types";
import { formatInt, formatPct } from "@/lib/dashboard-v2/reading/format";
import { codesOf, labelFor } from "@/lib/dashboard-v2/reading/labels";
import { AI_ANSWER_SHARE_ID } from "@/lib/dashboard-v2/selectors/ai-answer-share";
import { WRONG_SPEC_FLAGS_ID } from "@/lib/dashboard-v2/selectors/wrong-spec-flags";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

type AnswerTableRow = Record<string, unknown> & {
  ai_answer_id: string;
  engine: string;
  category: string;
  prompt: string;
  outcome: string;
  winner: string | null;
  wrong_spec_flag: boolean;
  wrong_spec_reason: string | null;
  answered_at: string;
  reading_run_id: string;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "engine", label: "Engine", type: "enum", labelKind: "engine", order: codesOf("engine") },
  { key: "category", label: "Category", type: "enum" },
  { key: "prompt", label: "Prompt", type: "text", truncate: true },
  { key: "outcome", label: "Outcome", type: "enum", labelKind: "outcome", order: codesOf("outcome") },
  { key: "winner", label: "Winner", type: "text" },
  { key: "wrong_spec_flag", label: "Wrong spec", type: "boolean" },
  { key: "answered_at", label: "Answered at", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

function toRow(row: AiAnswerDetailRow): AnswerTableRow {
  return {
    ai_answer_id: row.ai_answer_id,
    engine: row.engine,
    category: row.category,
    prompt: row.prompt_text,
    outcome: row.outcome,
    winner: row.winner_brand_name,
    wrong_spec_flag: row.wrong_spec_flag,
    wrong_spec_reason: row.wrong_spec_reason,
    answered_at: row.answered_at,
    reading_run_id: row.reading_run_id,
    [STATUS_KEY]: row.outcome === "resolved" ? "complete" : row.outcome === "unclear" ? "partial" : "unavailable",
  };
}

function AnswerExplainer({ ctx, row }: { ctx: SpokeRenderContext; row: AnswerTableRow }) {
  return (
    <Explainer
      all={ctx.all}
      target={{
        registryId: row.wrong_spec_flag ? WRONG_SPEC_FLAGS_ID : AI_ANSWER_SHARE_ID,
        asOf: row.answered_at,
        runId: row.reading_run_id,
        facts: [
          { label: "Prompt", value: row.prompt },
          { label: "Engine", value: labelFor("engine", row.engine) },
          { label: "Outcome", value: labelFor("outcome", row.outcome) },
          { label: "Winner", value: row.winner ?? "no brand resolved" },
          { label: "Wrong spec reason", value: row.wrong_spec_reason ?? "none" },
        ],
      }}
    />
  );
}

export function AnswersTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<AiAnswerDetailRow>("/api/dashboard-v2/answers");
  const rows = useMemo(() => state.rows.map(toRow), [state.rows]);

  return (
    <RemoteTable state={{ ...state, rows }} noun="answers">
      {(tableRows) => (
        <DataTable<AnswerTableRow>
          rows={tableRows}
          columns={COLUMNS}
          rowKey="ai_answer_id"
          noun="answers"
          initialSort={{ key: "answered_at", direction: "desc" }}
          renderExpanded={(row) => <AnswerExplainer ctx={ctx} row={row} />}
        />
      )}
    </RemoteTable>
  );
}

type ReasonGroupRow = Record<string, unknown> & {
  reason: string;
  flagged: number;
  share_of_flagged: number;
  engines: string;
  categories: string;
  latest: string | null;
  [STATUS_KEY]: RowStatus;
};

const GROUP_COLUMNS: ColumnDef[] = [
  { key: "reason", label: "Reason", type: "text" },
  { key: "flagged", label: "Flagged answers", type: "number" },
  { key: "share_of_flagged", label: "Share of flagged", type: "percent" },
  { key: "engines", label: "Engines", type: "text" },
  { key: "categories", label: "Categories", type: "text" },
  { key: "latest", label: "Latest", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

/** Reason groups counted from the flagged answers read, since metric_value stores only the total. */
export function reasonGroups(rows: AiAnswerDetailRow[]): ReasonGroupRow[] {
  const groups = new Map<string, { count: number; engines: Set<string>; categories: Set<string>; latest: string | null }>();
  for (const row of rows) {
    const reason = row.wrong_spec_reason ?? "reason not stored";
    const g = groups.get(reason) ?? { count: 0, engines: new Set<string>(), categories: new Set<string>(), latest: null };
    g.count += 1;
    g.engines.add(labelFor("engine", row.engine));
    g.categories.add(row.category);
    if (!g.latest || row.answered_at > g.latest) g.latest = row.answered_at;
    groups.set(reason, g);
  }
  const total = rows.length;
  return [...groups.entries()]
    .map(([reason, g]) => ({
      reason,
      flagged: g.count,
      share_of_flagged: total ? (g.count / total) * 100 : 0,
      engines: [...g.engines].sort().join(", "),
      categories: [...g.categories].sort().join(", "),
      latest: g.latest,
      [STATUS_KEY]: "complete" as RowStatus,
    }))
    .sort((a, b) => b.flagged - a.flagged || a.reason.localeCompare(b.reason));
}

/** Tab 2 of AI Search Visibility: flagged answers grouped by the rule that flagged them, then the rows. */
export function WrongSpecsTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<AiAnswerDetailRow>("/api/dashboard-v2/answers?flag=1");
  const groups = useMemo(() => reasonGroups(state.rows), [state.rows]);
  const rows = useMemo(() => state.rows.map(toRow), [state.rows]);
  const flags = ctx.all.wrongSpec;
  return (
    <div className="dv2-spoke">
      <p className="dv2-spoke-note">
        Stored count: {flags.reading.status === "unavailable" ? `unavailable: ${flags.reading.reason}` : `${formatInt(flags.reading.value as number)} flagged answers`}.
        {state.status === "ready" ? ` Read here: ${formatInt(rows.length)} rows in ${formatInt(groups.length)} reason groups${rows.length ? `, the largest ${formatPct(groups[0].share_of_flagged)} of the flagged answers` : ""}.` : ""}
      </p>
      <RemoteTable state={{ ...state, rows: groups }} noun="reason groups">
        {(groupRows) => (
          <DataTable<ReasonGroupRow>
            rows={groupRows}
            columns={GROUP_COLUMNS}
            rowKey="reason"
            noun="reason groups"
            initialSort={{ key: "flagged", direction: "desc" }}
            renderExpanded={(row) => (
              <Explainer
                all={ctx.all}
                target={{
                  registryId: WRONG_SPEC_FLAGS_ID,
                  asOf: row.latest,
                  facts: [
                    { label: "Rule", value: row.reason },
                    { label: "Flagged answers", value: formatInt(row.flagged) },
                    { label: "Engines", value: row.engines },
                    { label: "Categories", value: row.categories },
                  ],
                }}
              />
            )}
          />
        )}
      </RemoteTable>
      <RemoteTable state={{ ...state, rows }} noun="flagged answers">
        {(tableRows) => (
          <DataTable<AnswerTableRow>
            rows={tableRows}
            columns={COLUMNS}
            rowKey="ai_answer_id"
            noun="flagged answers"
            initialSort={{ key: "answered_at", direction: "desc" }}
            renderExpanded={(row) => <AnswerExplainer ctx={ctx} row={row} />}
          />
        )}
      </RemoteTable>
    </div>
  );
}
