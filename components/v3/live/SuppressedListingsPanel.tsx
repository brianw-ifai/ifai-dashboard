"use client";

import { useEffect, useState } from "react";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import {
  competitivePriceReadingCountQuery,
  competitivePriceColumnProbe,
  suppressedListingsQuery,
} from "@/lib/canvasData";
import { formatInt, formatUsd } from "@/lib/fender-canvas/format";
import {
  listingLabel,
  suppressionGapDollars,
  suppressionList,
  type SuppressionReading,
} from "@/lib/fender-canvas/suppressed-listings";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

const PAGE_SIZE = 1000;

const SUPPRESSED_COLUMNS: RetailColumn[] = [
  { id: "listing", name: "Listing", label: "Listing", width: 240, minWidth: 140 },
  { id: "offer", name: "Offer price", label: "Offer price", width: 120, minWidth: 100, className: "money" },
  {
    id: "benchmark",
    name: "Competitive External Price",
    label: "Competitive External Price",
    width: 200,
    minWidth: 140,
    className: "money",
  },
  {
    id: "withheld",
    name: "Featured Offer withheld",
    label: "Featured Offer withheld",
    width: 120,
    minWidth: 88,
  },
  {
    id: "gap",
    name: "Above benchmark",
    label: "Above benchmark",
    width: 140,
    minWidth: 110,
    className: "money",
  },
];

function amazonHref(asin: string): string | null {
  return /^[A-Z0-9]{10}$/.test(asin) ? `https://www.amazon.com/dp/${asin}` : null;
}

async function loadSuppressedListings(): Promise<
  { available: false } | { available: true; rows: SuppressionReading[] }
> {
  const probe = await competitivePriceColumnProbe();
  if (probe.error || !probe.present) return { available: false };

  const reading = await competitivePriceReadingCountQuery();
  if (reading.error || !reading.count) return { available: false };

  const rows: SuppressionReading[] = [];
  for (let page = 0; page < 20; page += 1) {
    const { data, error, count } = await suppressedListingsQuery(page, PAGE_SIZE);
    if (error) return { available: false };
    rows.push(...((data ?? []) as SuppressionReading[]));
    const loaded = rows.length;
    const total = count ?? loaded;
    if (loaded >= total || (data ?? []).length < PAGE_SIZE) {
      return { available: true, rows: suppressionList(rows) };
    }
  }
  return { available: false };
}

function explanation() {
  return (
    <div className="ceo-callout" style={{ marginTop: 12 }}>
      <div className="ceo-callout-header">
        <span>Why can a MAP-priced listing still lose the Featured Offer?</span>
      </div>
      <div className="ceo-callout-body">
        A listing at <strong>MAP</strong> can still have no <strong>Featured Offer</strong>. Amazon
        withholds it when the offer, including shipping, is above the Competitive External Price:
        the lowest price it recently found outside Amazon. Amazon does not name that retailer.
      </div>
    </div>
  );
}

function ReadingNote({ read }: { read: RetailCanvasRead }) {
  if (read.phase === "loading") {
    return <p className="retail-missing">Loading the retail reading…</p>;
  }
  if (read.phase === "error") {
    return <p className="retail-missing">The retail read could not be loaded.</p>;
  }
  const reading = read.snapshot.suppressedListings;
  const showMissing = reading.status === "incomplete" || reading.status === "unavailable";
  if (!showMissing || !reading.missingMessage) return null;
  return <p className="retail-missing">{reading.missingMessage}</p>;
}

export function SuppressedListingsPanel({ read }: { read: RetailCanvasRead }) {
  const [state, setState] = useState<
    "loading" | "unavailable" | { rows: SuppressionReading[] }
  >("loading");

  useEffect(() => {
    let cancelled = false;
    loadSuppressedListings()
      .then((next) => {
        if (cancelled) return;
        setState(next.available ? { rows: next.rows } : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = typeof state === "object" ? state.rows : null;

  return (
    <div className="suppressed-listings">
      {explanation()}
      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">
          <span>Suppressed Listings</span>
          {read.phase === "ready" && read.snapshot.suppressedListings.issueCount != null ? (
            <span className="tag-badge tag-danger suppressed-count">
              {formatInt(read.snapshot.suppressedListings.issueCount)}
            </span>
          ) : null}
        </div>
        <ReadingNote read={read} />
        {state === "loading" ? (
          <p className="retail-missing">Loading qualifying listings…</p>
        ) : null}
        {state === "unavailable" ? (
          <p className="retail-missing">The qualifying rows could not be loaded.</p>
        ) : null}
        {rows ? (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "8px 0" }}>
              Source fields: offer price, Competitive External Price, and Featured Offer withheld.
              The gap is the offer, including shipping, minus that external price.
            </p>
            <ResizableTable tableId="suppressed-listings" columns={SUPPRESSED_COLUMNS}>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        No listing in this reading is above the Competitive External Price with the
                        Featured Offer withheld.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const href = amazonHref(row.asin);
                      const gap = suppressionGapDollars(row);
                      return (
                        <tr key={row.asin}>
                          <td>
                            <strong>{listingLabel(row)}</strong>
                            <br />
                            <span className="asin-line">
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
                            </span>
                          </td>
                          <td className="money">{formatUsd(row.offer_price)}</td>
                          <td className="money">
                            {row.competitive_price_threshold_cents != null
                              ? formatUsd(row.competitive_price_threshold_cents / 100)
                              : ""}
                          </td>
                          <td>{row.featured_offer_withheld === true ? "Yes" : "No"}</td>
                          <td className="money" style={{ color: "var(--danger-red)", fontWeight: 700 }}>
                            {formatUsd(gap, { signed: true })}
                          </td>
                        </tr>
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
