"use client";

import { useState } from "react";
import { DefinedCopy } from "@/components/v3/live/DefinedTerm";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { CATALOG_GOVERNANCE_EXPLAINER } from "@/lib/fender-canvas/catalog-governance-copy";
import { formatInt } from "@/lib/fender-canvas/format";
import type {
  RetailReading,
  UnnestedBundleOpportunity,
} from "@/lib/fender-canvas/portfolio-retail";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

const PAGE = 20;

const BUNDLE_COLUMNS: RetailColumn[] = [
  { id: "listing", name: "Listing", label: "Listing", width: 220, minWidth: 120 },
  { id: "asin", name: "ASIN", label: "ASIN", width: 118, minWidth: 108, className: "asin-col" },
  { id: "parent", name: "Parent ASIN", label: "Parent ASIN", width: 128, minWidth: 108, className: "asin-col" },
  { id: "why", name: "Why it is here", label: "Why it is here", width: 280, minWidth: 140 },
];

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

function reasonCopy(row: UnnestedBundleOpportunity): string {
  if (row.justification.reason === "missing_parent_asin") {
    return "is_bundle is true and no parent ASIN is stored.";
  }
  return `is_bundle is true and parent ASIN ${row.parentAsin ?? "stored"} cannot nest this bundle.`;
}

function CountLine({ reading, noun }: { reading: RetailReading<unknown>; noun: string }) {
  const showMissing = reading.status === "incomplete" || reading.status === "unavailable";
  return (
    <>
      <div className="metric-card-val">
        {reading.issueCount == null ? "Not stored" : formatInt(reading.issueCount)}
      </div>
      <span className="metric-card-sub">{noun}</span>
      {showMissing && reading.missingMessage ? (
        <p className="retail-missing">{reading.missingMessage}</p>
      ) : null}
    </>
  );
}

function Pager({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE));
  if (total <= PAGE) return null;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        className="segmented-btn"
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Page {page + 1} of {pages}
      </span>
      <button
        type="button"
        className="segmented-btn"
        disabled={page + 1 >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function AsinLink({ asin, href }: { asin: string; href: string | null }) {
  if (!href) return <span className="asin-chip">{asin}</span>;
  return (
    <a className="listing-link channel-tag channel-amz" href={href} target="_blank" rel="noopener noreferrer">
      <span className="asin-chip">{asin}</span>
    </a>
  );
}

function BundleRows({ rows }: { rows: UnnestedBundleOpportunity[] }) {
  const [page, setPage] = useState(0);
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <>
      <ResizableTable tableId="catalog-bundles" columns={BUNDLE_COLUMNS}>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={4}>No unnested bundle is confirmed in this retail read.</td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr key={row.asin}>
                  <td>
                    <strong>{row.modelOrTitle ?? "Listing"}</strong>
                    {row.bundleName ? (
                      <>
                        <br />
                        {row.bundleName}
                      </>
                    ) : null}
                  </td>
                  <td className="asin-col">
                    <AsinLink asin={row.asin} href={httpUrl(row.productUrl) ?? amazonHref(row.asin)} />
                  </td>
                  <td className="asin-col">{row.parentAsin ?? "None stored"}</td>
                  <td>{reasonCopy(row)}</td>
                </tr>
              ))
            )}
          </tbody>
      </ResizableTable>
      <Pager page={page} total={rows.length} onPage={setPage} />
    </>
  );
}

function AmazonSpecGapCount({ reading }: { reading: RetailReading<unknown> }) {
  const showMissing = reading.status === "incomplete" || reading.status === "unavailable";
  const count = reading.issueCount == null ? "Not stored" : formatInt(reading.issueCount);
  return (
    <div className="content-box">
      <button
        type="button"
        className="retail-finding-hit"
        data-ifai-open="specs"
        data-ifai-tab="Catalog Readiness"
        data-spec-open="catalog-readiness"
        aria-label={`${count} checked listings with a missing Amazon spec field. Opens Catalog Readiness.`}
      >
        <span className="metric-card-label">Checked listings with a missing Amazon spec field</span>
        <span className="metric-card-val" data-amazon-spec-gap-count={reading.issueCount ?? ""}>
          {count}
        </span>
      </button>
      {showMissing && reading.missingMessage ? (
        <p className="retail-missing">{reading.missingMessage}</p>
      ) : null}
    </div>
  );
}

export function CatalogGovernancePanel({ read }: { read: RetailCanvasRead }) {
  if (read.phase === "loading") {
    return <p className="retail-missing">Loading the retail reading…</p>;
  }
  if (read.phase === "error") {
    return <p className="retail-missing">The retail read could not be loaded.</p>;
  }

  const bundles = read.snapshot.unnestedBundles;
  const specs = read.snapshot.amazonSpecGaps;
  const opportunities = bundles.detail?.opportunities ?? [];

  return (
    <div className="catalog-governance retail-surface">
      <div className="ceo-callout">
        <div className="ceo-callout-header">
          <span>What is catalog governance?</span>
        </div>
        <div className="ceo-callout-body">
          <DefinedCopy text={CATALOG_GOVERNANCE_EXPLAINER} />
        </div>
      </div>

      <div className="content-box">
        <div className="content-box-title">
          <span>Unnested bundles</span>
        </div>
        <CountLine reading={bundles} noun="Bundles in this retail read with no usable parent ASIN" />
        <p className="retail-missing">
          This group lists the bundles this retail read can show. It is not the full catalog.
        </p>
        {bundles.detail ? <BundleRows rows={opportunities} /> : null}
      </div>

      <AmazonSpecGapCount reading={specs} />
    </div>
  );
}
