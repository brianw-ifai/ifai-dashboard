"use client";

import type { ReactNode } from "react";
import type { ListingChannelPriceRow } from "@/lib/dashboard-v2/data/types";
import { formatAsOf, formatInt, formatReading, formatUsd, isRate, UNAVAILABLE_WORD } from "@/lib/dashboard-v2/reading/format";
import { labelFor } from "@/lib/dashboard-v2/reading/labels";
import { asOfLine } from "@/lib/dashboard-v2/reading/lines";
import type { Reading } from "@/lib/dashboard-v2/reading/types";
import { runById } from "@/lib/dashboard-v2/selectors/common";
import { registryFor, type AllSelections } from "@/lib/dashboard-v2/selectors/index";
import type { PriceGapLine } from "@/lib/dashboard-v2/selectors/price-gap";
import { RemoteTable } from "./RemoteTable";
import { useApiRows } from "./useApiRows";

/**
 * The evidence behind one figure: the registry row (name, meaning, formula, source tables), the
 * reading's as-of and coverage, its inputs (numerator and denominator for a rate, each stored
 * input for an estimate, the lines that sum to a price gap), the reading run, and the source
 * links the row stores. Rendered inside ExplainerDrawer and under expanded table rows.
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

export type ExplainerTarget = {
  registryId: string;
  /** A per-row or per-dimension reading to describe instead of the registry's primary one. */
  reading?: Reading<unknown> | null;
  /** Added after the registry name, for example an engine or a seller class. */
  title?: string;
  /** The row's own as-of, ISO. */
  asOf?: string | null;
  /** The run behind the row, for its coverage line. */
  runId?: string | null;
  facts?: ExplainerFact[];
  listing?: ExplainerListing;
  /** Per-listing lines for the price gap, when the surface has loaded them. */
  priceGapLines?: PriceGapLine[];
};

export type ExplainerProps = { all: AllSelections; target: ExplainerTarget };

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

/** "fender_wins / resolved_answers" gives the two input labels; anything else falls back. */
export function rateInputLabels(formula: string | undefined): { numerator: string; denominator: string } {
  const parts = (formula ?? "").split("/");
  if (parts.length === 2) {
    const clean = (s: string) => s.replace(/^.*:/, "").replace(/[()]/g, "").replace(/_/g, " ").trim();
    const n = clean(parts[0]);
    const d = clean(parts[1]);
    if (n && d) return { numerator: n, denominator: d };
  }
  return { numerator: "numerator", denominator: "denominator" };
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
                  <td>{labelFor("channel", row.channel)}</td>
                  <td>{labelFor("match_status", row.match_status)}</td>
                  <td>{row.price === null ? UNAVAILABLE_WORD : formatUsd(row.price)}</td>
                  <td>{formatAsOf(row.checked_at)}</td>
                  <td>
                    {row.url ? (
                      <a className="dv2-channel-link" href={row.url} target="_blank" rel="noreferrer">
                        Open the {labelFor("channel", row.channel)} listing
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

function EstimateInputs({ all, registryId }: { all: AllSelections; registryId: string }) {
  const tree = all.estimates.find((e) => e.registryId === registryId);
  if (!tree) return <Row label="Inputs">{UNAVAILABLE_WORD}: no estimate row is stored</Row>;
  const byKey = new Map(tree.lines.map((l) => [l.key, l]));
  const keys = tree.inputKeys.length ? tree.inputKeys : tree.lines.map((l) => l.key);
  return (
    <>
      <Row label="Inputs">
        <table className="table-sm dv2-input-table">
          <thead>
            <tr>
              <th>Input</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Source</th>
              <th>As of</th>
              <th>Owner</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const line = byKey.get(key);
              return (
                <tr key={key} data-input-key={key} data-stored={line ? "true" : "false"}>
                  <td>{key.replace(/_/g, " ")}</td>
                  <td>{line ? formatUsd(line.value) : `${UNAVAILABLE_WORD}: not stored`}</td>
                  <td>{line ? labelFor("unit", line.unit) : "not stored"}</td>
                  <td>{line ? line.source : "not stored"}</td>
                  <td>{line ? formatAsOf(line.asOf) : "not stored"}</td>
                  <td>{line ? line.owner : "not stored"}</td>
                  <td>{line ? labelFor("confidence", line.confidence) : "not stored"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Row>
      <Row label="Sum">
        {tree.reading.status === "unavailable"
          ? `${UNAVAILABLE_WORD}: the sum shows only when every input is stored. ${tree.reading.reason}`
          : `${keys.map((k) => k.replace(/_/g, " ")).join(" + ")} = ${formatUsd(tree.reading.value)}`}
      </Row>
    </>
  );
}

function PriceGapLines({ lines }: { lines: PriceGapLine[] }) {
  const sum = lines.reduce((acc, l) => acc + Math.round(l.gap * 100), 0) / 100;
  return (
    <Row label="Lines">
      <table className="table-sm dv2-input-table">
        <thead>
          <tr>
            <th>Listing</th>
            <th>Offer</th>
            <th>Benchmark</th>
            <th>Price gap</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.listingId}>
              <td>{l.asin}</td>
              <td>{formatUsd(l.offerPrice)}</td>
              <td>{formatUsd(l.benchmark)}</td>
              <td>{formatUsd(l.gap)}</td>
            </tr>
          ))}
          <tr>
            <td>price gap, sum of {formatInt(lines.length)} lines</td>
            <td />
            <td />
            <td>{formatUsd(sum)}</td>
          </tr>
        </tbody>
      </table>
    </Row>
  );
}

export function Explainer({ all, target }: ExplainerProps) {
  const { registryId, listing } = target;
  const registry = registryFor(all, registryId);
  const reading = target.reading ?? all.readings[registryId] ?? null;
  const detail = all.details[registryId];
  const runId = target.runId ?? reading?.coverage?.runId ?? null;
  const run = runById(all.bundle, runId);
  const coverage = reading?.coverage ?? null;
  const unit = registry?.unit;
  const benchmark = listing?.benchmarkCents ?? null;
  const offer = listing?.offerCents ?? null;
  const statusWord = reading ? labelFor("reading_status", reading.status) : UNAVAILABLE_WORD;
  const isEstimate = all.estimates.some((e) => e.registryId === registryId);
  const rate = reading && reading.status !== "unavailable" && isRate(reading.value) ? reading.value : null;
  const rateLabels = rateInputLabels(registry?.formula);

  return (
    <div className="dv2-explainer" data-registry-id={registryId}>
      <h4 className="dv2-explainer-title">
        <span className="dv2-explainer-name">{registry?.name ?? `${registryId.replace(/_/g, " ")}: no registry row stored`}</span>
        {target.title ? <span className="dv2-explainer-subtitle">, {target.title}</span> : null}
      </h4>
      <dl className="dv2-explainer-list">
        <Row label="Reading">{reading ? formatReading(reading, unit) : `${UNAVAILABLE_WORD}: no selector produced this reading`}</Row>
        <Row label="Meaning">{registry?.meaning ?? UNAVAILABLE_WORD}</Row>
        <Row label="As of">{target.asOf ? formatAsOf(target.asOf) : reading ? asOfLine(reading) : UNAVAILABLE_WORD}</Row>
        <Row label="Coverage">
          {coverage
            ? `read ${formatInt(coverage.read)} of ${coverage.population === null ? "an unknown population" : formatInt(coverage.population)}, ${statusWord}`
            : reading?.status === "unavailable"
              ? `${UNAVAILABLE_WORD}: ${reading.reason}`
              : "no reading run is stored for this row"}
        </Row>
        <Row label="Formula">{registry?.formula || UNAVAILABLE_WORD}</Row>
        {rate ? (
          <Row label="Inputs">
            <span className="dv2-input-line">
              {rateLabels.numerator}: {formatInt(rate.numerator)}
            </span>
            <span className="dv2-input-line">
              {rateLabels.denominator}: {formatInt(rate.denominator)}
            </span>
            {registry?.population ? <span className="dv2-input-line">population: {registry.population}</span> : null}
          </Row>
        ) : null}
        {!rate && !isEstimate && detail && (detail.numerator !== null || detail.denominator !== null) ? (
          <Row label="Inputs">
            <span className="dv2-input-line">count: {detail.numerator === null ? UNAVAILABLE_WORD : formatInt(detail.numerator)}</span>
            <span className="dv2-input-line">population read: {detail.denominator === null ? UNAVAILABLE_WORD : formatInt(detail.denominator)}</span>
            {registry?.population ? <span className="dv2-input-line">population: {registry.population}</span> : null}
          </Row>
        ) : null}
        {isEstimate ? <EstimateInputs all={all} registryId={registryId} /> : null}
        {target.priceGapLines && target.priceGapLines.length ? <PriceGapLines lines={target.priceGapLines} /> : null}
        <Row label="Source tables">{registry?.source_tables || UNAVAILABLE_WORD}</Row>
        <Row label="Reading run">
          {run
            ? `${run.workflow_name ?? labelFor("source", run.source)}: started ${formatAsOf(run.started_at)}, finished ${formatAsOf(run.finished_at)}, ${labelFor("run_status", run.status)}`
            : "no reading run is stored for this row"}
        </Row>
        {registry ? (
          <Row label="Owner and confidence">
            {labelFor("registry_owner", registry.owner)}, {labelFor("confidence", registry.confidence)}
          </Row>
        ) : null}
        {(target.facts ?? []).map((fact) => (
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
