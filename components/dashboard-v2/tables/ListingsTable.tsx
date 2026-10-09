"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ListingCurrentRow } from "@/lib/dashboard-v2/data/types";
import { formatUsd, UNAVAILABLE_WORD } from "@/lib/dashboard-v2/reading/format";
import { codesOf, labelFor } from "@/lib/dashboard-v2/reading/labels";
import { FEATURED_OFFER_PRESENT_ID, FEATURED_OFFER_SUPPRESSED_ID } from "@/lib/dashboard-v2/selectors/featured-offer";
import { gapCents } from "@/lib/dashboard-v2/selectors/price-gap";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

export type ListingTableRow = Record<string, unknown> & {
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
  price_gap: number | null;
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

export const LISTING_COLUMNS: ColumnDef[] = [
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text", truncate: true },
  { key: "category", label: "Category", type: "enum" },
  { key: "offer_status", label: "Offer status", type: "enum", labelKind: "offer_status", order: codesOf("offer_status") },
  { key: "seller_class", label: "Seller class", type: "enum", labelKind: "seller_class", order: codesOf("seller_class") },
  { key: "seller_name", label: "Seller", type: "text" },
  { key: "featured_offer_withheld", label: "Featured Offer withheld", type: "boolean" },
  { key: "offer_price", label: "Offer price", type: "usd" },
  { key: "benchmark", label: "Benchmark", type: "usd" },
  { key: "price_gap", label: "Price gap", type: "usd" },
  { key: "suppressed", label: "Suppressed", type: "boolean" },
  { key: "walmart_price", label: "Walmart price", type: "usd" },
  { key: "musiciansfriend_price", label: "Musician's Friend price", type: "usd" },
  { key: "read_at", label: "Read at", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

/** A row is complete when both its seller and benchmark reads exist, partial with one, unavailable with none. */
export function listingRowStatus(row: ListingCurrentRow): RowStatus {
  const reads = [row.seller_read_at, row.benchmark_read_at].filter(Boolean).length;
  if (reads === 2) return "complete";
  if (reads === 1) return "partial";
  return "unavailable";
}

export function toListingTableRow(row: ListingCurrentRow): ListingTableRow {
  const gap = row.suppressed === true ? gapCents(row) : null;
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
    price_gap: gap === null ? null : gap / 100,
    suppressed: row.suppressed,
    walmart_price: row.walmart_price,
    musiciansfriend_price: row.musiciansfriend_price,
    read_at: row.benchmark_read_at,
    benchmark_run_id: row.benchmark_run_id,
    offer_price_cents: row.offer_price_cents,
    competitive_external_price_cents: row.competitive_external_price_cents,
    benchmark_match_channels: row.benchmark_match_channels,
    [STATUS_KEY]: listingRowStatus(row),
  };
}

export function ListingsTable({ ctx, suppressedOnly = false }: { ctx: SpokeRenderContext; suppressedOnly?: boolean }) {
  const state = useApiRows<ListingCurrentRow>(suppressedOnly ? { resource: "listings", params: { suppressed: 1 } } : { resource: "listings" });
  const rows = useMemo(() => state.rows.map(toListingTableRow), [state.rows]);
  const noun = suppressedOnly ? "suppressed listings" : "listings";

  return (
    <RemoteTable state={{ ...state, rows }} noun={noun}>
      {(tableRows) => (
        <DataTable<ListingTableRow>
          rows={tableRows}
          columns={LISTING_COLUMNS}
          rowKey="listing_id"
          noun={noun}
          initialSort={[
            { key: "suppressed", direction: "desc" },
            { key: "price_gap", direction: "desc" },
          ]}
          renderExpanded={(row) => (
            <Explainer
              all={ctx.all}
              target={{
                registryId: row.suppressed ? FEATURED_OFFER_SUPPRESSED_ID : FEATURED_OFFER_PRESENT_ID,
                asOf: row.read_at,
                runId: row.benchmark_run_id,
                facts: [
                  { label: "Title", value: row.title ?? "no title stored" },
                  { label: "Seller", value: row.seller_name ?? labelFor("seller_class", row.seller_class) },
                  {
                    label: "Benchmark match",
                    value: row.benchmark_match_channels?.length
                      ? row.benchmark_match_channels.map((c) => labelFor("channel", c)).join(", ")
                      : "no stored outside price equals the benchmark",
                  },
                  { label: "Listed price", value: row.offer_price === null ? UNAVAILABLE_WORD : formatUsd(row.offer_price) },
                ],
                listing: {
                  listingId: row.listing_id,
                  asin: row.asin,
                  benchmarkCents: row.competitive_external_price_cents,
                  offerCents: row.offer_price_cents,
                  suppressed: row.suppressed === true,
                },
              }}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
