"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ActionItemRow } from "@/lib/dashboard-v2/data/types";
import { ACTION_ITEMS_OPEN_ID, actionRegistryId } from "@/lib/dashboard-v2/selectors/actions";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

type ActionTableRow = Record<string, unknown> & {
  action_item_id: string;
  title: string;
  owner: string;
  status: string;
  severity: string | null;
  registry: string | null;
  listing_id: string | null;
  finding_ref: string | null;
  created_at: string;
  updated_at: string;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "owner", label: "Owner", type: "enum" },
  { key: "status", label: "Status", type: "enum" },
  { key: "severity", label: "Severity", type: "enum" },
  { key: "registry", label: "Registry", type: "enum" },
  { key: "listing_id", label: "Listing", type: "text" },
  { key: "created_at", label: "Created", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

export function ActionsTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<ActionItemRow>("/api/dashboard-v2/actions");
  const rows = useMemo<ActionTableRow[]>(
    () =>
      state.rows.map((row) => ({
        action_item_id: row.action_item_id,
        title: row.title,
        owner: row.owner,
        status: row.status,
        severity: row.severity,
        registry: actionRegistryId(ctx.bundle, row),
        listing_id: row.listing_id,
        finding_ref: row.finding_ref,
        created_at: row.created_at,
        updated_at: row.updated_at,
        [STATUS_KEY]: "complete",
      })),
    [state.rows, ctx.bundle],
  );

  return (
    <RemoteTable state={{ ...state, rows }} noun="Action Items">
      {(tableRows) => (
        <DataTable<ActionTableRow>
          rows={tableRows}
          columns={COLUMNS}
          rowKey="action_item_id"
          noun="Action Items"
          initialSort={{ key: "severity", direction: "asc" }}
          renderExpanded={(row) => (
            <Explainer
              bundle={ctx.bundle}
              registryId={row.registry ?? ACTION_ITEMS_OPEN_ID}
              asOf={row.updated_at}
              facts={[
                { label: "Action", value: row.title },
                { label: "Owner", value: row.owner },
                { label: "Finding", value: row.finding_ref ?? "no finding reference stored" },
                { label: "Listing", value: row.listing_id ?? "not tied to one listing" },
              ]}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
