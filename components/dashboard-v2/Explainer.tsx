"use client";

import type { ReactNode } from "react";
import type { ListingChannelPriceRow, SandboxBundle } from "@/lib/dashboard-v2/data/types";
import { formatAsOf, formatInt, formatUsd, UNAVAILABLE_WORD } from "@/lib/dashboard-v2/reading/format";
import { codeLabel, coverageFromRun, registryRow, runById } from "@/lib/dashboard-v2/selectors/common";
import { RemoteTable } from "./RemoteTable";
import { useApiRows } from "./useApiRows";

/**
 * The minimal explainer under an expanded table row: the registry row behind the figure, its
 * as-of and coverage, formula and source tables, and for a listing the Amazon page plus the
 * channel price rows with their links where stored. The next chunk extends this component.
 */

export type ExplainerFact = { label: string; value: ReactNode };

export type ExplainerListing = {
  listingId: string;
  asin: string;
  /** Amazon's outside benchmark in cents, when read. */
  benchmarkCents: number | null;
  offerCents: number | null;
  suppressed: boolean;
};

export type ExplainerProps = {
  bundle: SandboxBundle;
  registryId: string;
  /** The row's own as-of, ISO. */
  asOf?: string | null;
  /** The run behind the row, for its coverage line. */
  runId?: string | null;
  facts?: ExplainerFact[];
  listing?: ExplainerListing;
};

export function amazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${encodeURIComponent(asin)}`;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="dv2-explainer-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ChannelPrices({ listing }: { listing: ExplainerListing }) {
  const state = useApiRows<ListingChannelPriceRow>(`/api/dashboard-v2/channel-prices?listingId=${encodeURIComponent(listing.listingId)}`);
  return (
    <RemoteTable state={state} noun="channel price rows">
      {(rows) => (
        <table className="table-sm dv2-channel-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Match</th>
              <th>Price</th>
              <th>Checked</th>
              <th>Link</th>
              <th>Benchmark</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const matches = listing.benchmarkCents !== null && row.price_cents !== null && row.price_cents === listing.benchmarkCents;
              return (
                <tr key={row.listing_channel_price_id} data-channel={row.channel} data-benchmark-match={matches ? "true" : undefined}>
                  <td>{codeLabel(row.channel)}</td>
                  <td>{row.match_status}</td>
                  <td>{row.price === null ? UNAVAILABLE_WORD : formatUsd(row.price)}</td>
                  <td>{formatAsOf(row.checked_at)}</td>
                  <td>
                    {row.url ? (
                      <a className="dv2-channel-link" href={row.url} target="_blank" rel="noreferrer">
                        Open the {codeLabel(row.channel)} listing
                      </a>
                    ) : (
                      "no link stored"
                    )}
                  </td>
                  <td>{matches ? "equals the benchmark" : row.price_cents === null ? "no price" : "differs from the benchmark"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </RemoteTable>
  );
}

export function Explainer({ bundle, registryId, asOf, runId, facts = [], listing }: ExplainerProps) {
  const registry = registryRow(bundle, registryId);
  const run = runById(bundle, runId);
  const coverage = run ? coverageFromRun(run) : null;
  const benchmark = listing?.benchmarkCents ?? null;
  const offer = listing?.offerCents ?? null;

  return (
    <div className="dv2-explainer" data-registry-id={registryId}>
      <h4 className="dv2-explainer-title">{registry?.name ?? `${registryId}: no registry row stored`}</h4>
      <dl className="dv2-explainer-list">
        <Row label="Meaning">{registry?.meaning ?? UNAVAILABLE_WORD}</Row>
        <Row label="As of">{formatAsOf(asOf ?? coverage?.asOf ?? null)}</Row>
        <Row label="Coverage">
          {coverage
            ? `read ${formatInt(coverage.read)} of ${formatInt(coverage.population ?? coverage.read)}, ${run?.status === "partial" ? "not final" : (run?.status ?? "no run")}, ${coverage.source}`
            : "no reading run is stored for this row"}
        </Row>
        <Row label="Formula">{registry?.formula || UNAVAILABLE_WORD}</Row>
        <Row label="Source tables">{registry?.source_tables || UNAVAILABLE_WORD}</Row>
        {facts.map((fact) => (
          <Row key={fact.label} label={fact.label}>
            {fact.value}
          </Row>
        ))}
        {listing ? (
          <>
            <Row label="Amazon page">
              <a className="dv2-amazon-link" href={amazonUrl(listing.asin)} target="_blank" rel="noreferrer">
                {amazonUrl(listing.asin)}
              </a>
            </Row>
            <Row label="Offer price">{offer === null ? UNAVAILABLE_WORD : formatUsd(offer / 100)}</Row>
            <Row label="Benchmark">{benchmark === null ? UNAVAILABLE_WORD : formatUsd(benchmark / 100)}</Row>
            {listing.suppressed && offer !== null && benchmark !== null ? (
              <Row label="Price gap">{formatUsd((offer - benchmark) / 100)}</Row>
            ) : null}
          </>
        ) : null}
      </dl>
      {listing ? (
        <div className="dv2-explainer-channels">
          <p className="dv2-explainer-note">Outside prices stored for this listing. A row that equals the benchmark is the likely cause of a withheld Featured Offer.</p>
          <ChannelPrices listing={listing} />
        </div>
      ) : null}
    </div>
  );
}

export default Explainer;
