"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ListingCurrentRow } from "@/lib/dashboard-v2/data/types";
import { codesOf } from "@/lib/dashboard-v2/reading/labels";
import { CHANNEL_PRICE_COVERAGE_ID } from "@/lib/dashboard-v2/selectors/channel-price-coverage";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

/**
 * One row per outside-store check on a listing, built from the listing view's per-channel
 * columns: the channel, the match, the stored price, when it was checked, and whether a link is
 * stored. A channel with no check for a listing has no row (the store was not checked).
 */

export type OutsidePriceRow = Record<string, unknown> & {
  row_id: string;
  listing_id: string;
  asin: string;
  title: string | null;
  channel: string;
  match_status: string;
  price: number | null;
  checked_at: string | null;
  url: string | null;
  link: string;
  benchmark_match: boolean;
  [STATUS_KEY]: RowStatus;
};

const COLUMNS: ColumnDef[] = [
  { key: "channel", label: "Channel", type: "enum", labelKind: "channel", order: codesOf("channel") },
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text", truncate: true },
  { key: "match_status", label: "Match", type: "enum", labelKind: "match_status", order: codesOf("match_status") },
  { key: "price", label: "Price", type: "usd" },
  { key: "benchmark_match", label: "Equals benchmark", type: "boolean" },
  { key: "link", label: "Link", type: "enum" },
  { key: "checked_at", label: "Checked at", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

type ChannelKey = "walmart" | "musiciansfriend";

export function outsidePriceRows(listings: ListingCurrentRow[]): OutsidePriceRow[] {
  const out: OutsidePriceRow[] = [];
  const channels: Array<{ key: ChannelKey; price: keyof ListingCurrentRow; url: keyof ListingCurrentRow; checked: keyof ListingCurrentRow }> = [
    { key: "walmart", price: "walmart_price", url: "walmart_url", checked: "walmart_checked_at" },
    { key: "musiciansfriend", price: "musiciansfriend_price", url: "musiciansfriend_url", checked: "musiciansfriend_checked_at" },
  ];
  for (const row of listings) {
    for (const c of channels) {
      const checked = row[c.checked] as string | null;
      const price = row[c.price] as number | null;
      if (!checked && price === null) continue;
      const url = (row[c.url] as string | null) ?? null;
      out.push({
        row_id: `${row.listing_id}:${c.key}`,
        listing_id: row.listing_id,
        asin: row.asin,
        title: row.title,
        channel: c.key,
        match_status: price === null ? "no_match" : "priced",
        price,
        checked_at: checked,
        url,
        link: url ? "link stored" : "no link stored",
        benchmark_match: (row.benchmark_match_channels ?? []).includes(c.key),
        [STATUS_KEY]: checked ? "complete" : "partial",
      });
    }
  }
  return out;
}

export function OutsidePricesTable({ ctx }: { ctx: SpokeRenderContext }) {
  const state = useApiRows<ListingCurrentRow>("/api/dashboard-v2/listings");
  const rows = useMemo(() => outsidePriceRows(state.rows), [state.rows]);
  return (
    <RemoteTable state={{ ...state, rows }} noun="outside price rows">
      {(tableRows) => (
        <DataTable<OutsidePriceRow>
          rows={tableRows}
          columns={COLUMNS}
          rowKey="row_id"
          noun="outside price rows"
          initialSort={[
            { key: "benchmark_match", direction: "desc" },
            { key: "checked_at", direction: "desc" },
          ]}
          renderExpanded={(row) => (
            <Explainer
              all={ctx.all}
              target={{
                registryId: CHANNEL_PRICE_COVERAGE_ID,
                asOf: row.checked_at,
                facts: [
                  { label: "Title", value: row.title ?? "no title stored" },
                  {
                    label: "Store link",
                    value: row.url ? (
                      <a className="dv2-channel-link" href={row.url} target="_blank" rel="noreferrer">
                        {row.url}
                      </a>
                    ) : (
                      "no link stored"
                    ),
                  },
                  { label: "Equals benchmark", value: row.benchmark_match ? "yes, this price equals Amazon's outside benchmark" : "no" },
                ],
                listing: { listingId: row.listing_id, asin: row.asin, benchmarkCents: null, offerCents: null, suppressed: false },
              }}
            />
          )}
        />
      )}
    </RemoteTable>
  );
}
