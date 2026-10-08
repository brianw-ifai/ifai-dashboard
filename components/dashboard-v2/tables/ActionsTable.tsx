"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ActionItemRow } from "@/lib/dashboard-v2/data/types";
import { codesOf, labelFor } from "@/lib/dashboard-v2/reading/labels";
import { ACTION_ITEMS_OPEN_ID, actionRegistryId } from "@/lib/dashboard-v2/selectors/actions";
import { registryFor } from "@/lib/dashboard-v2/selectors/index";
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
  registry_name: string | null;
  listing_id: string | null;
  finding_ref: string | null;
  created_at: string;
  updated_at: string;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "title", label: "Title", type: "text", truncate: true },
  { key: "owner", label: "Owner", type: "enum", labelKind: "action_owner", order: codesOf("action_owner") },
  { key: "status", label: "Status", type: "enum", labelKind: "action_status", order: codesOf("action_status") },
  { key: "severity", label: "Severity", type: "enum", labelKind: "severity", order: codesOf("severity") },
  { key: "registry_name", label: "Reading", type: "enum" },
  { key: "listing_id", label: "Listing", type: "text" },
  { key: "created_at", label: "Created", type: "date" },
  { key: STATUS_KEY, label: "Row", type: "status", sortable: false },
];

export function ActionsTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<ActionItemRow>("/api/dashboard-v2/actions");
  const rows = useMemo<ActionTableRow[]>(
    () =>
      state.rows.map((row) => {
        const registry = actionRegistryId(ctx.bundle, row);
        return {
          action_item_id: row.action_item_id,
          title: row.title,
          owner: row.owner,
          status: row.status,
          severity: row.severity,
          registry,
          registry_name: registry ? (registryFor(ctx.all, registry)?.name ?? registry.replace(/_/g, " ")) : null,
          listing_id: row.listing_id,
          finding_ref: row.finding_ref,
          created_at: row.created_at,
          updated_at: row.updated_at,
          [STATUS_KEY]: "complete",
        };
      }),
    [state.rows, ctx.bundle, ctx.all],
  );

  return (
    <RemoteTable state={{ ...state, rows }} noun="Action Items">
      {(tableRows) => (
        <DataTable<ActionTableRow>
          rows={tableRows}
          columns={COLUMNS}
          rowKey="action_item_id"
          noun="Action Items"
          initialSort={[
            { key: "severity", direction: "asc" },
            { key: "created_at", direction: "asc" },
          ]}
          renderExpanded={(row) => (
            <Explainer
              all={ctx.all}
              target={{
                registryId: row.registry ?? ACTION_ITEMS_OPEN_ID,
                asOf: row.updated_at,
                facts: [
                  { label: "Action", value: row.title },
                  { label: "Owner", value: labelFor("action_owner", row.owner) },
                  { label: "Status", value: labelFor("action_status", row.status) },
                  { label: "Severity", value: labelFor("severity", row.severity) },
                  { label: "Finding", value: row.finding_ref ?? "no finding reference stored" },
                  { label: "Listing", value: row.listing_id ?? "not tied to one listing" },
                ],
              }}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
