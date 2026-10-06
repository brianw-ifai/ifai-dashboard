"use client";

import { useEffect, useState } from "react";
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

const PAGE_SIZE = 1000;

const UNAVAILABLE = "The reading is not available.";

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

export function SuppressedListingsPanel() {
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
          {rows ? (
            <span className="tag-badge tag-danger suppressed-count">{formatInt(rows.length)}</span>
          ) : null}
        </div>
        {state === "loading" ? (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "8px 0 0" }}>
            Loading the reading…
          </p>
        ) : null}
        {state === "unavailable" ? (
          <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "8px 0 0" }}>{UNAVAILABLE}</p>
        ) : null}
        {rows ? (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "8px 0" }}>
              The gap is the new Amazon offer, including shipping, minus the Competitive External
              Price. The count is the number of listings this read returned.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="table-sm">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Amazon offer</th>
                    <th>Benchmark</th>
                    <th>Above benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
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
                          <td>{formatUsd(row.offer_price)}</td>
                          <td>
                            {row.competitive_price_threshold_cents != null
                              ? formatUsd(row.competitive_price_threshold_cents / 100)
                              : ""}
                          </td>
                          <td style={{ color: "var(--danger-red)", fontWeight: 700 }}>
                            {formatUsd(gap, { signed: true })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
