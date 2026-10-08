"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { SpecCurrentRow } from "@/lib/dashboard-v2/data/types";
import { SPEC_ADDITIONAL_PROPERTY_ID, SPEC_PAGE_FOUND_ID } from "@/lib/dashboard-v2/selectors/spec-readiness";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

type SpecTableRow = Record<string, unknown> & {
  listing_id: string;
  asin: string;
  title: string | null;
  category: string | null;
  amazon_checked: boolean;
  amazon_completeness_pct: number | null;
  brand_site_page_found: boolean;
  additional_property_present: boolean | null;
  read_at: string;
  reading_run_id: string;
  brand_site_url: string | null;
  amazon_missing_fields: string[] | null;
  brand_site_missing_fields: string[] | null;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text", truncate: true },
  { key: "category", label: "Category", type: "enum" },
  { key: "amazon_checked", label: "Amazon checked", type: "boolean" },
  { key: "amazon_completeness_pct", label: "Amazon fields filled", type: "percent" },
  { key: "brand_site_page_found", label: "Brand page found", type: "boolean" },
  { key: "additional_property_present", label: "additionalProperty", type: "boolean" },
  { key: "read_at", label: "Checked at", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

function toRow(row: SpecCurrentRow): SpecTableRow {
  return {
    listing_id: row.listing_id,
    asin: row.asin,
    title: row.title,
    category: row.category,
    amazon_checked: row.amazon_checked,
    amazon_completeness_pct: row.amazon_completeness_pct,
    brand_site_page_found: row.brand_site_page_found,
    additional_property_present: row.additional_property_present,
    read_at: row.read_at,
    reading_run_id: row.reading_run_id,
    brand_site_url: row.brand_site_url,
    amazon_missing_fields: row.amazon_missing_fields,
    brand_site_missing_fields: row.brand_site_missing_fields,
    [STATUS_KEY]: row.amazon_checked ? "complete" : "partial",
  };
}

export function SpecTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<SpecCurrentRow>("/api/dashboard-v2/spec");
  const rows = useMemo(() => state.rows.map(toRow), [state.rows]);

  return (
    <RemoteTable state={{ ...state, rows }} noun="checked listings">
      {(tableRows) => (
        <DataTable<SpecTableRow>
          rows={tableRows}
          columns={COLUMNS}
          rowKey="listing_id"
          noun="checked listings"
          initialSort={{ key: "read_at", direction: "desc" }}
          renderExpanded={(row) => (
            <Explainer
              all={ctx.all}
              target={{
                registryId: row.brand_site_page_found ? SPEC_ADDITIONAL_PROPERTY_ID : SPEC_PAGE_FOUND_ID,
                asOf: row.read_at,
                runId: row.reading_run_id,
                facts: [
                  { label: "Title", value: row.title ?? "no title stored" },
                  {
                    label: "Brand page",
                    value: row.brand_site_url ? (
                      <a href={row.brand_site_url} target="_blank" rel="noreferrer">
                        {row.brand_site_url}
                      </a>
                    ) : (
                      "no page found"
                    ),
                  },
                  { label: "Amazon fields missing", value: row.amazon_missing_fields?.length ? row.amazon_missing_fields.join(", ") : "none" },
                  { label: "Brand page facts missing", value: row.brand_site_missing_fields?.length ? row.brand_site_missing_fields.join(", ") : "none" },
                ],
              }}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
