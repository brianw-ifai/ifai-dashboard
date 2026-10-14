"use client";

import { useMemo, useState, type ReactNode } from "react";
import { FindabilityTable } from "@/components/v3/live/findability/FindabilityTable";
import { useFindability } from "@/components/v3/live/findability/FindabilityContext";
import {
  DEALER_BUNDLE_NOTE,
  FAMILY_IS_NOT_EXACT,
  MACHINE_READABILITY_DISTINCTION,
  OUTCOME_DEFINITION,
  OUTCOME_LABEL,
  bucketLabel,
  findabilityHeadline,
  jsonLdNote,
} from "@/lib/findability/copy";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  FINDABILITY_OUTCOMES,
  countFindability,
  findabilityShape,
  rowsForOutcome,
  type FindabilityBucket,
  type FindabilityOutcome,
} from "@/lib/findability/outcomes";

function Term({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <span
      className="ifai-term"
      data-ifai-tooltip-title={title}
      data-ifai-tooltip-desc={description}
      tabIndex={0}
      aria-label={`${title}: ${description}`}
    >
      {children}
    </span>
  );
}

function OutcomeCount({
  outcome,
  count,
  selected,
  onSelect,
}: {
  outcome: FindabilityOutcome;
  count: number;
  selected: boolean;
  onSelect: (outcome: FindabilityOutcome) => void;
}) {
  const label = OUTCOME_LABEL[outcome];
  const description = OUTCOME_DEFINITION[outcome];
  return (
    <div className="metric-card-sm findability-outcome" data-selected={selected ? "true" : "false"} data-findability-outcome={outcome}>
      <span className="metric-card-label">
        <Term title={label} description={description}>
          {label}
        </Term>
      </span>
      <button
        type="button"
        className="findability-count"
        aria-pressed={selected}
        data-findability-count={count}
        aria-label={`${formatInt(count)} ${label}. ${description}`}
        onClick={() => onSelect(outcome)}
      >
        {formatInt(count)}
      </button>
    </div>
  );
}

export function FindabilityPanel() {
  const read = useFindability();
  const [selected, setSelected] = useState<FindabilityBucket | null>(null);

  const counts = useMemo(
    () => (read.phase === "ready" ? countFindability(read.rows) : null),
    [read],
  );
  const filtered = useMemo(() => {
    if (read.phase !== "ready" || !selected) return [];
    return rowsForOutcome(read.rows, selected);
  }, [read, selected]);

  if (read.phase === "loading") {
    return (
      <div className="findability-panel">
        <p className="findability-note">Reading official pages…</p>
      </div>
    );
  }
  if (read.phase === "error") {
    return (
      <div className="findability-panel">
        <p className="findability-note">The official-page read did not load.</p>
      </div>
    );
  }

  const shape = findabilityShape(counts!);
  const headline =
    counts!.total === 0
      ? "This official-page read has no listings."
      : findabilityHeadline(counts!);

  const choose = (outcome: FindabilityOutcome) => {
    setSelected((current) => (current === outcome ? null : outcome));
  };

  return (
    <div className="findability-panel" data-findability-shape={shape} data-findability-total={counts!.total}>
      <p className="findability-headline" data-findability-headline="">
        {headline}
      </p>
      <p className="findability-note">
        Each listing is one outcome. {FAMILY_IS_NOT_EXACT} Open a count to see the listings, titles,
        and official pages behind it.
      </p>
      <div className="findability-outcomes">
        {FINDABILITY_OUTCOMES.map((outcome) => (
          <OutcomeCount
            key={outcome}
            outcome={outcome}
            count={counts![outcome]}
            selected={selected === outcome}
            onSelect={choose}
          />
        ))}
        {counts!.other > 0 ? (
          <div className="metric-card-sm findability-outcome" data-selected={selected === "other" ? "true" : "false"} data-findability-outcome="other">
            <span className="metric-card-label">{bucketLabel("other")}</span>
            <button
              type="button"
              className="findability-count"
              aria-pressed={selected === "other"}
              data-findability-count={counts!.other}
              onClick={() => setSelected((current) => (current === "other" ? null : "other"))}
            >
              {formatInt(counts!.other)}
            </button>
          </div>
        ) : null}
      </div>
      {shape === "partial" ? (
        <p className="findability-note">Some outcomes are zero in this read. A zero is a real count.</p>
      ) : null}
      <p className="findability-note">{jsonLdNote(read.rows)} {MACHINE_READABILITY_DISTINCTION}</p>
      {selected ? (
        <div className="content-box" style={{ marginTop: 4 }}>
          <div className="content-box-title">
            <span>{bucketLabel(selected)}</span>
            <span className="tag-badge tag-neutral">{formatInt(filtered.length)} listings</span>
          </div>
          <p className="findability-note">
            {read.dealerBundleLoaded ? DEALER_BUNDLE_NOTE : "Dealer bundle status did not load with this read."}
          </p>
          <FindabilityTable key={selected} rows={filtered} />
        </div>
      ) : null}
    </div>
  );
}
