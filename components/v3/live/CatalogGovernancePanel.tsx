"use client";

import { useState, type ReactNode } from "react";
import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { DefinedCopy } from "@/components/v3/live/DefinedTerm";
import { ResizableTable, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import { CATALOG_GOVERNANCE_EXPLAINER } from "@/lib/fender-canvas/catalog-governance-copy";
import { specFieldFindings } from "@/lib/fender-canvas/catalog-governance-findings";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  catalogBundleLineLabel,
  catalogBundleOfferLabel,
  catalogBundleSellerLabel,
  type AmazonSpecGapDetail,
  type PortfolioRetailSnapshot,
  type RetailReading,
  type UnnestedBundleOpportunity,
} from "@/lib/fender-canvas/portfolio-retail";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import { catalogHero, specHero } from "@/lib/fender-canvas/retail-overview-lead";
import type { SortInput } from "@/lib/fender-canvas/table-sort";

const SPLINTERED_LISTINGS_LABEL = "Splintered listings";
const MOST_OF_THE_SPEC_DESC = "Missing 11 or more of the Amazon spec fields we check.";

const PAGE = 20;
const RETAIL_PIE_SIZE = "citation-pie-disc citation-pie-disc-retail";

const BUNDLE_COLUMNS: RetailColumn[] = [
  { id: "listing", name: "Listing", label: "Listing", width: 220, minWidth: 120, sort: "text" },
  { id: "asin", name: "ASIN", label: "ASIN", width: 118, minWidth: 108, className: "asin-col", sort: "text" },
  { id: "seller", name: "Seller", label: "Seller", width: 160, minWidth: 100, sort: "text" },
  { id: "offer", name: "Offer", label: "Offer", width: 100, minWidth: 80, sort: "text" },
  { id: "line", name: "Line", label: "Line", width: 120, minWidth: 88, sort: "text" },
];

function bundleSortValue(row: UnnestedBundleOpportunity, columnId: string): SortInput {
  if (columnId === "listing") return row.modelOrTitle?.trim() || row.bundleName?.trim() || null;
  if (columnId === "asin") return row.asin;
  if (columnId === "seller") return catalogBundleSellerLabel(row.buyboxSellerName);
  if (columnId === "offer") return catalogBundleOfferLabel(row.buyboxStatus, row.buyboxSellerId);
  if (columnId === "line") return catalogBundleLineLabel(row.category);
  return null;
}

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
  const sorted = useClientTableSort(rows, BUNDLE_COLUMNS, bundleSortValue);
  const slice = sorted.rows.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <>
      <ResizableTable
        tableId="catalog-bundles"
        columns={BUNDLE_COLUMNS}
        freezeHeader
        maxHeight={520}
        sort={sorted.sort}
        onSort={(columnId) => {
          setPage(0);
          sorted.onSort(columnId);
        }}
      >
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={5}>No unnested bundle is confirmed in this retail read.</td>
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
                  <td>{catalogBundleSellerLabel(row.buyboxSellerName)}</td>
                  <td>{catalogBundleOfferLabel(row.buyboxStatus, row.buyboxSellerId)}</td>
                  <td>{catalogBundleLineLabel(row.category)}</td>
                </tr>
              ))
            )}
          </tbody>
      </ResizableTable>
      <Pager page={page} total={rows.length} onPage={setPage} />
    </>
  );
}

/**
 * Specs-complete share (checked listings with every Amazon field filled).
 * Opens AI Readiness; replaces the plain missing-field count button.
 */
function CatalogSpecHero({ snapshot }: { snapshot: PortfolioRetailSnapshot }) {
  const hero = specHero(snapshot);
  const aria = hero.ratio
    ? `${hero.percent}. ${hero.ratio}. Opens AI Readiness.`
    : `${hero.percent}. Opens AI Readiness.`;
  return (
    <button
      type="button"
      className="content-box findability-lead-card"
      data-catalog-spec-hero=""
      data-ifai-open="specs"
      data-ifai-tab="AI Readiness"
      data-spec-open="ai-readiness"
      aria-label={aria}
      style={{ flex: "0 0 auto", width: "fit-content", maxWidth: "100%" }}
    >
      <div>
        <span>{hero.label}</span>
      </div>
      <div className="findability-lead-row">
        <div className="findability-lead-figures">
          <span className="ai-lead-figure" style={{ color: hero.color }}>
            {hero.percent}
          </span>
          {hero.ratio ? (
            <span className="findability-lead-ratio">{hero.ratio}</span>
          ) : null}
        </div>
        {hero.pie ? (
          <CitationPieDisc pie={hero.pie} sizeClass={RETAIL_PIE_SIZE} tip={hero.tip ?? undefined} />
        ) : null}
      </div>
      <span className="metric-card-sub">{hero.explainer}</span>
    </button>
  );
}

/**
 * Same unnested-bundle share as Retail Overview: percentage, N of M, and disc.
 * Visible label is Splintered listings; tab / RETAIL_FINDING_LABELS stay Catalog Governance.
 */
function CatalogGovernanceLead({ snapshot }: { snapshot: PortfolioRetailSnapshot }) {
  const hero = catalogHero(snapshot);
  return (
    <div
      className="content-box findability-lead-card"
      data-catalog-governance-lead=""
      style={{ flex: "0 0 auto", width: "fit-content", maxWidth: "100%" }}
    >
      <div>
        <span>{SPLINTERED_LISTINGS_LABEL}</span>
      </div>
      <div className="findability-lead-row">
        <div className="findability-lead-figures">
          <span className="ai-lead-figure" style={{ color: hero.color }}>
            {hero.percent}
          </span>
          {hero.ratio ? (
            <span className="findability-lead-ratio">{hero.ratio}</span>
          ) : null}
        </div>
        {hero.pie ? (
          <CitationPieDisc pie={hero.pie} sizeClass={RETAIL_PIE_SIZE} tip={hero.tip ?? undefined} />
        ) : null}
      </div>
      <span className="metric-card-sub">{hero.explainer}</span>
    </div>
  );
}

function FindingLine({ label, count }: { label: ReactNode; count: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
      <span>{label}</span>
      <span>{formatInt(count)}</span>
    </div>
  );
}

/**
 * Full-width Fill first / How close band from amazonSpecGaps.detail.gaps.
 * When the reading has no detail or checked is zero, both cards say Not available*.
 */
function CatalogSpecFindings({ specs }: { specs: RetailReading<AmazonSpecGapDetail | null> }) {
  const detail = specs.detail;
  const ready = detail != null && detail.checked > 0;
  const findings = ready ? specFieldFindings(detail.gaps) : null;

  return (
    <div
      data-catalog-governance-findings=""
      style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "stretch", marginTop: 12 }}
    >
      <div className="content-box" style={{ flex: "1 1 240px", minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="content-box-title" style={{ marginTop: 0 }}>
          Fill first
        </div>
        {findings ? (
          findings.fillFirst.map((line) => (
            <FindingLine key={line.field} label={line.label} count={line.count} />
          ))
        ) : (
          <span>Not available*</span>
        )}
      </div>
      <div className="content-box" style={{ flex: "1 1 240px", minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="content-box-title" style={{ marginTop: 0 }}>
          How close
        </div>
        {findings ? (
          <>
            <FindingLine label="One field" count={findings.howClose.oneField} />
            <FindingLine label="Two fields" count={findings.howClose.twoFields} />
            <FindingLine
              label={
                <span
                  className="ifai-term"
                  data-ifai-tooltip-title="Most of the spec"
                  data-ifai-tooltip-desc={MOST_OF_THE_SPEC_DESC}
                  tabIndex={0}
                  aria-label={`Most of the spec: ${MOST_OF_THE_SPEC_DESC}`}
                >
                  Most of the spec
                </span>
              }
              count={findings.howClose.mostOfTheSpec}
            />
          </>
        ) : (
          <span>Not available*</span>
        )}
      </div>
    </div>
  );
}

/** Explainer column beside the hero pair. Incomplete / unavailable messages sit under the notes. */
function CatalogGovernanceNotes({ specs }: { specs: RetailReading<unknown> }) {
  const showMissing =
    (specs.status === "incomplete" || specs.status === "unavailable") && Boolean(specs.missingMessage);
  return (
    <div
      className="content-box"
      data-catalog-governance-notes=""
      style={{ flex: "1 1 240px", minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div className="ceo-callout" style={{ margin: 0 }}>
        <div className="ceo-callout-header">
          <span>What is catalog governance?</span>
        </div>
        <div className="ceo-callout-body">
          <DefinedCopy text={CATALOG_GOVERNANCE_EXPLAINER} />
        </div>
      </div>
      {showMissing ? <p className="retail-missing">{specs.missingMessage}</p> : null}
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
      <div
        data-catalog-governance-lead-row=""
        style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "stretch" }}>
          <CatalogGovernanceLead snapshot={read.snapshot} />
          <CatalogSpecHero snapshot={read.snapshot} />
        </div>
        <CatalogGovernanceNotes specs={specs} />
      </div>

      <CatalogSpecFindings specs={specs} />

      <div className="content-box" style={{ marginTop: 12 }} data-catalog-governance-table="">
        {bundles.detail ? <BundleRows rows={opportunities} /> : null}
      </div>
    </div>
  );
}
