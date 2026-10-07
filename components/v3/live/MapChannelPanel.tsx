"use client";

import { useEffect, useState } from "react";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { listingChannelPricesQuery, listingsQuery } from "@/lib/canvasData";
import { formatInt, formatUsd, pendingLabel } from "@/lib/fender-canvas/format";
import {
  channelPriceLookup,
  listingChannelFacts,
  listingLabel,
  mapTabModel,
  type ChannelFact,
  type ChannelPriceRow,
  type MapSourceRow,
  type MapTabModel,
  type PricedChannelCell,
} from "@/lib/fender-canvas/map-channels";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import { MAP_LISTING_COLUMN_WIDTH } from "@/lib/fender-canvas/retail-column-layout";

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

function ChannelCell({ fact, href }: { fact: ChannelFact | undefined; href?: string | null }) {
  if (!fact || (fact.price == null && fact.gap == null)) return <td className="money channel-fact" />;
  const below = fact.gap != null && fact.gap < 0;
  const price = fact.price != null ? formatUsd(fact.price) : null;
  return (
    <td className="money channel-fact">
      {price != null && href ? (
        <a className="listing-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${fact.name} price ${price}`}>
          {price}
        </a>
      ) : null}
      {price != null && !href ? <span>{price}</span> : null}
      {fact.gap != null ? (
        <span className="channel-gap" style={below ? { color: "var(--danger-red)" } : undefined}>
          {formatUsd(fact.gap, { signed: true })}
        </span>
      ) : null}
    </td>
  );
}

function mapColumns(model: MapTabModel): RetailColumn[] {
  const money = (id: string, name: string, width = 164): RetailColumn => ({
    id,
    name,
    label: name,
    width,
    minWidth: 148,
    className: "money",
  });
  const columns: RetailColumn[] = [
    {
      id: "listing",
      name: "Listing",
      label: "Listing",
      width: MAP_LISTING_COLUMN_WIDTH,
      minWidth: 96,
      className: "listing-col",
    },
    { id: "asin", name: "ASIN", label: "ASIN", width: 118, minWidth: 108, className: "asin-col" },
    { id: "map", name: "MAP", label: "MAP", width: 104, minWidth: 88, className: "money" },
  ];
  if (model.showAmazon) columns.push(money("amazon", "Amazon"));
  if (model.showWalmart) columns.push(money("walmart", "Walmart"));
  if (model.showMusiciansFriend) columns.push(money("musicians-friend", "Musician's Friend", 176));
  for (const channel of model.extraChannels) {
    columns.push(money(channel.channel, channel.name));
  }
  return columns;
}

function MapReadingSummary({ read }: { read: RetailCanvasRead }) {
  if (read.phase === "loading") {
    return <p className="retail-missing">Loading the retail reading…</p>;
  }
  if (read.phase === "error") {
    return <p className="retail-missing">The retail read could not be loaded.</p>;
  }
  const reading = read.snapshot.mapLeakage;
  const showMissing = reading.status === "incomplete" || reading.status === "unavailable";
  const gap = reading.detail?.averageLeakage ?? null;
  return (
    <>
      <div className="metric-grid-2" style={{ marginTop: 8 }}>
        <div className="metric-card-sm">
          <span className="metric-card-label">Listings below MAP</span>
          <div className="metric-card-val" style={{ color: "var(--danger-red)" }}>
            {reading.issueCount == null ? "Not stored" : formatInt(reading.issueCount)}
          </div>
          <span className="metric-card-sub">Stored channel leakage below MAP</span>
        </div>
        <div className="metric-card-sm">
          <span className="metric-card-label">Average price gap</span>
          <div className="metric-card-val" style={{ color: "var(--danger-red)" }}>
            {gap == null ? "Not stored" : formatUsd(gap, { signed: true })}
          </div>
          <span className="metric-card-sub">Price gap, not revenue</span>
        </div>
      </div>
      {showMissing && reading.missingMessage ? (
        <p className="retail-missing">{reading.missingMessage}</p>
      ) : null}
    </>
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

export function MapChannelPanel({ read }: { read: RetailCanvasRead }) {
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
          <MapReadingSummary read={read} />
          <p className="retail-missing">Below-MAP rows are not available.</p>
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
          <MapReadingSummary read={read} />
          <p className="retail-missing">Loading MAP rows…</p>
        </div>
      </>
    );
  }

  const model = mapTabModel(rows, channelPrices);
  const prices = channelPriceLookup(channelPrices);
  const columns = mapColumns(model);
  const summaryChannels = [
    ...model.channels.map((channel) => ({
      key: channel.name,
      name: channel.name,
      count: channel.count,
    })),
    ...model.extraChannels
      .filter((channel) => channel.count > 0)
      .map((channel) => ({
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
        <MapReadingSummary read={read} />
        {summaryChannels.length ? (
          <ul className="tour-card-list" style={{ margin: "12px 0 0" }}>
            {summaryChannels.map((channel) => (
              <li key={channel.key}>
                <strong>{channel.name}</strong> · {formatInt(channel.count)}{" "}
                {channel.count === 1 ? "listing" : "listings"} below MAP
              </li>
            ))}
          </ul>
        ) : null}
        <div className="content-box-title" style={{ marginTop: 14 }}>
          Listings
        </div>
        <div style={{ marginTop: 12 }}>
          <ResizableTable tableId="map-listings" columns={columns} freezeHeader maxHeight={520}>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>No active offers are under MAP.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const href = amazonHref(row.asin);
                  const facts = new Map(
                    listingChannelFacts(row, prices.get(row.asin.trim())).map((fact) => [fact.key, fact]),
                  );
                  const walmartUrl = httpUrl(row.wmt_url);
                  return (
                    <tr key={row.asin}>
                      <td className="listing-col">
                        <span className="listing-title-scroll">
                          <strong>{listingLabel(row)}</strong>
                        </span>
                      </td>
                      <td className="asin-col">
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
                      <td className="money">
                        {row.map_price != null ? formatUsd(row.map_price) : pendingLabel()}
                      </td>
                      {model.showAmazon ? <ChannelCell fact={facts.get("amazon")} /> : null}
                      {model.showWalmart ? (
                        <ChannelCell fact={facts.get("walmart")} href={walmartUrl} />
                      ) : null}
                      {model.showMusiciansFriend ? (
                        <ChannelCell fact={facts.get("musicians-friend")} />
                      ) : null}
                      {model.extraChannels.map((channel) => {
                        const cell: PricedChannelCell | undefined = prices
                          .get(row.asin.trim())
                          ?.get(channel.channel);
                        return (
                          <ChannelCell
                            key={channel.channel}
                            fact={facts.get(channel.channel)}
                            href={cell ? httpUrl(cell.url) : null}
                          />
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </ResizableTable>
        </div>
      </div>
    </>
  );
}
