"use client";

import { Fragment, useEffect, useState } from "react";
import { DefinedTerm } from "@/components/v3/live/DefinedTerm";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { NewTag, SourceTag, type DataSource } from "@/components/v3/live/SourceTag";
import { StockLossHero } from "@/components/v3/live/StockLossHero";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { formatInt, formatUsd } from "@/lib/fender-canvas/format";
import {
  amazonHref,
  baselineInput,
  defaultStockLossOrder,
  EPISODE_STATE_LABELS,
  formatDay,
  keepaHref,
  loadStockLossRows,
  lostSales,
  noBuyBoxAtRisk,
  notEstimatedReason,
  num,
  stockEpisodesQuery,
  type StockEpisode,
  type StockLossRow,
} from "@/lib/fender-canvas/stock-loss";
import type { SortInput } from "@/lib/fender-canvas/table-sort";

function sourced(name: string, ...sources: DataSource[]) {
  return (
    <span className="sourced-label">
      {name}
      {sources.map((source) => (
        <SourceTag key={source} source={source} />
      ))}
    </span>
  );
}

const STOCK_LOSS_COLUMNS: RetailColumn[] = [
  { id: "listing", name: "Listing", label: "Listing", width: 260, minWidth: 160, sort: "text" },
  {
    id: "lost",
    name: "Est. lost sales, 12 months",
    label: sourced("Est. lost sales, 12 months", "Estimate"),
    width: 210,
    minWidth: 150,
    className: "money",
    sort: "number",
  },
  {
    id: "oos365",
    name: "Out-of-stock days, 12 months",
    label: sourced("Out-of-stock days, 12 months", "Keepa"),
    width: 210,
    minWidth: 150,
    sort: "number",
  },
  {
    id: "oos90",
    name: "Out-of-stock days, 90 days",
    label: sourced("Out-of-stock days, 90 days", "Keepa"),
    width: 200,
    minWidth: 140,
    sort: "number",
  },
  {
    id: "rate",
    name: "Sales per in-stock day",
    label: sourced("Sales per in-stock day", "SmartScout", "Keepa"),
    width: 250,
    minWidth: 170,
    className: "money",
    sort: "number",
  },
  {
    id: "nobb",
    name: "No Buy Box days, 12 months",
    label: sourced("No Buy Box days, 12 months", "Keepa"),
    width: 210,
    minWidth: 150,
    sort: "number",
  },
];

function sortValue(row: StockLossRow, columnId: string): SortInput {
  if (columnId === "listing") return (row.title ?? row.asin).trim() || null;
  if (columnId === "lost") return lostSales(row);
  if (columnId === "oos365") return num(row.oos_days_365);
  if (columnId === "oos90") return num(row.oos_days_90);
  if (columnId === "rate") return row.baseline_method ? num(row.baseline_daily_revenue) : null;
  if (columnId === "nobb") return num(row.suppressed_days_365);
  return null;
}

function Explanation() {
  return (
    <div className="ceo-callout" style={{ marginTop: 12 }}>
      <div className="ceo-callout-header">
        <span>What does an out-of-stock day cost?</span>
      </div>
      <div className="ceo-callout-body">
        A listing is out of stock on a day when no seller has a new one for sale on Amazon, so
        shoppers cannot buy it there. The estimate takes the listing&apos;s sales from{" "}
        <DefinedTerm term="SmartScout" />, divides by the days it was in stock according to{" "}
        <DefinedTerm term="Keepa" />, and multiplies by the days it was not. It is an analyst
        estimate, not reported sales. Fender sells through dealers, so the data shows that a
        listing ran out but not whether Fender or the dealer did.
      </div>
    </div>
  );
}

function EpisodeList({ asin }: { asin: string }) {
  const [state, setState] = useState<"loading" | "unavailable" | StockEpisode[]>("loading");

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(stockEpisodesQuery(asin))
      .then(({ data, error }) => {
        if (cancelled) return;
        setState(error ? "unavailable" : ((data ?? []) as StockEpisode[]));
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [asin]);

  if (state === "loading") return <p className="retail-missing">Loading the dated stretches…</p>;
  if (state === "unavailable") {
    return <p className="retail-missing">The dated stretches could not be loaded.</p>;
  }
  if (state.length === 0) {
    return <p className="retail-missing">No out-of-stock or no-Buy-Box stretch in the last 12 months.</p>;
  }
  return (
    <table className="stock-episodes">
      <thead>
        <tr>
          <th>What happened</th>
          <th>Started</th>
          <th>Ended</th>
          <th>Days</th>
        </tr>
      </thead>
      <tbody>
        {state.map((episode) => (
          <tr key={`${episode.state}-${episode.start_day}`} data-episode-state={episode.state}>
            <td>{EPISODE_STATE_LABELS[episode.state]}</td>
            <td>{formatDay(episode.start_day)}</td>
            <td>{episode.ongoing ? "Still going" : formatDay(episode.end_day)}</td>
            <td>{formatInt(episode.days)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EstimateInputs({ row }: { row: StockLossRow }) {
  const input = baselineInput(row);
  const rate = num(row.baseline_daily_revenue);
  const oos = num(row.oos_days_365);
  const nobb = num(row.suppressed_days_365);
  const lost = lostSales(row);
  const atRisk = noBuyBoxAtRisk(row);
  const keepa = keepaHref(row.asin);
  const amazon = amazonHref(row.asin);

  return (
    <div className="stock-loss-drawer" data-stock-loss-drawer={row.asin}>
      <div className="stock-loss-inputs">
        <h4>How this estimate is built</h4>
        {row.baseline_method ? (
          <ol>
            <li>
              {input.label}: <strong>{formatUsd(input.value)}</strong> <SourceTag source="SmartScout" />
            </li>
            <li>
              Days in stock in that window: <strong>{formatInt(input.days)}</strong> <SourceTag source="Keepa" />
            </li>
            <li>
              Sales per in-stock day: {formatUsd(input.value)} ÷ {formatInt(input.days)} ={" "}
              <strong>{formatUsd(rate)}</strong>
            </li>
            <li>
              Out-of-stock days, last 12 months: <strong>{formatInt(oos)}</strong> <SourceTag source="Keepa" />
            </li>
            <li>
              Estimated lost sales: {formatUsd(rate)} × {formatInt(oos)} = <strong>{formatUsd(lost)}</strong>{" "}
              <SourceTag source="Estimate" />
            </li>
            {nobb ? (
              <li>
                No Buy Box days: {formatInt(nobb)}. Sales still happen without a Buy Box, just fewer, so
                this is at most {formatUsd(atRisk)} and is not added to the estimate above.
              </li>
            ) : null}
          </ol>
        ) : (
          <p className="retail-missing">
            Not estimated. {notEstimatedReason(row)} The out-of-stock days below are still from Keepa.
          </p>
        )}
        <p className="stock-loss-sources">
          Keepa history through {formatDay(row.history_through) ?? "an unknown date"}
          {row.smartscout_snapshot_date
            ? `. SmartScout read ${formatDay(row.smartscout_snapshot_date)}.`
            : "."}{" "}
          {keepa ? (
            <a href={keepa} target="_blank" rel="noopener noreferrer">
              Open the Keepa chart
            </a>
          ) : null}
          {keepa && amazon ? " · " : null}
          {amazon ? (
            <a href={amazon} target="_blank" rel="noopener noreferrer">
              Open the Amazon listing
            </a>
          ) : null}
        </p>
      </div>
      <div className="stock-loss-episodes">
        <h4>
          Dated stretches, last 12 months <SourceTag source="Keepa" />
        </h4>
        <EpisodeList asin={row.asin} />
      </div>
    </div>
  );
}

export function StockLossPanel() {
  const [state, setState] = useState<
    "loading" | "unavailable" | { rows: StockLossRow[]; liveCount: number | null }
  >("loading");
  const [openAsin, setOpenAsin] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStockLossRows()
      .then((next) => {
        if (cancelled) return;
        setState(next.available ? { rows: defaultStockLossOrder(next.rows), liveCount: next.liveCount } : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = typeof state === "object" ? state.rows : null;
  const sorted = useClientTableSort(rows ?? [], STOCK_LOSS_COLUMNS, sortValue);

  return (
    <div className="stock-loss retail-surface">
      {state === "loading" ? <p className="retail-missing">Loading the stock history…</p> : null}
      {state === "unavailable" ? (
        <p className="retail-missing">The stock history could not be loaded.</p>
      ) : null}
      {rows && typeof state === "object" ? (
        <StockLossHero rows={rows} liveCount={state.liveCount} />
      ) : null}
      <Explanation />
      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">
          <span className="stock-loss-title">
            Out of stock and lost sales
            <NewTag />
          </span>
          {rows ? <span className="tag-badge tag-neutral">{formatInt(rows.length)} listings</span> : null}
        </div>
        {rows && typeof state === "object" ? (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "8px 0" }}>
              Select a listing to see the inputs behind its estimate and the dates it was out of stock.
            </p>
            <ResizableTable
              tableId="stock-loss"
              columns={STOCK_LOSS_COLUMNS}
              freezeHeader
              maxHeight={560}
              sort={sorted.sort}
              onSort={sorted.onSort}
            >
              <tbody>
                {sorted.rows.length === 0 ? (
                  <tr>
                    <td colSpan={STOCK_LOSS_COLUMNS.length}>
                      No live listing was out of stock or without a Buy Box in the last 12 months.
                    </td>
                  </tr>
                ) : (
                  sorted.rows.map((row) => {
                    const open = openAsin === row.asin;
                    const lost = lostSales(row);
                    const toggle = () => setOpenAsin(open ? null : row.asin);
                    return (
                      <Fragment key={row.asin}>
                        <tr
                          className="stock-loss-row"
                          data-asin={row.asin}
                          aria-expanded={open}
                          tabIndex={0}
                          onClick={toggle}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            toggle();
                          }}
                        >
                          <td>
                            <strong>{row.title ?? row.asin}</strong>
                            <br />
                            <span className="asin-chip">{row.asin}</span>
                          </td>
                          <td className="money">
                            {lost != null ? formatUsd(lost) : <span className="fo-note">Not estimated</span>}
                          </td>
                          <td>{formatInt(num(row.oos_days_365) ?? 0)}</td>
                          <td>{formatInt(num(row.oos_days_90) ?? 0)}</td>
                          <td className="money">
                            {row.baseline_method ? (
                              formatUsd(num(row.baseline_daily_revenue))
                            ) : (
                              <span className="fo-note">Not estimated</span>
                            )}
                          </td>
                          <td>{formatInt(num(row.suppressed_days_365) ?? 0)}</td>
                        </tr>
                        {open ? (
                          <tr className="stock-loss-detail">
                            <td colSpan={STOCK_LOSS_COLUMNS.length}>
                              <EstimateInputs row={row} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </ResizableTable>
          </>
        ) : null}
      </div>
    </div>
  );
}
