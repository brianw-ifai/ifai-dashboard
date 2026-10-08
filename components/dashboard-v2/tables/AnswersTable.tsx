"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { AiAnswerDetailRow } from "@/lib/dashboard-v2/data/types";
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
  { key: "engine", label: "Engine", type: "enum" },
  { key: "category", label: "Category", type: "enum" },
  { key: "prompt", label: "Prompt", type: "text" },
  { key: "outcome", label: "Outcome", type: "enum" },
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
          renderExpanded={(row) => (
            <Explainer
              bundle={ctx.bundle}
              registryId={row.wrong_spec_flag ? WRONG_SPEC_FLAGS_ID : AI_ANSWER_SHARE_ID}
              asOf={row.answered_at}
              runId={row.reading_run_id}
              facts={[
                { label: "Prompt", value: row.prompt },
                { label: "Winner", value: row.winner ?? "no brand resolved" },
                { label: "Wrong spec reason", value: row.wrong_spec_reason ?? "none" },
              ]}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
