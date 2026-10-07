"use client";

import { useCallback, useEffect, useState } from "react";
import { ChannelPriceCell } from "@/components/v3/live/ChannelPriceCell";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { listingChannelPricesQuery, listingsQuery } from "@/lib/canvasData";
import { formatInt, formatUsd, pendingLabel } from "@/lib/fender-canvas/format";
import {
  channelDisplayName,
  channelPriceLookup,
  listingChannelFacts,
  type ChannelPriceRow,
  type MapSourceRow,
  type PricedChannelCell,
} from "@/lib/fender-canvas/map-channels";
import { MAP_LISTING_COLUMN_WIDTH } from "@/lib/fender-canvas/retail-column-layout";
import type { CanvasRetailListingRow } from "@/lib/fender-canvas/types";

const PAGE_SIZE = 50;
const PRICE_PAGE = 1000;
const PREFERRED_EXTRAS = ["sweetwater", "reverb"];

type Filter = {
  status?: string;
  violationsOnly?: boolean;
  bundlesOnly?: boolean;
};

function amazonHref(asin: string): string | null {
  return /^[A-Z0-9]{10}$/.test(asin) ? `https://www.amazon.com/dp/${asin}` : null;
}

function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function moneyColumn(id: string, name: string, width = 164): RetailColumn {
  return { id, name, label: name, width, minWidth: 148, className: "money" };
}

function extraChannels(prices: ChannelPriceRow[]): { channel: string; name: string }[] {
  const slugs = new Set<string>();
  for (const byChannel of channelPriceLookup(prices).values()) {
    for (const slug of byChannel.keys()) slugs.add(slug);
  }
  return [...slugs]
    .sort((a, b) => {
      const ai = PREFERRED_EXTRAS.indexOf(a);
      const bi = PREFERRED_EXTRAS.indexOf(b);
      const ao = ai === -1 ? PREFERRED_EXTRAS.length : ai;
      const bo = bi === -1 ? PREFERRED_EXTRAS.length : bi;
      if (ao !== bo) return ao - bo;
      return a.localeCompare(b);
    })
    .map((channel) => ({ channel, name: channelDisplayName(channel) }));
}

function exploreColumns(extras: { channel: string; name: string }[]): RetailColumn[] {
  return [
    {
      id: "listing",
      name: "Listing",
      label: "Listing",
      width: MAP_LISTING_COLUMN_WIDTH,
      minWidth: 96,
      className: "listing-col",
    },
    { id: "asin", name: "ASIN", label: "ASIN", width: 118, minWidth: 108, className: "asin-col" },
    { id: "partner", name: "Partner / Bundle", label: "Partner / Bundle", width: 150, minWidth: 100 },
    { id: "map", name: "MAP", label: "MAP", width: 104, minWidth: 88, className: "money" },
    moneyColumn("amazon", "Amazon"),
    moneyColumn("walmart", "Walmart"),
    moneyColumn("musicians-friend", "Musician's Friend", 176),
    ...extras.map((channel) => moneyColumn(channel.channel, channel.name)),
    { id: "reviews", name: "Reviews", label: "Reviews", width: 90, minWidth: 72 },
    { id: "channels", name: "Channels", label: "Channels", width: 120, minWidth: 80 },
  ];
}

function asMapRow(row: CanvasRetailListingRow): MapSourceRow {
  return {
    asin: row.asin,
    model_name: row.model_name,
    title: row.title,
    map_price: row.map_price,
    offer_price: row.offer_price,
    amz_leakage: row.amz_leakage ?? null,
    worst_leakage: row.worst_leakage,
    wmt_price: row.wmt_price,
    wmt_leakage: row.wmt_leakage,
    wmt_url: row.wmt_url,
    mf_price: row.mf_price,
    mf_leakage: row.mf_leakage,
  };
}

async function loadChannelPrices(): Promise<ChannelPriceRow[]> {
  try {
    const rows: ChannelPriceRow[] = [];
    for (let page = 0; page < 20; page += 1) {
      const { data, error } = await listingChannelPricesQuery(page, PRICE_PAGE);
      if (error) return page === 0 ? [] : rows;
      const batch = (data ?? []) as ChannelPriceRow[];
      rows.push(...batch);
      if (batch.length < PRICE_PAGE) return rows;
    }
    return rows;
  } catch {
    return [];
  }
}

export function FenderListingsTable() {
  const [rows, setRows] = useState<CanvasRetailListingRow[]>([]);
  const [channelPrices, setChannelPrices] = useState<ChannelPriceRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err, count } = await listingsQuery(page, PAGE_SIZE, filter);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as CanvasRetailListingRow[]);
    setTotal(count ?? null);
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    loadChannelPrices().then((next) => {
      if (!cancelled) setChannelPrices(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const extras = extraChannels(channelPrices);
  const columns = exploreColumns(extras);
  const prices = channelPriceLookup(channelPrices);
  const pages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  return (
    <div className="content-box retail-listings-table" style={{ marginTop: 12 }}>
      <div className="content-box-title">
        <span>All listings</span>
        {total != null ? (
          <span className="tag-badge tag-neutral">{formatInt(total)} rows</span>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
        <button
          type="button"
          className={`segmented-btn${!filter.violationsOnly && !filter.bundlesOnly ? " active" : ""}`}
          onClick={() => {
            setPage(0);
            setFilter({});
          }}
        >
          All
        </button>
        <button
          type="button"
          className={`segmented-btn${filter.violationsOnly ? " active" : ""}`}
          onClick={() => {
            setPage(0);
            setFilter({ violationsOnly: true });
          }}
        >
          MAP violations only
        </button>
        <button
          type="button"
          className={`segmented-btn${filter.bundlesOnly ? " active" : ""}`}
          onClick={() => {
            setPage(0);
            setFilter({ bundlesOnly: true });
          }}
        >
          Bundles only
        </button>
      </div>

      {error ? (
        <p style={{ color: "var(--danger-red)", fontSize: 12 }}>
          The listing read could not be loaded. {error}
        </p>
      ) : null}

      <ResizableTable tableId="explore-listings" columns={columns} freezeHeader maxHeight={520}>
        <tbody>
          {loading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>Loading listings…</td>
            </tr>
          ) : null}
          {!loading && !error && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No listings match this filter.</td>
            </tr>
          ) : null}
          {error && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>The listing read could not be loaded.</td>
            </tr>
          ) : null}
          {rows.map((row) => {
            const label = row.model_name?.trim() || row.title?.trim() || "Listing";
            const partner = row.bundle_name ?? row.buybox_seller_name ?? "n/a";
            const href = httpUrl(row.product_url) ?? amazonHref(row.asin);
            const facts = new Map(
              listingChannelFacts(asMapRow(row), prices.get(row.asin.trim())).map((fact) => [fact.key, fact]),
            );
            const walmartUrl = httpUrl(row.wmt_url);
            return (
              <tr key={row.asin}>
                <td className="listing-col">
                  <span className="listing-title-scroll">
                    <strong>{label}</strong>
                  </span>
                </td>
                <td className="asin-col">
                  {href ? (
                    <a
                      className="listing-link channel-tag channel-amz"
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
                <td>{partner}</td>
                <td className="money">{row.map_price != null ? formatUsd(row.map_price) : pendingLabel()}</td>
                <ChannelPriceCell fact={facts.get("amazon")} />
                <ChannelPriceCell fact={facts.get("walmart")} href={walmartUrl} />
                <ChannelPriceCell fact={facts.get("musicians-friend")} />
                {extras.map((channel) => {
                  const cell: PricedChannelCell | undefined = prices.get(row.asin.trim())?.get(channel.channel);
                  return (
                    <ChannelPriceCell
                      key={channel.channel}
                      fact={facts.get(channel.channel)}
                      href={cell ? httpUrl(cell.url) : null}
                    />
                  );
                })}
                <td>{row.reviews_count != null ? formatInt(row.reviews_count) : pendingLabel()}</td>
                <td>{row.channels?.trim() || "n/a"}</td>
              </tr>
            );
          })}
        </tbody>
      </ResizableTable>

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <button
          type="button"
          className="segmented-btn"
          disabled={page <= 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Page {page + 1} of {pages}
        </span>
        <button
          type="button"
          className="segmented-btn"
          disabled={page + 1 >= pages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
