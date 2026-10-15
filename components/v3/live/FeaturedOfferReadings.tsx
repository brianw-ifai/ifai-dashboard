"use client";

import { formatInt } from "@/lib/fender-canvas/format";
import {
  coverageExceptionLabel,
  coverageExceptionsHealthy,
} from "@/lib/fender-canvas/coverage-exceptions";
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
 * Each Featured Offer state keeps its own count and denominator.
 * Unchecked and failed stay separate numbers inside one coverage card.
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

function CoverageExceptionsCard({ counts }: { counts: FeaturedOfferCounts }) {
  const healthy = coverageExceptionsHealthy(counts.notChecked, counts.checkFailed);
  return (
    <div
      className={`retail-finding fo-reading${healthy ? " ok" : ""}`}
      data-coverage-unchecked={counts.notChecked}
      data-coverage-failed={counts.checkFailed}
    >
      <span className="metric-card-label">Coverage exceptions</span>
      <span className="metric-card-val fo-coverage-value">
        {coverageExceptionLabel(counts.notChecked, counts.checkFailed)}
      </span>
      <span className="metric-card-sub">
        Unchecked listings have not been reached. Failed checks are not counted as present and not
        counted as zero. A failed check is not an unchecked listing.
      </span>
    </div>
  );
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
  const cards = readings(counts);
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
        {cards.slice(0, 3).map((reading) => (
          <ReadingCard key={reading.label} reading={reading} />
        ))}
        <CoverageExceptionsCard counts={counts} />
        {cards.slice(3).map((reading) => (
          <ReadingCard key={reading.label} reading={reading} />
        ))}
      </div>
    </div>
  );
}
