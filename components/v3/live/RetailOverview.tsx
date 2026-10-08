"use client";

import { ExploreListings } from "@/components/v3/live/ExploreListings";
import { DefinedTerm } from "@/components/v3/live/DefinedTerm";
import { RetailFindingVisual } from "@/components/v3/live/RetailFindingVisual";
import {
  AMAZON_LIST_PRICE_IS_NOT_MAP,
  RETAIL_FINDING_LABELS,
  type PortfolioRetailSnapshot,
} from "@/lib/fender-canvas/portfolio-retail";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

function Findings({ snapshot }: { snapshot: PortfolioRetailSnapshot }) {
  const suppressed = snapshot.suppressedListings.detail;
  const bundles = snapshot.unnestedBundles.detail;

  return (
    <div className="retail-finding-grid">
      <RetailFindingVisual
        label={RETAIL_FINDING_LABELS.suppressed_listings}
        tab={RETAIL_FINDING_LABELS.suppressed_listings}
        reading={snapshot.suppressedListings}
        coverage={
          suppressed && suppressed.population > 0
            ? { checked: suppressed.audited, total: suppressed.population }
            : null
        }
      />
      <RetailFindingVisual
        label="Listings below MAP"
        tab={RETAIL_FINDING_LABELS.map_leakage}
        reading={snapshot.mapPrices}
        extra={AMAZON_LIST_PRICE_IS_NOT_MAP}
        coverage={null}
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

export function RetailOverview({ read }: { read: RetailCanvasRead }) {
  return (
    <div className="retail-health retail-surface">
      <div className="ceo-callout">
        <div className="ceo-callout-header">
          <span>How do these retail findings change AI search?</span>
        </div>
        <div className="ceo-callout-body">
          A withheld <DefinedTerm term="Featured Offer" /> removes the one-click path shoppers and
          AI assistants use when they name a product someone can buy. A price below{" "}
          <DefinedTerm term="MAP" /> publishes a lower number than the brand agreed to advertise,
          and this read cannot name one until Fender&apos;s MAP prices are stored. A bundle that is
          not nested under a parent <DefinedTerm term="ASIN" /> keeps its reviews off the listing
          those assistants treat as the product.
        </div>
      </div>

      {read.phase === "loading" ? (
        <p className="retail-missing">Loading the retail reading…</p>
      ) : null}
      {read.phase === "error" ? (
        <p className="retail-missing">The retail read could not be loaded.</p>
      ) : null}
      {read.phase === "ready" ? <Findings snapshot={read.snapshot} /> : null}

      <ExploreListings />
    </div>
  );
}
