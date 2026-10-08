"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ListingCurrentRow } from "@/lib/dashboard-v2/data/types";
import { formatReading, formatUsd } from "@/lib/dashboard-v2/reading/format";
import { codesOf } from "@/lib/dashboard-v2/reading/labels";
import { coverageLine } from "@/lib/dashboard-v2/reading/lines";
import { FEATURED_OFFER_SUPPRESSED_ID } from "@/lib/dashboard-v2/selectors/featured-offer";
import { PRICE_GAP_ID, selectPriceGapAboveBenchmark, type PriceGap } from "@/lib/dashboard-v2/selectors/price-gap";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows, type RemoteRows } from "../useApiRows";

type GapTableRow = Record<string, unknown> & {
  listing_id: string;
  asin: string;
  title: string | null;
  offer_price: number;
  benchmark: number;
  gap: number;
  read_at: string | null;
  match: string[] | null;
  [STATUS_KEY]: RowStatus;
};

const GAP_COLUMNS: ColumnDef[] = [
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text", truncate: true },
  { key: "offer_price", label: "Offer price", type: "usd" },
  { key: "benchmark", label: "Benchmark", type: "usd" },
  { key: "gap", label: "Price gap", type: "usd" },
  { key: "match", label: "Benchmark match", type: "enum", labelKind: "channel", order: codesOf("channel") },
  { key: "read_at", label: "Read at", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

/** The suppressed listings and the price gap recomputed from them through the selector. */
export function usePriceGapLines(ctx: SpokeRenderContext): { state: RemoteRows<ListingCurrentRow>; gap: PriceGap } {
  const state = useApiRows<ListingCurrentRow>("/api/dashboard-v2/listings?suppressed=1");
  const gap = useMemo(() => selectPriceGapAboveBenchmark(ctx.bundle, state.rows), [ctx.bundle, state.rows]);
  return { state, gap };
}

export function PriceGapLinesTable({ ctx }: { ctx: SpokeRenderContext }) {
  const { state, gap } = usePriceGapLines(ctx);
  const gapRows = useMemo<GapTableRow[]>(
    () =>
      gap.lines.map((line) => ({
        listing_id: line.listingId,
        asin: line.asin,
        title: line.title,
        offer_price: line.offerPrice,
        benchmark: line.benchmark,
        gap: line.gap,
        read_at: line.readAt,
        match: line.benchmarkMatchChannels.length ? line.benchmarkMatchChannels : null,
        [STATUS_KEY]: "complete",
      })),
    [gap.lines],
  );

  return (
    <div className="dv2-money">
      <p className="dv2-spoke-note">
        Stored sum: {formatReading(gap.reading, "usd")}. A price gap, not revenue.
        {gap.linesTotal !== null && state.status === "ready" ? ` Sum of the lines below: ${formatUsd(gap.linesTotal)}.` : ""}
      </p>
      <RemoteTable state={{ ...state, rows: gapRows }} noun="suppressed listings">
        {(tableRows) => (
          <DataTable<GapTableRow>
            rows={tableRows}
            columns={GAP_COLUMNS}
            rowKey="listing_id"
            noun="suppressed listings"
            initialSort={{ key: "gap", direction: "desc" }}
            renderExpanded={(row) => (
              <Explainer
                all={ctx.all}
                target={{
                  registryId: PRICE_GAP_ID,
                  asOf: row.read_at,
                  runId: gap.reading.coverage?.runId ?? null,
                  facts: [
                    { label: "Title", value: row.title ?? "no title stored" },
                    { label: "Finding", value: ctx.all.details[FEATURED_OFFER_SUPPRESSED_ID]?.registry?.name ?? "unavailable" },
                    { label: "Coverage", value: coverageLine(gap.reading) },
                  ],
                  listing: {
                    listingId: row.listing_id,
                    asin: row.asin,
                    benchmarkCents: Math.round(row.benchmark * 100),
                    offerCents: Math.round(row.offer_price * 100),
                    suppressed: true,
                  },
                }}
              />
            )}
          />
        )}
      </RemoteTable>
    </div>
  );
}
