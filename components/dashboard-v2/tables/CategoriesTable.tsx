"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import { categoryLabel } from "@/lib/dashboard-v2/canvas/first-views";
import { formatReading } from "@/lib/dashboard-v2/reading/format";
import type { Rate } from "@/lib/dashboard-v2/reading/types";
import { CATEGORY_SHARE_ID } from "@/lib/dashboard-v2/selectors/weakest-category";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";

type CategoryTableRow = Record<string, unknown> & {
  category: string;
  label: string;
  client_share: Rate | null;
  top_rival: string | null;
  rival_share: Rate | null;
  gap_points: number | null;
  resolved: number;
  as_of: string | null;
  run_id: string | null;
  client_line: string;
  rival_line: string;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "label", label: "Category", type: "enum" },
  { key: "client_share", label: "Brand share", type: "percent" },
  { key: "top_rival", label: "Top rival", type: "enum" },
  { key: "rival_share", label: "Rival share", type: "percent" },
  { key: "gap_points", label: "Gap, points", type: "number" },
  { key: "resolved", label: "Resolved answers", type: "number" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

/** Per-category rows come from the selector over metric_value dimensions, not from a fetch. */
export function CategoriesTable({ ctx }: { ctx: SpokeRenderContext }) {
  const rows = useMemo<CategoryTableRow[]>(
    () =>
      ctx.all.weakest.categories.map((c) => {
        const client = c.clientShare.status === "unavailable" ? null : c.clientShare.value;
        const rival = c.rivalShare && c.rivalShare.status !== "unavailable" ? c.rivalShare.value : null;
        return {
          category: c.category,
          label: categoryLabel(c.category),
          client_share: client,
          top_rival: c.topRival,
          rival_share: rival,
          gap_points: client && rival ? Math.round((client.pct - rival.pct) * 10) / 10 : null,
          resolved: c.resolved,
          as_of: c.clientShare.coverage?.asOf ?? null,
          run_id: c.clientShare.coverage?.runId ?? null,
          client_line: formatReading(c.clientShare),
          rival_line: c.rivalShare ? formatReading(c.rivalShare) : "unavailable: no rival share is stored",
          [STATUS_KEY]: c.clientShare.status,
        };
      }),
    [ctx.all.weakest.categories],
  );

  return (
    <DataTable<CategoryTableRow>
      rows={rows}
      columns={COLUMNS}
      rowKey="category"
      noun="categories"
      initialSort={{ key: "client_share", direction: "asc" }}
      renderExpanded={(row) => (
        <Explainer
          all={ctx.all}
          target={{
            registryId: CATEGORY_SHARE_ID,
            reading: ctx.all.weakest.categories.find((c) => c.category === row.category)?.clientShare ?? null,
            title: row.label,
            asOf: row.as_of,
            runId: row.run_id,
            facts: [
              { label: "Brand share", value: row.client_line },
              { label: "Top rival", value: row.top_rival ?? "none stored" },
              { label: "Rival share", value: row.rival_line },
            ],
          }}
        />
      )}
    />
  );
}
