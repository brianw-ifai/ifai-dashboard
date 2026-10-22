"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChannelPriceCell } from "@/components/v3/live/ChannelPriceCell";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { useFullPopulationSort } from "@/components/v3/live/useFullPopulationSort";
import { listingChannelPricesQuery, listingsQuery } from "@/lib/canvasData";
import { CLIENT_TABLE_PAGE_SIZE, loadFilteredPages } from "@/lib/fender-canvas/full-result-sort";
import { featuredOfferState } from "@/lib/fender-canvas/featured-offer";
import { formatInt, formatUsd, pendingLabel } from "@/lib/fender-canvas/format";
import { listingReviewLabel } from "@/lib/fender-canvas/listing-reviews";
import {
  channelDisplayName,
  channelPriceLookup,
  listingChannelFacts,
  musiciansFriendCheckedPageUrl,
  storedHttpUrl,
  type ChannelPriceRow,
  type MapSourceRow,
  type PricedChannelCell,
} from "@/lib/fender-canvas/map-channels";
import { exploreListingSortValue } from "@/lib/fender-canvas/listing-table-sort";
import { MAP_LISTING_COLUMN_WIDTH } from "@/lib/fender-canvas/retail-column-layout";
import type { CanvasRetailListingRow } from "@/lib/fender-canvas/types";

const PRICE_PAGE = 1000;
const PREFERRED_EXTRAS = ["sweetwater", "reverb"];
const FIXED_CHANNEL_KEYS = new Set(["amazon", "walmart", "musicians-friend"]);

type Filter = {
  status?: string;
  violationsOnly?: boolean;
  bundlesOnly?: boolean;
};

function amazonHref(asin: string): string | null {
  return /^[A-Z0-9]{10}$/.test(asin) ? `https://www.amazon.com/dp/${asin}` : null;
}

function moneyColumn(id: string, name: string, width = 164): RetailColumn {
  return { id, name, label: name, width, minWidth: 148, className: "money", sort: "number" };
}

function extraChannels(prices: ChannelPriceRow[]): { channel: string; name: string }[] {
  const slugs = new Set<string>();
  for (const byChannel of channelPriceLookup(prices).values()) {
    for (const slug of byChannel.keys()) {
      if (!FIXED_CHANNEL_KEYS.has(slug)) slugs.add(slug);
    }
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
      sort: "text",
    },
    { id: "asin", name: "ASIN", label: "ASIN", width: 118, minWidth: 108, className: "asin-col", sort: "text" },
    { id: "partner", name: "Partner / Bundle", label: "Partner / Bundle", width: 150, minWidth: 100, sort: "text" },
    { id: "map", name: "MAP", label: "MAP", width: 104, minWidth: 88, className: "money", sort: "number" },
    moneyColumn("amazon", "Amazon"),
    moneyColumn("walmart", "Walmart"),
    moneyColumn("musicians-friend", "Musician's Friend", 176),
    ...extras.map((channel) => moneyColumn(channel.channel, channel.name)),
    { id: "reviews", name: "Reviews", label: "Reviews", width: 124, minWidth: 112, sort: "number" },
    { id: "channels", name: "Channels", label: "Channels", width: 120, minWidth: 80, sort: "text" },
  ];
}

/**
 * A listing with no active offer keeps its last stored Amazon price for history.
 * Label it so the stored number is not read as a current offer.
 */
function lastSeenNote(row: CanvasRetailListingRow): string | null {
  return featuredOfferState(row) === "no_active_offer" ? "Last seen, no active offer" : null;
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
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRows([]);
    const result = await loadFilteredPages(async (page, size) => {
      const { data, error: err, count } = await listingsQuery(page, size, filter);
      return { data: (data ?? []) as CanvasRetailListingRow[], error: err, count };
    });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setRows(result.rows);
    setTotal(result.total);
    setLoading(false);
  }, [filter]);

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

  const extras = useMemo(() => extraChannels(channelPrices), [channelPrices]);
  const columns = useMemo(() => exploreColumns(extras), [extras]);
  const prices = useMemo(() => channelPriceLookup(channelPrices), [channelPrices]);
  const sortValue = useCallback(
    (row: CanvasRetailListingRow, columnId: string) =>
      exploreListingSortValue(row, columnId, (id) => {
        const facts = listingChannelFacts(asMapRow(row), prices.get(row.asin.trim()));
        return facts.find((fact) => fact.key === id)?.price;
      }),
    [prices],
  );
  const population = useFullPopulationSort(
    rows,
    columns,
    sortValue,
    (row) => row.asin,
    CLIENT_TABLE_PAGE_SIZE,
  );

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
            population.resetPage();
            setFilter({});
          }}
        >
          All
        </button>
        <button
          type="button"
          className={`segmented-btn${filter.violationsOnly ? " active" : ""}`}
          onClick={() => {
            population.resetPage();
            setFilter({ violationsOnly: true });
          }}
        >
          MAP violations only
        </button>
        <button
          type="button"
          className={`segmented-btn${filter.bundlesOnly ? " active" : ""}`}
          onClick={() => {
            population.resetPage();
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

      <ResizableTable
        tableId="explore-listings"
        columns={columns}
        freezeHeader
        maxHeight={520}
        sort={population.sort}
        onSort={population.onSort}
      >
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
          {population.pageRows.map((row) => {
            const label = row.model_name?.trim() || row.title?.trim() || "Listing";
            const partner = row.bundle_name ?? row.buybox_seller_name ?? "n/a";
            const facts = new Map(
              listingChannelFacts(asMapRow(row), prices.get(row.asin.trim())).map((fact) => [fact.key, fact]),
            );
            const walmartUrl = storedHttpUrl(row.wmt_url);
            const musiciansFriendUrl = musiciansFriendCheckedPageUrl(prices, row.asin);
            const exploreHref = storedHttpUrl(row.product_url) ?? amazonHref(row.asin);
            return (
              <tr key={row.asin}>
                <td className="listing-col">
                  <span className="listing-title-scroll">
                    <strong>{label}</strong>
                  </span>
                </td>
                <td className="asin-col">
                  {exploreHref ? (
                    <a
                      className="listing-link channel-tag channel-amz"
                      href={exploreHref}
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
                <ChannelPriceCell fact={facts.get("amazon")} note={lastSeenNote(row)} />
                <ChannelPriceCell fact={facts.get("walmart")} href={walmartUrl} requireCheckedPage />
                <ChannelPriceCell
                  fact={facts.get("musicians-friend")}
                  href={musiciansFriendUrl}
                  requireCheckedPage
                />
                {extras.map((channel) => {
                  const cell: PricedChannelCell | undefined = prices.get(row.asin.trim())?.get(channel.channel);
                  return (
                    <ChannelPriceCell
                      key={channel.channel}
                      fact={facts.get(channel.channel)}
                      href={cell ? storedHttpUrl(cell.url) : null}
                      requireCheckedPage
                    />
                  );
                })}
                <td>{listingReviewLabel(row.reviews_count)}</td>
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
          disabled={population.page <= 0 || loading}
          onClick={() => population.setPage((current) => Math.max(0, current - 1))}
        >
          Previous
        </button>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Page {population.page + 1} of {population.pages}
        </span>
        <button
          type="button"
          className="segmented-btn"
          disabled={population.page + 1 >= population.pages || loading}
          onClick={() => population.setPage((current) => current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
