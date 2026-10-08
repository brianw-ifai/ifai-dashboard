"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ListingCurrentRow } from "@/lib/dashboard-v2/data/types";
import { formatUsd } from "@/lib/dashboard-v2/reading/format";
import { FEATURED_OFFER_PRESENT_ID, FEATURED_OFFER_SUPPRESSED_ID } from "@/lib/dashboard-v2/selectors/featured-offer";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

type ListingTableRow = Record<string, unknown> & {
  listing_id: string;
  asin: string;
  title: string | null;
  category: string | null;
  offer_status: string | null;
  seller_class: string | null;
  seller_name: string | null;
  featured_offer_withheld: boolean | null;
  offer_price: number | null;
  benchmark: number | null;
  suppressed: boolean | null;
  walmart_price: number | null;
  musiciansfriend_price: number | null;
  read_at: string | null;
  benchmark_run_id: string | null;
  offer_price_cents: number | null;
  competitive_external_price_cents: number | null;
  benchmark_match_channels: string[] | null;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "category", label: "Category", type: "enum" },
  { key: "offer_status", label: "Offer status", type: "enum" },
  { key: "seller_class", label: "Seller class", type: "enum" },
  { key: "seller_name", label: "Seller", type: "text" },
  { key: "featured_offer_withheld", label: "Featured Offer withheld", type: "boolean" },
  { key: "offer_price", label: "Offer price", type: "usd" },
  { key: "benchmark", label: "Benchmark", type: "usd" },
  { key: "suppressed", label: "Suppressed", type: "boolean" },
  { key: "walmart_price", label: "Walmart price", type: "usd" },
  { key: "musiciansfriend_price", label: "Musician's Friend price", type: "usd" },
  { key: "read_at", label: "Read at", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

/** A row is complete when both its seller and benchmark reads exist, partial with one, unavailable with none. */
function rowStatus(row: ListingCurrentRow): RowStatus {
  const reads = [row.seller_read_at, row.benchmark_read_at].filter(Boolean).length;
  if (reads === 2) return "complete";
  if (reads === 1) return "partial";
  return "unavailable";
}

export function toListingTableRow(row: ListingCurrentRow): ListingTableRow {
  return {
    listing_id: row.listing_id,
    asin: row.asin,
    title: row.title,
    category: row.category,
    offer_status: row.offer_status,
    seller_class: row.seller_class,
    seller_name: row.featured_offer_seller_name,
    featured_offer_withheld: row.featured_offer_withheld,
    offer_price: row.offer_price,
    benchmark: row.competitive_external_price_cents === null ? null : row.competitive_external_price_cents / 100,
    suppressed: row.suppressed,
    walmart_price: row.walmart_price,
    musiciansfriend_price: row.musiciansfriend_price,
    read_at: row.benchmark_read_at,
    benchmark_run_id: row.benchmark_run_id,
    offer_price_cents: row.offer_price_cents,
    competitive_external_price_cents: row.competitive_external_price_cents,
    benchmark_match_channels: row.benchmark_match_channels,
    [STATUS_KEY]: rowStatus(row),
  };
}

export function ListingsTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<ListingCurrentRow>("/api/dashboard-v2/listings");
  const rows = useMemo(() => state.rows.map(toListingTableRow), [state.rows]);

  return (
    <RemoteTable state={{ ...state, rows }} noun="listings">
      {(tableRows) => (
        <DataTable<ListingTableRow>
          rows={tableRows}
          columns={COLUMNS}
          rowKey="listing_id"
          noun="listings"
          initialSort={{ key: "suppressed", direction: "desc" }}
          renderExpanded={(row) => (
            <Explainer
              bundle={ctx.bundle}
              registryId={row.suppressed ? FEATURED_OFFER_SUPPRESSED_ID : FEATURED_OFFER_PRESENT_ID}
              asOf={row.read_at}
              runId={row.benchmark_run_id}
              facts={[
                { label: "Seller", value: row.seller_name ?? (row.seller_class ?? "not read") },
                {
                  label: "Benchmark match",
                  value: row.benchmark_match_channels?.length ? row.benchmark_match_channels.join(", ") : "no stored outside price equals the benchmark",
                },
                { label: "Listed price", value: row.offer_price === null ? "unavailable" : formatUsd(row.offer_price) },
              ]}
              listing={{
                listingId: row.listing_id,
                asin: row.asin,
                benchmarkCents: row.competitive_external_price_cents,
                offerCents: row.offer_price_cents,
                suppressed: row.suppressed === true,
              }}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
