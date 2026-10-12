"use client";

import { formatInt } from "@/lib/fender-canvas/format";
import type { FeaturedOfferCounts } from "@/lib/fender-canvas/featured-offer";
import {
  benchmarkCoverageSentence,
  classificationCoverageSentence,
  confirmedSuppressionSentence,
  featuredOfferFreshnessSentence,
  featuredOfferJob,
} from "@/lib/fender-canvas/featured-offer-copy";
import type { CanvasFreshnessRow } from "@/lib/fender-canvas/types";

type Reading = {
  label: string;
  /** Null is never printed as zero. */
  value: number | null;
  denominator: number | null;
  note: string;
};

/**
 * Every Featured Offer state, counted separately with its own denominator.
 * No state is folded into another, and a missing result is never shown as zero.
 */
function readings(counts: FeaturedOfferCounts): Reading[] {
  return [
    {
      label: "Featured Offer present",
      value: counts.present,
      denominator: counts.population,
      note: "Amazon showed a purchasing offer at the last check.",
    },
    {
      label: "Featured Offer withheld",
      value: counts.withheld,
      denominator: counts.population,
      note: "Amazon showed no purchasing offer at the last check.",
    },
    {
      label: "No active offer",
      value: counts.noActiveOffer,
      denominator: counts.population,
      note: "The catalog has no current offer for this listing, so no Amazon check is needed.",
    },
    {
      label: "Check failed",
      value: counts.checkFailed,
      denominator: counts.population,
      note: "The last attempt failed. These are not counted as present and not as zero.",
    },
    {
      label: "Not checked",
      value: counts.notChecked,
      denominator: counts.population,
      note: "This collector has not reached these listings yet.",
    },
    {
      label: "Competitive External Price available",
      value: counts.benchmarkPresent,
      denominator: counts.keepaClassified,
      note: "Of the listings Amazon checked, this many have a published outside price. Amazon does not name the retailer.",
    },
    {
      label: "Confirmed withheld above outside price",
      value: counts.confirmedHighPrice,
      denominator: counts.withheld,
      note: "Withheld listings whose offer and outside price came from one check, with the offer above that price.",
    },
  ];
}

function ReadingCard({ reading }: { reading: Reading }) {
  return (
    <div className="retail-finding fo-reading">
      <span className="metric-card-label">{reading.label}</span>
      <span className="metric-card-val">
        {reading.value == null ? "Not stored" : formatInt(reading.value)}
        {reading.value != null && reading.denominator != null ? (
          <span className="fo-denominator"> of {formatInt(reading.denominator)}</span>
        ) : null}
      </span>
      <span className="metric-card-sub">{reading.note}</span>
    </div>
  );
}

export function FeaturedOfferReadings({
  counts,
  freshness = null,
}: {
  counts: FeaturedOfferCounts;
  freshness?: CanvasFreshnessRow[] | null;
}) {
  return (
    <div className="content-box fo-readings" style={{ marginTop: 12 }}>
      <div className="content-box-title">
        <span>Featured Offer readings</span>
        <span className="tag-badge tag-neutral">
          {formatInt(counts.current)} of {formatInt(counts.population)} current
        </span>
      </div>
      <p className="retail-missing">{confirmedSuppressionSentence(counts)}</p>
      <p className="retail-missing">{classificationCoverageSentence(counts)}</p>
      <p className="retail-missing">{benchmarkCoverageSentence(counts)}</p>
      <p className="retail-missing">
        {featuredOfferFreshnessSentence(counts, featuredOfferJob(freshness))}
      </p>
      <div className="retail-finding-grid fo-reading-grid">
        {readings(counts).map((reading) => (
          <ReadingCard key={reading.label} reading={reading} />
        ))}
      </div>
    </div>
  );
}
