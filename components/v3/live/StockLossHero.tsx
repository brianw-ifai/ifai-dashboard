"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { formatInt, formatUsd } from "@/lib/fender-canvas/format";
import {
  lostSalesPopulationPie,
  sumLostSales,
  type StockLossRow,
} from "@/lib/fender-canvas/stock-loss";

const RETAIL_PIE_SIZE = "citation-pie-disc citation-pie-disc-retail";

function estimateTooltipDesc(
  estimatedCount: number,
  notEstimatedCount: number,
  affectedCount: number,
  liveCount: number | null,
): string {
  const population =
    liveCount != null
      ? `${formatInt(estimatedCount)} in the sum, ${formatInt(notEstimatedCount)} Not estimated. ${formatInt(affectedCount)} of ${formatInt(liveCount)} live listings were out of stock or without a Buy Box at least one day in the last 12 months.`
      : `${formatInt(estimatedCount)} in the sum, ${formatInt(notEstimatedCount)} Not estimated. ${formatInt(affectedCount)} live listings were out of stock or without a Buy Box at least one day in the last 12 months.`;
  return (
    `${population} Each listing rate is SmartScout revenue divided by Keepa in-stock days, times out-of-stock days. ` +
    `The rate uses 12-month revenue when at least 30 of those days were in stock. ` +
    `Otherwise it uses revenue from the last 30 days when at least 7 of those days were in stock. ` +
    `Listings with no rate stay Not estimated and are not in the sum. ` +
    `The no-Buy-Box upper bound is not in the sum.`
  );
}

/**
 * Out of Stock hero: sum of per-listing analyst estimates and population disc.
 * Population counts and the rate rule live on the Estimate pill tooltip.
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
  const estimateDesc = estimateTooltipDesc(
    sum.estimatedCount,
    sum.notEstimatedCount,
    sum.affectedCount,
    liveCount,
  );

  return (
    <div
      className="content-box findability-lead-card stock-loss-hero"
      data-stock-loss-hero=""
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
            Est. lost sales, 12 months{" "}
            <span
              className="source-tag source-tag-estimate ifai-term"
              data-source="Estimate"
              data-stock-loss-estimate-tip=""
              data-ifai-tooltip-title="Estimate"
              data-ifai-tooltip-desc={estimateDesc}
              tabIndex={0}
              aria-label={`Estimate: ${estimateDesc}`}
            >
              Estimate
            </span>
          </span>
          {sum.affectedCount > 0 ? (
            <span className="findability-lead-ratio" data-stock-loss-hero-ratio="">
              {formatInt(sum.estimatedCount)} of {formatInt(sum.affectedCount)}
            </span>
          ) : null}
        </div>
        {pie ? <CitationPieDisc pie={pie} sizeClass={RETAIL_PIE_SIZE} tip={tip} /> : null}
      </div>
    </div>
  );
}
