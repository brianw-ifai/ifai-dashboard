"use client";

import { CitationPieDisc } from "@/components/v3/live/ai-search/CitationPieDisc";
import {
  aiReadinessHeroes,
  type AiReadinessHeroModel,
} from "@/lib/fender-canvas/ai-readiness-lead";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

const PIE_SIZE = "citation-pie-disc citation-pie-disc-findability";

function ReadinessHero({ hero }: { hero: AiReadinessHeroModel }) {
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
    </div>
  );
}

/**
 * AI Readiness top heroes: label, percentage, ratio, and pie disc.
 * Same height family as Findability leads. The page-found hero has no row filter.
 */
export function AiReadinessLead({ bundle }: { bundle: CanvasBundle }) {
  const heroes = aiReadinessHeroes(bundle.m);

  return (
    <div className="ai-readiness-lead" data-ai-readiness-lead="">
      <div className="findability-leads" data-ai-readiness-heroes="">
        {heroes.map((hero) => (
          <ReadinessHero key={hero.id} hero={hero} />
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
