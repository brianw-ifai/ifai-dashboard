"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import {
  aiReadinessHeroes,
  type AiReadinessHeroModel,
} from "@/lib/fender-canvas/ai-readiness-lead";
import { formatPct, formatRatio } from "@/lib/fender-canvas/format";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

const PIE_SIZE = "citation-pie-disc citation-pie-disc-findability";

export type MissingPageControl = {
  active: boolean;
  onToggle: () => void;
};

/** Show/Hide filter for rows with no stored fender.com page. Lives on the page-found hero. */
function MissingPageTogglePill({
  control,
  foundResult,
}: {
  control: MissingPageControl;
  foundResult: string;
}) {
  const action = control.active ? "Hide" : "Show";
  const explanation = control.active
    ? "Hide this filter and show every row again."
    : "Show only the checked SKUs with no stored fender.com page.";
  return (
    <button
      type="button"
      className={`spec-found-pill${control.active ? " active" : ""}`}
      aria-pressed={control.active}
      aria-controls="spec-readiness-by-asin"
      aria-label={`fender.com page found ${foundResult}. ${explanation}`}
      data-spec-filter="missing-fender-page"
      onClick={control.onToggle}
    >
      <span className="spec-found-pill-action">{action}</span>
    </button>
  );
}

function ReadinessHero({
  hero,
  missingPageControl,
  foundResult,
}: {
  hero: AiReadinessHeroModel;
  missingPageControl?: MissingPageControl;
  foundResult: string;
}) {
  return (
    <div
      className="content-box findability-lead-card"
      data-ai-readiness-hero={hero.id}
    >
      <div>
        {hero.definition ? (
          <span
            className="ifai-term"
            data-ifai-tooltip-title={hero.label}
            data-ifai-tooltip-desc={hero.definition}
            tabIndex={0}
            aria-label={`${hero.label}: ${hero.definition}`}
          >
            {hero.label}
          </span>
        ) : (
          <span>{hero.label}</span>
        )}
      </div>
      <div className="findability-lead-row" data-ai-readiness-hero-row="">
        <div className="findability-lead-figures">
          <span
            className="ai-lead-figure"
            style={hero.color ? { color: hero.color } : undefined}
            data-ai-readiness-hero-percent=""
          >
            {hero.percent}
          </span>
          {hero.ratio ? (
            <span className="findability-lead-ratio" data-ai-readiness-hero-ratio="">
              {hero.ratio}
            </span>
          ) : null}
        </div>
        {hero.pie ? (
          <CitationPieDisc pie={hero.pie} sizeClass={PIE_SIZE} tip={hero.tip ?? undefined} />
        ) : null}
      </div>
      {hero.filterControl && missingPageControl ? (
        <div className="ai-readiness-hero-filter">
          <MissingPageTogglePill control={missingPageControl} foundResult={foundResult} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * AI Readiness top heroes: label, percentage, ratio, and pie disc.
 * Replaces the Metric/Result summary table. Same family as Findability leads.
 */
export function AiReadinessLead({
  bundle,
  missingPageControl,
}: {
  bundle: CanvasBundle;
  missingPageControl?: MissingPageControl;
}) {
  const { m } = bundle;
  const heroes = aiReadinessHeroes(m);
  const foundResult = `${formatPct(m.spec_fender_found_pct)} (${formatRatio(m.spec_fender_found, m.spec_checked)})`;

  return (
    <div className="ai-readiness-lead" data-ai-readiness-lead="">
      <div className="findability-leads" data-ai-readiness-heroes="">
        {heroes.map((hero) => (
          <ReadinessHero
            key={hero.id}
            hero={hero}
            missingPageControl={missingPageControl}
            foundResult={foundResult}
          />
        ))}
      </div>
      <p className="ai-readiness-lead-note">
        The rows under these figures are the missing-field and per-ASIN reads. Amazon attribute
        completeness is the average stored on the catalog spec read. The page-found figure above is
        that older spec read. Official-page outcomes are on the Findability tab. A family page there
        is not an exact product page, and this percentage is not that result.
      </p>
    </div>
  );
}
