"use client";

import { useEffect, useState } from "react";
import { ResizableTable } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import {
  FEATURED_OFFER_TABLE_COLUMNS,
  FEATURED_OFFER_TABLE_COLUMN_COUNT,
  FeaturedOfferTableRow,
} from "@/components/v3/live/FeaturedOfferRow";
import {
  featuredOfferColumnProbe,
  featuredOfferReadingCountQuery,
  suppressedListingsQuery,
} from "@/lib/canvasData";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  aboveBenchmarkDollars,
  benchmarkDollars,
  FEATURED_OFFER_STATE_LABELS,
  featuredOfferState,
  listingLabel,
  observedOfferDollars,
  readFromKeepa,
  withheldListings,
  type FeaturedOfferRow,
} from "@/lib/fender-canvas/featured-offer";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import {
  benchmarkCoverageSentence,
  confirmedSuppressionSentence,
  featuredOfferFreshnessSentence,
  featuredOfferJob,
} from "@/lib/fender-canvas/featured-offer-copy";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import type { CanvasFreshnessRow } from "@/lib/fender-canvas/types";

const PAGE_SIZE = 1000;

function suppressedSortValue(row: FeaturedOfferRow, columnId: string): SortInput {
  if (columnId === "listing") return listingLabel(row).trim() || null;
  if (columnId === "state") return FEATURED_OFFER_STATE_LABELS[featuredOfferState(row)];
  if (columnId === "offer") return observedOfferDollars(row);
  if (columnId === "benchmark") return benchmarkDollars(row);
  if (columnId === "gap") return aboveBenchmarkDollars(row);
  if (columnId === "source") return readFromKeepa(row) ? "Amazon listing read" : "Catalog";
  return row.featured_offer_checked_at ?? null;
}

async function loadWithheldListings(): Promise<
  { available: false } | { available: true; rows: FeaturedOfferRow[] }
> {
  const probe = await featuredOfferColumnProbe();
  if (probe.error || !probe.present) return { available: false };

  const reading = await featuredOfferReadingCountQuery();
  if (reading.error || !reading.count) return { available: false };

  const rows: FeaturedOfferRow[] = [];
  for (let page = 0; page < 20; page += 1) {
    const { data, error, count } = await suppressedListingsQuery(page, PAGE_SIZE);
    if (error) return { available: false };
    rows.push(...((data ?? []) as FeaturedOfferRow[]));
    const loaded = rows.length;
    const total = count ?? loaded;
    if (loaded >= total || (data ?? []).length < PAGE_SIZE) {
      return { available: true, rows: withheldListings(rows) };
    }
  }
  return { available: false };
}

function explanation() {
  return (
    <div className="ceo-callout" style={{ marginTop: 12 }}>
      <div className="ceo-callout-header">
        <span>Why can a listing lose the Featured Offer?</span>
      </div>
      <div className="ceo-callout-body">
        Amazon withholds the <strong>Featured Offer</strong> when the offer it observed,
        including shipping, is above the Competitive External Price: the lowest price it
        recently found outside Amazon. Amazon does not name that retailer, and a listing can
        be withheld for other reasons too, so a withheld listing with no published benchmark
        is not a confirmed price problem.
      </div>
    </div>
  );
}

/** Counts and freshness from the same reading the bubble and overview use. */
function ReadingNote({
  read,
  freshness,
}: {
  read: RetailCanvasRead;
  freshness?: CanvasFreshnessRow[] | null;
}) {
  if (read.phase === "loading") {
    return <p className="retail-missing">Loading the Featured Offer reading…</p>;
  }
  if (read.phase === "error") {
    return <p className="retail-missing">The retail read could not be loaded.</p>;
  }
  const counts = read.snapshot.suppressedListings.detail?.counts;
  if (!counts) {
    return (
      <p className="retail-missing">
        {read.snapshot.suppressedListings.missingMessage ??
          "The Featured Offer reading has not been stored."}
      </p>
    );
  }
  return (
    <>
      <p className="retail-missing">{confirmedSuppressionSentence(counts)}</p>
      <p className="retail-missing">{benchmarkCoverageSentence(counts)}</p>
      <p className="retail-missing">
        {featuredOfferFreshnessSentence(counts, featuredOfferJob(freshness))}
      </p>
    </>
  );
}

export function SuppressedListingsPanel({
  read,
  freshness = null,
}: {
  read: RetailCanvasRead;
  freshness?: CanvasFreshnessRow[] | null;
}) {
  const [state, setState] = useState<"loading" | "unavailable" | { rows: FeaturedOfferRow[] }>(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    loadWithheldListings()
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
  const sorted = useClientTableSort(rows ?? [], FEATURED_OFFER_TABLE_COLUMNS, suppressedSortValue);
  const counts = read.phase === "ready" ? read.snapshot.suppressedListings.detail?.counts : null;

  return (
    <div className="suppressed-listings retail-surface">
      {explanation()}
      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">
          <span>Featured Offer withheld</span>
          {counts ? (
            <span className="tag-badge tag-danger suppressed-count">
              {formatInt(counts.withheld)}
            </span>
          ) : null}
        </div>
        <ReadingNote read={read} freshness={freshness} />
        {state === "loading" ? (
          <p className="retail-missing">Loading withheld listings…</p>
        ) : null}
        {state === "unavailable" ? (
          <p className="retail-missing">The withheld listings could not be loaded.</p>
        ) : null}
        {rows ? (
          <>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "8px 0" }}>
              The observed offer and the Competitive External Price come from the same Amazon
              listing read, so the gap compares one moment. A blank gap means this reading has
              no comparable pair yet, not a gap of zero.
            </p>
            <ResizableTable
              tableId="suppressed-listings"
              columns={FEATURED_OFFER_TABLE_COLUMNS}
              freezeHeader
              maxHeight={520}
              sort={sorted.sort}
              onSort={sorted.onSort}
            >
              <tbody>
                {sorted.rows.length === 0 ? (
                  <tr>
                    <td colSpan={FEATURED_OFFER_TABLE_COLUMN_COUNT}>
                      No monitored listing has a withheld Featured Offer in the current reading.
                    </td>
                  </tr>
                ) : (
                  sorted.rows.map((row) => (
                    <FeaturedOfferTableRow key={String(row.asin ?? "")} row={row} />
                  ))
                )}
              </tbody>
            </ResizableTable>
          </>
        ) : null}
      </div>
    </div>
  );
}
