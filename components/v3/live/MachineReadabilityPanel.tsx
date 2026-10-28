"use client";

import { useState } from "react";
import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import { MachineReadabilityPageTable } from "@/components/v3/live/MachineReadabilityPageTable";
import {
  machineReadabilityHeroes,
  sharedGapSentence,
  type MachineHeroId,
  type MachineHeroModel,
  type SpecPageSummary,
} from "@/lib/fender-canvas/machine-readability";

const RETAIL_PIE_SIZE = "citation-pie-disc citation-pie-disc-retail";
const PAGES_TABLE_ID = "machine-readability-pages";

type OpenTable = MachineHeroId | "closed";

function ExploreChevron() {
  return (
    <svg
      className="retail-explore-chevron"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-hidden="true"
    >
      <path
        d="M2.2 4.2 6 8l3.8-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Same card as the Catalog Governance heroes: label, share, N of M, disc, and a table chevron. */
function MachineHero({
  hero,
  open,
  onToggle,
}: {
  hero: MachineHeroModel;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="content-box findability-lead-card"
      data-machine-hero={hero.id}
      style={{ flex: "0 0 auto", width: "fit-content", maxWidth: "100%" }}
    >
      <div>
        <span
          className="ifai-term"
          data-ifai-tooltip-title={hero.label}
          data-ifai-tooltip-desc={hero.definition}
          tabIndex={0}
          aria-label={`${hero.label}: ${hero.definition}`}
        >
          {hero.label}
        </span>
      </div>
      <div className="findability-lead-row">
        <div className="findability-lead-figures">
          <span
            className="ai-lead-figure"
            style={{ color: hero.color }}
            data-machine-hero-percent=""
            data-machine-hero-numerator={hero.numerator ?? ""}
            data-machine-hero-denominator={hero.denominator ?? ""}
          >
            {hero.percent}
          </span>
          {hero.ratio ? <span className="findability-lead-ratio">{hero.ratio}</span> : null}
        </div>
        {hero.pie ? (
          <CitationPieDisc pie={hero.pie} sizeClass={RETAIL_PIE_SIZE} tip={hero.tip ?? undefined} />
        ) : null}
      </div>
      <span className="metric-card-sub">{hero.explainer}</span>
      {hero.denominator ? (
        <button
          type="button"
          className="retail-explore"
          aria-label={hero.label}
          aria-expanded={open}
          aria-controls={PAGES_TABLE_ID}
          onClick={onToggle}
          style={{ marginTop: "auto", alignSelf: "center" }}
        >
          <ExploreChevron />
        </button>
      ) : null}
    </div>
  );
}

function MachineReadabilityNotes({ summary }: { summary: SpecPageSummary | null }) {
  const shared = sharedGapSentence(summary);
  return (
    <div
      className="content-box"
      data-machine-readability-notes=""
      style={{ flex: "1 1 240px", minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div className="ceo-callout" style={{ margin: 0 }}>
        <div className="ceo-callout-header">
          <span>What is machine-readable product data?</span>
        </div>
        <div className="ceo-callout-body">
          Shoppers read fender.com&apos;s spec tables. AI engines read the Schema.org product data
          behind the page and take what is there as fact. A spec that only appears as page text has
          to be guessed. {shared}
        </div>
      </div>
    </div>
  );
}

export function MachineReadabilityPanel({ summary }: { summary: SpecPageSummary | null }) {
  const [openTable, setOpenTable] = useState<OpenTable>("spec_block");
  const heroes = machineReadabilityHeroes(summary);

  function toggle(which: MachineHeroId) {
    setOpenTable((prev) => (prev === which ? "closed" : which));
  }

  return (
    <div className="readiness-surface" data-machine-readability="">
      <div
        data-machine-readability-lead=""
        style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "stretch" }}>
          {heroes.map((hero) => (
            <MachineHero
              key={hero.id}
              hero={hero}
              open={openTable === hero.id}
              onToggle={() => toggle(hero.id)}
            />
          ))}
        </div>
        <MachineReadabilityNotes summary={summary} />
      </div>

      {summary && openTable !== "closed" ? (
        <MachineReadabilityPageTable
          summary={summary}
          filter={openTable}
          tableId={PAGES_TABLE_ID}
        />
      ) : null}
    </div>
  );
}
