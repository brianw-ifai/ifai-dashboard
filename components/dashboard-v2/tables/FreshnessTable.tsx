"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import { formatInt } from "@/lib/dashboard-v2/reading/format";
import { codesOf } from "@/lib/dashboard-v2/reading/labels";
import { READING_FRESHNESS_ID } from "@/lib/dashboard-v2/selectors/freshness";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";

type FreshnessTableRow = Record<string, unknown> & {
  run_id: string;
  workflow: string;
  source: string;
  as_of: string | null;
  read: number;
  population: number;
  run_status: string;
  ai_runs: number | null;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "workflow", label: "Workflow", type: "text" },
  { key: "source", label: "Source", type: "enum", labelKind: "source", order: codesOf("source") },
  { key: "as_of", label: "As of", type: "date" },
  { key: "read", label: "Rows read", type: "number" },
  { key: "population", label: "Population", type: "number" },
  { key: "run_status", label: "Run status", type: "enum", labelKind: "run_status", order: codesOf("run_status") },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

/** One as-of per workflow from reading_run; the oldest is the header figure. */
export function FreshnessTable({ ctx }: { ctx: SpokeRenderContext }) {
  const rows = useMemo<FreshnessTableRow[]>(
    () =>
      ctx.all.freshness.sources.map((s) => ({
        run_id: s.runId,
        workflow: s.workflowName,
        source: s.source,
        as_of: s.asOf,
        read: s.read,
        population: s.population,
        run_status: s.status,
        ai_runs: s.aiRunCount,
        [STATUS_KEY]: s.status === "complete" ? "complete" : s.status === "partial" ? "partial" : "unavailable",
      })),
    [ctx.all.freshness.sources],
  );

  return (
    <DataTable<FreshnessTableRow>
      rows={rows}
      columns={COLUMNS}
      rowKey="run_id"
      noun="sources"
      initialSort={{ key: "as_of", direction: "asc" }}
      renderExpanded={(row) => (
        <Explainer
          all={ctx.all}
          target={{
            registryId: READING_FRESHNESS_ID,
            asOf: row.as_of,
            runId: row.run_id,
            facts: [
              { label: "Workflow", value: row.workflow },
              { label: "Battery runs stored", value: row.ai_runs === null ? "not an AI battery source" : formatInt(row.ai_runs) },
            ],
          }}
        />
      )}
    />
  );
}
