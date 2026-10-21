"use client";

import { ExploreListings } from "@/components/v3/live/ExploreListings";
import { DefinedTerm } from "@/components/v3/live/DefinedTerm";
import { FeaturedOfferReadings } from "@/components/v3/live/FeaturedOfferReadings";
import { RetailFindingVisual } from "@/components/v3/live/RetailFindingVisual";
import { formatUsd } from "@/lib/fender-canvas/format";
import {
  RETAIL_FINDING_LABELS,
  type PortfolioRetailSnapshot,
} from "@/lib/fender-canvas/portfolio-retail";
import { readingLabel, type RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import type { CanvasFreshnessRow } from "@/lib/fender-canvas/types";

function priceGap(snapshot: PortfolioRetailSnapshot): string | null {
  const gap = snapshot.mapLeakage.detail?.averageLeakage;
  if (gap == null) return null;
  return `Average price gap ${formatUsd(gap, { signed: true })}. This is a price gap, not revenue.`;
}

function Findings({ snapshot }: { snapshot: PortfolioRetailSnapshot }) {
  const suppressed = snapshot.suppressedListings.detail;
  const map = snapshot.mapLeakage.detail;
  const bundles = snapshot.unnestedBundles.detail;

  return (
    <div className="retail-finding-grid">
      <RetailFindingVisual
        label={readingLabel(
          snapshot.suppressedListings,
          RETAIL_FINDING_LABELS.suppressed_listings,
        )}
        tab={RETAIL_FINDING_LABELS.suppressed_listings}
        reading={snapshot.suppressedListings}
        coverage={
          suppressed && suppressed.population > 0
            ? { checked: suppressed.audited, total: suppressed.population }
            : null
        }
      />
      <RetailFindingVisual
        label="MAP leakage"
        tab={RETAIL_FINDING_LABELS.map_leakage}
        reading={snapshot.mapLeakage}
        extra={priceGap(snapshot)}
        coverage={
          map && map.population > 0 ? { checked: map.decided, total: map.population } : null
        }
      />
      <RetailFindingVisual
        label={RETAIL_FINDING_LABELS.unnested_bundles}
        tab={RETAIL_FINDING_LABELS.unnested_bundles}
        reading={snapshot.unnestedBundles}
        extra="Bundles in this retail read with no usable parent ASIN."
        coverage={
          bundles && bundles.catalogBundles != null && bundles.catalogBundles > 0
            ? { checked: bundles.bundlesInRead, total: bundles.catalogBundles }
            : null
        }
      />
    </div>
  );
}

export function RetailOverview({
  read,
  freshness = null,
}: {
  read: RetailCanvasRead;
  freshness?: CanvasFreshnessRow[] | null;
}) {
  const counts =
    read.phase === "ready" ? read.snapshot.suppressedListings.detail?.counts ?? null : null;

  return (
    <div className="retail-health retail-surface">
      <p
        className="metric-card-sub"
        style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: "0.02em" }}
      >
        Seller type: Partner-led
      </p>
      <div className="ceo-callout">
        <div className="ceo-callout-header">
          <span>How do these retail findings change AI search?</span>
        </div>
        <div className="ceo-callout-body">
          A withheld{" "}
          <span
            className="ifai-term"
            data-ifai-tooltip-title="Buy Box"
            data-ifai-tooltip-desc="Amazon also calls it the Featured Offer. The one-click Add to Cart button. Only one seller wins it. When nobody wins it, shoppers see other sellers listed and far fewer of them buy."
            tabIndex={0}
            aria-label="Buy Box: Amazon also calls it the Featured Offer. The one-click Add to Cart button. Only one seller wins it. When nobody wins it, shoppers see other sellers listed and far fewer of them buy."
          >
            Buy Box
          </span>{" "}
          removes the one-click path shoppers and AI assistants use when they name a product someone
          can buy. A price below <DefinedTerm term="MAP" /> publishes a lower number than the brand
          agreed to advertise. A bundle that is not nested under a parent{" "}
          <DefinedTerm term="ASIN" /> keeps its reviews off the listing those assistants treat as
          the product.
        </div>
      </div>

      {read.phase === "loading" ? (
        <p className="retail-missing">Loading the retail reading…</p>
      ) : null}
      {read.phase === "error" ? (
        <p className="retail-missing">The retail read could not be loaded.</p>
      ) : null}
      {read.phase === "ready" ? <Findings snapshot={read.snapshot} /> : null}
      {counts ? <FeaturedOfferReadings counts={counts} freshness={freshness} /> : null}

      <ExploreListings />
    </div>
  );
}
