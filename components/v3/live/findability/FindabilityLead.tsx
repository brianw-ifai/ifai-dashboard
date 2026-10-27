"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import {
  findabilityLeadBuckets,
  outcomeLeadPie,
  outcomeLeadTip,
  outcomeRatioFigure,
  outcomeShareColor,
  outcomeShareFigure,
} from "@/lib/findability/lead";
import { OUTCOME_DEFINITION, OUTCOME_LABEL, bucketLabel } from "@/lib/findability/copy";
import type { FindabilityBucket, OutcomeCounts } from "@/lib/findability/outcomes";

const FINDABILITY_PIE_SIZE = "citation-pie-disc citation-pie-disc-findability";

function outcomeLabel(bucket: FindabilityBucket): string {
  return bucket === "other" ? bucketLabel("other") : OUTCOME_LABEL[bucket];
}

function outcomeDefinition(bucket: FindabilityBucket): string | null {
  return bucket === "other" ? null : OUTCOME_DEFINITION[bucket];
}

/**
 * One Findability outcome hero: label, share percentage, N of M, and a disc of
 * that outcome versus the rest of this read.
 */
function OutcomeHero({
  counts,
  bucket,
}: {
  counts: OutcomeCounts;
  bucket: FindabilityBucket;
}) {
  const label = outcomeLabel(bucket);
  const definition = outcomeDefinition(bucket);
  const pct = outcomeShareFigure(counts, bucket);
  const ratio = outcomeRatioFigure(counts, bucket);
  const pie = outcomeLeadPie(counts, bucket);
  const color = outcomeShareColor(counts, bucket);

  return (
    <div
      className="content-box findability-lead-card"
      data-findability-lead-outcome={bucket}
    >
      <div>
        {definition ? (
          <span
            className="ifai-term"
            data-ifai-tooltip-title={label}
            data-ifai-tooltip-desc={definition}
            tabIndex={0}
            aria-label={`${label}: ${definition}`}
          >
            {label}
          </span>
        ) : (
          <span>{label}</span>
        )}
      </div>
      <div
        data-findability-lead-row=""
        className="findability-lead-row"
      >
        <div className="findability-lead-figures">
          <span
            className="ai-lead-figure"
            style={color ? { color } : undefined}
            data-findability-lead-figure=""
            data-findability-lead-pct=""
            data-findability-lead-count={counts[bucket]}
            data-findability-lead-total={counts.total}
            {...(bucket === "exact_official_product"
              ? { "data-findability-exact": counts.exact_official_product }
              : {})}
          >
            {pct}
          </span>
          <span className="findability-lead-ratio" data-findability-lead-ratio="">
            {ratio}
          </span>
        </div>
        {pie ? (
          <CitationPieDisc
            pie={pie}
            sizeClass={FINDABILITY_PIE_SIZE}
            tip={outcomeLeadTip(counts, bucket)}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Findability tab heroes: one bubble per outcome (and Other when present).
 * Each shows share of this read, N of M, and a disc. Prose and count cards stay below.
 */
export function FindabilityLead({ counts }: { counts: OutcomeCounts }) {
  if (counts.total <= 0) {
    return (
      <div className="content-box" data-findability-lead="">
        <span
          className="ai-lead-figure"
          data-findability-lead-figure=""
          data-findability-empty=""
        >
          This official-page read has no listings.
        </span>
      </div>
    );
  }

  const buckets = findabilityLeadBuckets(counts);

  return (
    <div className="findability-leads" data-findability-lead="">
      {buckets.map((bucket) => (
        <OutcomeHero key={bucket} counts={counts} bucket={bucket} />
      ))}
    </div>
  );
}
