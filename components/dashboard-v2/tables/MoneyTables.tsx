"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/dashboard-v2/table/DataTable";
import { ContentBox } from "@/lib/canvas-sdk/Panel";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { ListingCurrentRow } from "@/lib/dashboard-v2/data/types";
import { formatReading, formatUsd, UNAVAILABLE_WORD } from "@/lib/dashboard-v2/reading/format";
import { coverageLine } from "@/lib/dashboard-v2/reading/lines";
import { FEATURED_OFFER_SUPPRESSED_ID } from "@/lib/dashboard-v2/selectors/featured-offer";
import { PRICE_GAP_ID, selectPriceGapAboveBenchmark } from "@/lib/dashboard-v2/selectors/price-gap";
import { STATUS_KEY, type ColumnDef, type RowStatus } from "@/lib/dashboard-v2/table/table-model";
import { Explainer } from "../Explainer";
import { RemoteTable } from "../RemoteTable";
import { useApiRows } from "../useApiRows";

type EstimateTableRow = Record<string, unknown> & {
  registry_id: string;
  name: string;
  formula: string;
  unit: string;
  value: number | null;
  inputs_stored: number;
  inputs_missing: number;
  as_of: string | null;
  reading_line: string;
  missing: string[];
  lines: Array<{ key: string; value: number; unit: string; source: string; asOf: string }>;
  [STATUS_KEY]: RowStatus;
};

const ESTIMATE_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Estimate", type: "text" },
  { key: "formula", label: "Formula", type: "text" },
  { key: "value", label: "Value", type: "usd" },
  { key: "inputs_stored", label: "Inputs stored", type: "number" },
  { key: "inputs_missing", label: "Inputs missing", type: "number" },
  { key: "as_of", label: "Reviewed", type: "date" },
  { key: STATUS_KEY, label: "Reading", type: "status", sortable: false },
];

type GapTableRow = Record<string, unknown> & {
  listing_id: string;
  asin: string;
  title: string | null;
  offer_price: number;
  benchmark: number;
  gap: number;
  read_at: string | null;
  match: string | null;
  [STATUS_KEY]: RowStatus;
};

const GAP_COLUMNS: ColumnDef[] = [
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "offer_price", label: "Offer price", type: "usd" },
  { key: "benchmark", label: "Benchmark", type: "usd" },
  { key: "gap", label: "Price gap", type: "usd" },
  { key: "match", label: "Benchmark match", type: "text" },
  { key: "read_at", label: "Read at", type: "date" },
];

export function MoneyTables({ ctx }: { ctx: SpokeRenderContext }) {
  const estimateRows = useMemo<EstimateTableRow[]>(
    () =>
      ctx.all.estimates.map((e) => ({
        registry_id: e.registryId,
        name: e.estimate?.name ?? e.registry?.name ?? e.registryId,
        formula: e.estimate?.formula ?? e.registry?.formula ?? UNAVAILABLE_WORD,
        unit: e.estimate?.unit ?? e.registry?.unit ?? "usd",
        value: e.reading.status === "unavailable" ? null : e.reading.value,
        inputs_stored: e.lines.length,
        inputs_missing: e.missing.length,
        as_of: e.estimate?.as_of ?? null,
        reading_line: formatReading(e.reading, "usd"),
        missing: e.missing,
        lines: e.lines,
        [STATUS_KEY]: e.reading.status,
      })),
    [ctx.all.estimates],
  );

  const state = useApiRows<ListingCurrentRow>("/api/dashboard-v2/listings?suppressed=1");
  const gap = useMemo(() => selectPriceGapAboveBenchmark(ctx.bundle, state.rows), [ctx.bundle, state.rows]);
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
        match: line.benchmarkMatchChannels.length ? line.benchmarkMatchChannels.join(", ") : null,
        [STATUS_KEY]: "complete",
      })),
    [gap.lines],
  );

  return (
    <div className="dv2-money">
      <ContentBox title="Estimates and their inputs">
        <DataTable<EstimateTableRow>
          rows={estimateRows}
          columns={ESTIMATE_COLUMNS}
          rowKey="registry_id"
          noun="estimates"
          renderExpanded={(row) => (
            <Explainer
              bundle={ctx.bundle}
              registryId={row.registry_id}
              asOf={row.as_of}
              facts={[
                { label: "Reading", value: row.reading_line },
                { label: "Missing inputs", value: row.missing.length ? row.missing.join(", ") : "none" },
                {
                  label: "Stored inputs",
                  value: row.lines.length ? (
                    <ul className="dv2-input-lines">
                      {row.lines.map((line) => (
                        <li key={line.key}>
                          {line.key}: {formatUsd(line.value)} ({line.source})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "none"
                  ),
                },
              ]}
            />
          )}
        />
      </ContentBox>
      <ContentBox title="Price gap lines">
        <p className="dv2-spoke-note">
          Stored sum: {formatReading(gap.reading, "usd")}. A price gap, not revenue.
          {gap.linesTotal !== null ? ` Sum of the lines below: ${formatUsd(gap.linesTotal)}.` : ""}
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
                  bundle={ctx.bundle}
                  registryId={PRICE_GAP_ID}
                  asOf={row.read_at}
                  runId={gap.reading.coverage?.runId ?? null}
                  facts={[
                    { label: "Finding", value: ctx.all.bundle.registry.error ? UNAVAILABLE_WORD : (ctx.all.details[FEATURED_OFFER_SUPPRESSED_ID]?.registry?.name ?? FEATURED_OFFER_SUPPRESSED_ID) },
                    { label: "Coverage", value: coverageLine(gap.reading) },
                  ]}
                  listing={{
                    listingId: row.listing_id,
                    asin: row.asin,
                    benchmarkCents: Math.round(row.benchmark * 100),
                    offerCents: Math.round(row.offer_price * 100),
                    suppressed: true,
                  }}
                />
              )}
            />
          )}
        </RemoteTable>
      </ContentBox>
    </div>
  );
}
