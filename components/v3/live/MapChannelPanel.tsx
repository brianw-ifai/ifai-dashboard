"use client";

import { useEffect, useState } from "react";
import { listingChannelPricesQuery, listingsQuery } from "@/lib/canvasData";
import { formatInt, formatUsd, pendingLabel } from "@/lib/fender-canvas/format";
import {
  channelPriceLookup,
  listingLabel,
  mapTabModel,
  type ChannelPriceRow,
  type MapSourceRow,
  type MapTabModel,
} from "@/lib/fender-canvas/map-channels";

const PAGE_SIZE = 1000;

function amazonHref(asin: string): string | null {
  return /^[A-Z0-9]{10}$/.test(asin) ? `https://www.amazon.com/dp/${asin}` : null;
}

function httpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function loadMapRows(): Promise<MapSourceRow[]> {
  const rows: MapSourceRow[] = [];
  for (let page = 0; page < 20; page += 1) {
    const { data, error } = await listingsQuery(page, PAGE_SIZE, { violationsOnly: true });
    if (error) throw error;
    const batch = (data ?? []) as MapSourceRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
  throw new Error("Below-MAP rows are not available.");
}

async function loadChannelPrices(): Promise<ChannelPriceRow[]> {
  try {
    const rows: ChannelPriceRow[] = [];
    for (let page = 0; page < 20; page += 1) {
      const { data, error } = await listingChannelPricesQuery(page, PAGE_SIZE);
      if (error) return page === 0 ? [] : rows;
      const batch = (data ?? []) as ChannelPriceRow[];
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) return rows;
    }
    return rows;
  } catch {
    return [];
  }
}

function columnCount(model: MapTabModel): number {
  return (
    4 +
    Number(model.showAmazon) +
    Number(model.showWalmart) +
    Number(model.showMusiciansFriend) +
    model.extraChannels.length
  );
}

function mapDefinition() {
  return (
    <div className="ceo-callout">
      <div className="ceo-callout-header">
        <span>What is MAP?</span>
      </div>
      <div className="ceo-callout-body">
        <strong>MAP</strong> (Minimum Advertised Price) is the lowest price a retail partner agrees
        to display publicly.
      </div>
    </div>
  );
}

export function MapChannelPanel() {
  const [rows, setRows] = useState<MapSourceRow[] | null>(null);
  const [channelPrices, setChannelPrices] = useState<ChannelPriceRow[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMapRows(), loadChannelPrices()])
      .then(([nextRows, nextPrices]) => {
        if (!cancelled) {
          setRows(nextRows);
          setChannelPrices(nextPrices);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <>
        {mapDefinition()}
        <div className="content-box" style={{ marginTop: 12 }}>
          <div className="content-box-title">Summary</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "12px 0 0" }}>
            Below-MAP rows are not available.
          </p>
        </div>
      </>
    );
  }

  if (!rows) {
    return (
      <>
        {mapDefinition()}
        <div className="content-box" style={{ marginTop: 12 }}>
          <div className="content-box-title">Summary</div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Loading MAP rows…</p>
        </div>
      </>
    );
  }

  const model = mapTabModel(rows, channelPrices);
  const prices = channelPriceLookup(channelPrices);
  const summaryChannels = [
    ...model.channels.map((channel) => ({
      key: channel.name,
      name: channel.name,
      count: channel.count,
    })),
    ...model.extraChannels.map((channel) => ({
      key: channel.channel,
      name: channel.name,
      count: channel.count,
    })),
  ];

  return (
    <>
      {mapDefinition()}

      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">Summary</div>
        <div className="metric-grid-2" style={{ marginTop: 8 }}>
          <div className="metric-card-sm">
            <span className="metric-card-label">Listings under MAP</span>
            <div className="metric-card-val" style={{ color: "var(--danger-red)" }}>
              {formatInt(model.count)}
            </div>
            <span className="metric-card-sub">Rows returned by this read</span>
          </div>
          <div className="metric-card-sm">
            <span className="metric-card-label">Gap</span>
            <div className="metric-card-val" style={{ color: "var(--danger-red)" }}>
              {formatUsd(model.averageGap, { signed: true })}
            </div>
            <span className="metric-card-sub">
              Average worst leakage · {formatUsd(model.combinedGap, { signed: true })} combined
            </span>
          </div>
        </div>
        {summaryChannels.length ? (
          <ul className="tour-card-list" style={{ margin: "12px 0 0" }}>
            {summaryChannels.map((channel) => (
              <li key={channel.key}>
                <strong>{channel.name}</strong> · {formatInt(channel.count)}{" "}
                {channel.count === 1 ? "listing" : "listings"}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="content-box-title" style={{ marginTop: 14 }}>
          Listings
        </div>
        <div style={{ overflow: "auto", maxHeight: 520, marginTop: 12 }}>
          <table className="table-sm">
            <thead>
              <tr>
                <th>Listing</th>
                <th>ASIN</th>
                <th>MAP</th>
                {model.showAmazon ? <th>Amazon</th> : null}
                <th>Gap</th>
                {model.showWalmart ? <th>Walmart</th> : null}
                {model.showMusiciansFriend ? <th>Musician&apos;s Friend</th> : null}
                {model.extraChannels.map((channel) => (
                  <th key={channel.channel}>{channel.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount(model)}>No active offers are under MAP.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const href = amazonHref(row.asin);
                  const walmartUrl = httpUrl(row.wmt_url);
                  return (
                    <tr key={row.asin}>
                      <td>
                        <strong>{listingLabel(row)}</strong>
                      </td>
                      <td>
                        {href ? (
                          <a
                            className="listing-link"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="asin-chip">{row.asin}</span>
                          </a>
                        ) : (
                          <span className="asin-chip">{row.asin}</span>
                        )}
                      </td>
                      <td>{row.map_price != null ? formatUsd(row.map_price) : pendingLabel()}</td>
                      {model.showAmazon ? (
                        <td>
                          {row.offer_price != null ? formatUsd(row.offer_price) : pendingLabel()}
                        </td>
                      ) : null}
                      <td style={{ color: "var(--danger-red)", fontWeight: 700 }}>
                        {formatUsd(row.worst_leakage, { signed: true })}
                      </td>
                      {model.showWalmart ? (
                        <td>
                          {row.wmt_price != null ? (
                            <>
                              {formatUsd(row.wmt_price)}
                              {walmartUrl ? (
                                <>
                                  {" "}
                                  <a
                                    className="listing-link channel-tag channel-wmt"
                                    href={walmartUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Walmart
                                  </a>
                                </>
                              ) : null}
                            </>
                          ) : null}
                        </td>
                      ) : null}
                      {model.showMusiciansFriend ? (
                        <td>
                          {row.mf_price != null ? (
                            <>
                              {formatUsd(row.mf_price)}
                              {row.mf_leakage != null
                                ? ` (${formatUsd(row.mf_leakage, { signed: true })})`
                                : ""}
                            </>
                          ) : null}
                        </td>
                      ) : null}
                      {model.extraChannels.map((channel) => {
                        const cell = prices.get(row.asin)?.get(channel.channel);
                        const channelHref = cell ? httpUrl(cell.url) : null;
                        return (
                          <td key={channel.channel}>
                            {cell ? (
                              <>
                                {formatUsd(cell.price)}
                                {channelHref ? (
                                  <>
                                    {" "}
                                    <a
                                      className={
                                        channel.channel === "reverb"
                                          ? "listing-link channel-tag channel-rev"
                                          : "listing-link channel-tag"
                                      }
                                      href={channelHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {channel.name}
                                    </a>
                                  </>
                                ) : null}
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
