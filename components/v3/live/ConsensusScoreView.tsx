"use client";

import { useState, type ReactNode } from "react";
import { formatPct, formatRatio } from "@/lib/fender-canvas/format";
import type {
  DroppedComponent,
  PillarScore,
  ScoredComponent,
} from "@/lib/fender-canvas/consensus-scores";

function PlaceholderMark({
  title,
  tooltip,
}: {
  title: string;
  tooltip: string;
}) {
  return (
    <span
      className="ifai-term"
      data-ifai-tooltip-title={title}
      data-ifai-tooltip-desc={tooltip}
      tabIndex={0}
      aria-label={`${title}: ${tooltip}`}
    >
      *
    </span>
  );
}

function ComponentRow({
  row,
}: {
  row: ScoredComponent | DroppedComponent;
}) {
  const name = (
    <>
      {row.name}
      {row.placeholder && row.placeholderTooltip ? (
        <>
          {" "}
          <PlaceholderMark
            title={row.placeholderTitle ?? row.name}
            tooltip={row.placeholderTooltip}
          />
        </>
      ) : null}
    </>
  );

  if (!row.included) {
    return (
      <tr data-consensus-component={row.id} data-consensus-included="false">
        <td>{name}</td>
        <td colSpan={3} className="metric-card-sub">
          Not included
        </td>
      </tr>
    );
  }

  return (
    <tr data-consensus-component={row.id} data-consensus-included="true">
      <td>{name}</td>
      <td data-consensus-component-score="">{formatPct(row.score)}</td>
      <td data-consensus-component-weight="">{formatPct(row.weight)}</td>
      <td data-consensus-component-coverage="">
        {formatRatio(row.coverage.numerator, row.coverage.denominator)}
      </td>
    </tr>
  );
}

export function ComponentTable({
  pillar,
}: {
  pillar: PillarScore;
}) {
  if (!pillar.included) return null;
  return (
    <table className="table-sm table-no-row-hover" data-consensus-components={pillar.id}>
      <thead>
        <tr>
          <th>Component</th>
          <th>Score</th>
          <th>Weight</th>
          <th>Coverage</th>
        </tr>
      </thead>
      <tbody>
        {pillar.components.map((row) => (
          <ComponentRow key={row.id} row={row} />
        ))}
      </tbody>
    </table>
  );
}

export function PillarCard({
  pillar,
  open,
  onToggle,
  compact,
}: {
  pillar: PillarScore;
  open?: boolean;
  onToggle?: () => void;
  compact?: boolean;
}) {
  const canOpen = pillar.included && onToggle != null;
  const scoreLabel = !pillar.included
    ? (pillar.omittedLabel ?? "Not included")
    : pillar.score == null
      ? "Not available"
      : formatPct(pillar.score, 0);

  const body = (
    <>
      <div className="metric-card-label" data-consensus-pillar-name="">
        {pillar.name}
      </div>
      <div
        className="metric-card-val"
        data-consensus-pillar-score=""
        data-consensus-pillar-included={pillar.included ? "true" : "false"}
        style={
          pillar.included
            ? undefined
            : { fontSize: compact ? 14 : 16, color: "var(--text-muted)" }
        }
      >
        {scoreLabel}
      </div>
      {pillar.included && pillar.coverage ? (
        <div className="metric-card-sub" data-consensus-pillar-coverage="">
          {formatRatio(pillar.coverage.numerator, pillar.coverage.denominator)}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      className="content-box"
      data-consensus-pillar={pillar.id}
      style={{ flex: "1 1 0", minWidth: 140, margin: 0 }}
    >
      {canOpen ? (
        <button
          type="button"
          className="retail-finding-hit"
          aria-expanded={open}
          onClick={onToggle}
          style={{ textAlign: "left", width: "100%" }}
        >
          {body}
        </button>
      ) : (
        body
      )}
      {canOpen && open ? (
        <div style={{ marginTop: 10 }}>
          <ComponentTable pillar={pillar} />
        </div>
      ) : null}
    </div>
  );
}

export function ConsensusHero({
  score,
  coverage,
}: {
  score: number | null;
  coverage: { numerator: number; denominator: number };
}) {
  return (
    <div className="content-box" data-consensus-hero="" style={{ marginBottom: 12 }}>
      <div className="content-box-title">
        <span>AI Consensus</span>
      </div>
      <div
        className="ai-lead-figure"
        data-consensus-score=""
        style={{ fontSize: 42, lineHeight: 1.1 }}
      >
        {score == null ? "Not available" : formatPct(score, 0)}
      </div>
      <div className="metric-card-sub" data-consensus-coverage="">
        {formatRatio(coverage.numerator, coverage.denominator)}
      </div>
    </div>
  );
}

export function ConsensusPillars({
  foundation,
  commerce,
  actuation,
  defaultOpen,
}: {
  foundation: PillarScore;
  commerce: PillarScore;
  actuation: PillarScore;
  defaultOpen?: "foundation" | "commerce" | null;
}) {
  const [open, setOpen] = useState<"foundation" | "commerce" | null>(defaultOpen ?? null);

  function toggle(id: "foundation" | "commerce") {
    setOpen((current) => (current === id ? null : id));
  }

  return (
    <div
      data-consensus-pillars=""
      style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}
    >
      <PillarCard
        pillar={foundation}
        open={open === "foundation"}
        onToggle={() => toggle("foundation")}
      />
      <PillarCard
        pillar={commerce}
        open={open === "commerce"}
        onToggle={() => toggle("commerce")}
      />
      <PillarCard pillar={actuation} />
    </div>
  );
}

/** Commerce-only block for Catalog Health Retail Overview. */
export function CommerceScoreBlock({
  commerce,
  children,
}: {
  commerce: PillarScore;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="content-box" data-consensus-commerce-block="" style={{ marginBottom: 12 }}>
      <div className="content-box-title">
        <span>AI Commerce</span>
      </div>
      <button
        type="button"
        className="retail-finding-hit"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{ textAlign: "left", width: "100%" }}
      >
        <div
          className="ai-lead-figure"
          data-consensus-pillar-score=""
          data-consensus-pillar="commerce"
        >
          {commerce.score == null ? "Not available" : formatPct(commerce.score, 0)}
        </div>
        {commerce.coverage ? (
          <div className="metric-card-sub" data-consensus-pillar-coverage="">
            {formatRatio(commerce.coverage.numerator, commerce.coverage.denominator)}
          </div>
        ) : null}
      </button>
      {open ? (
        <div style={{ marginTop: 10 }}>
          <ComponentTable pillar={commerce} />
          {children}
        </div>
      ) : null}
    </div>
  );
}
