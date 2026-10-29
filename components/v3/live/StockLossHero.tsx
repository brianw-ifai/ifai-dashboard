"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { DefinedTerm } from "@/components/v3/live/DefinedTerm";
import { SourceTag } from "@/components/v3/live/SourceTag";
import { formatInt, formatUsd } from "@/lib/fender-canvas/format";
import {
  lostSalesPopulationPie,
  sumLostSales,
  type StockLossRow,
} from "@/lib/fender-canvas/stock-loss";

const RETAIL_PIE_SIZE = "citation-pie-disc citation-pie-disc-retail";

/**
 * Out of Stock hero: sum of per-listing analyst estimates, population disc, and
 * the existing SmartScout / Keepa formula in plain language. X-03 / X-04 preview.
 */
export function StockLossHero({
  rows,
  liveCount,
}: {
  rows: readonly StockLossRow[];
  liveCount: number | null;
}) {
  const sum = sumLostSales(rows);
  const pie = lostSalesPopulationPie(sum);
  const figure = sum.total != null ? formatUsd(sum.total) : "Not estimated";
  const tip =
    sum.affectedCount > 0
      ? `${formatInt(sum.estimatedCount)} estimated, ${formatInt(sum.notEstimatedCount)} Not estimated, of ${formatInt(sum.affectedCount)} live listings out of stock or without a Buy Box.`
      : undefined;

  return (
    <div className="stock-loss-hero" data-stock-loss-hero="">
      <div
        className="content-box findability-lead-card"
        data-stock-loss-hero-card=""
        style={{ flex: "0 0 auto", width: "fit-content", maxWidth: "100%" }}
      >
        <div className="findability-lead-row" data-stock-loss-hero-row="">
          <div className="findability-lead-figures">
            <span
              className="ai-lead-figure"
              style={{ color: sum.total != null ? "var(--danger-red)" : "var(--warning-amber)" }}
              data-stock-loss-hero-figure=""
            >
              {figure}
            </span>
            <span className="findability-lead-ratio" data-stock-loss-hero-label="">
              Est. lost sales, 12 months <SourceTag source="Estimate" />
            </span>
          </div>
          {pie ? <CitationPieDisc pie={pie} sizeClass={RETAIL_PIE_SIZE} tip={tip} /> : null}
        </div>
        <span className="metric-card-sub" data-stock-loss-hero-population="">
          {formatInt(sum.estimatedCount)} in the sum
          {sum.notEstimatedCount > 0
            ? `, ${formatInt(sum.notEstimatedCount)} Not estimated`
            : ""}
          {`. ${formatInt(sum.affectedCount)}`}
          {liveCount != null ? ` of ${formatInt(liveCount)}` : ""} live listings were out of stock
          or without a Buy Box at least one day in the last 12 months.
        </span>
      </div>
      <p className="stock-loss-hero-formula" data-stock-loss-hero-formula="">
        Each listing estimate takes that listing&apos;s sales from <DefinedTerm term="SmartScout" />,
        divides by the days it was in stock according to <DefinedTerm term="Keepa" />, and
        multiplies by the days it was out of stock. The rate uses 12-month{" "}
        <DefinedTerm term="SmartScout" /> revenue when at least 30 of those days were in stock.
        Otherwise it uses revenue from the last 30 days when at least 7 of those days were in stock.
        The total above adds those listing estimates. Listings with no rate stay Not estimated and
        are not in the sum. It is an analyst estimate, not reported sales.{" "}
        <SourceTag source="Estimate" />
      </p>
    </div>
  );
}
