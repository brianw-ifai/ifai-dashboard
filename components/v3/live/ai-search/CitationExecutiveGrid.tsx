"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { CitationPieDisc, CitationPieLegend } from "@/components/v3/live/ai-search/CitationPieDisc";
import type { CitationPie } from "@/lib/ai-search/citation-pies";
import type {
  AssociationArm,
  CitationGap,
  OwnedPresence,
} from "@/lib/ai-search/citation-insights";
import { SMALL_SAMPLE_LABEL, pct } from "@/lib/ai-search/summary";

function PresenceCard({
  presence,
  scopeNoun,
  ownedPie,
}: {
  presence: OwnedPresence;
  scopeNoun: string;
  ownedPie: CitationPie | null;
}) {
  const value =
    presence.answered > 0 ? pct(presence.answersWithOwned, presence.answered) : "No answers";
  return (
    <section className="citation-card citation-card-presence" data-citation-presence>
      <h3 className="citation-card-kicker">
        <AiTerm term="Fender-owned">Fender-owned</AiTerm> presence
      </h3>
      <p className="citation-hero-value" data-citation-hero-value>
        {value}
      </p>
      <p className="citation-hero-ratio" data-citation-hero-ratio>
        {presence.answersWithOwned} of {presence.answered} {scopeNoun} cited at least one Fender-owned
        page
      </p>
      <p className="citation-card-secondary" data-ai-fender-owned>
        {presence.ownedLinks} of {presence.totalLinks} cited links (
        {pct(presence.ownedLinks, presence.totalLinks)}) led to Fender-owned sites
      </p>
      {ownedPie && ownedPie.total > 0 ? (
        <figure className="citation-pie citation-pie-owned" data-citation-pie="owned" data-pie-total={ownedPie.total}>
          <CitationPieDisc pie={ownedPie} sizeClass="citation-pie-disc citation-pie-disc-owned" />
          <figcaption>
            <strong>{ownedPie.title}</strong>
            <CitationPieLegend pie={ownedPie} />
            <p>Slices total {ownedPie.total} {ownedPie.totalLabel}.</p>
          </figcaption>
        </figure>
      ) : null}
    </section>
  );
}

function AssociationCard({
  arms,
  ok,
  applicable,
}: {
  arms: [AssociationArm, AssociationArm] | null;
  ok: boolean;
  applicable: boolean;
}) {
  if (!applicable) {
    return (
      <section className="citation-card citation-card-association" data-citation-association>
        <h3 className="citation-card-kicker">Citations and outcomes</h3>
        <p className="citation-card-note">
          Lead rates apply to shopping answers. Product fact checks do not name a brand leader, so this
          comparison is not shown for this scope.
        </p>
      </section>
    );
  }
  if (!arms || !ok) {
    return (
      <section className="citation-card citation-card-association" data-citation-association>
        <h3 className="citation-card-kicker">Citations and outcomes</h3>
        <p data-citation-reconcile>
          The association bars are hidden because their samples do not match the resolved shopping total.
        </p>
      </section>
    );
  }
  const maxResolved = Math.max(arms[0].resolved, arms[1].resolved, 1);
  return (
    <section className="citation-card citation-card-association" data-citation-association>
      <h3 className="citation-card-kicker">Citations and outcomes</h3>
      <p className="citation-card-lead">
        Fender lead rate among resolved shopping answers
      </p>
      <ul className="citation-assoc-bars">
        {arms.map((arm) => {
          const width = arm.resolved > 0 ? (100 * arm.fenderLed) / arm.resolved : 0;
          const rate = arm.resolved > 0 ? pct(arm.fenderLed, arm.resolved) : "No resolved answers";
          return (
            <li key={arm.key} data-citation-assoc={arm.key} data-assoc-n={arm.resolved}>
              <div className="citation-assoc-label">
                <span>{arm.label}</span>
                <strong>
                  {rate}
                  {arm.smallSample ? ` · ${SMALL_SAMPLE_LABEL}` : ""}
                </strong>
              </div>
              <div
                className="citation-assoc-track"
                role="img"
                aria-label={`${arm.label}: Fender led ${arm.fenderLed} of ${arm.resolved} answers (${rate}${arm.smallSample ? `, ${SMALL_SAMPLE_LABEL}` : ""}). Scale 0 to 100 percent.`}
              >
                <div
                  className="citation-assoc-fill"
                  style={{ width: `${width}%` }}
                  data-assoc-max={maxResolved}
                />
              </div>
              <p className="citation-assoc-detail">
                Fender led {arm.fenderLed} of {arm.resolved} answers
                {arm.smallSample ? ` · ${SMALL_SAMPLE_LABEL}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="citation-card-caveat" data-citation-assoc-caveat>
        This is an association, not proof of cause. The prompts and categories in each group differ.
      </p>
    </section>
  );
}

function GapsCard({
  gaps,
  ok,
  applicable,
  showAll,
  onToggleAll,
  onPickGap,
}: {
  gaps: CitationGap[];
  ok: boolean;
  applicable: boolean;
  showAll: boolean;
  onToggleAll: () => void;
  onPickGap: (gap: CitationGap) => void;
}) {
  if (!applicable) {
    return (
      <section className="citation-card citation-card-gaps" data-citation-gaps>
        <h3 className="citation-card-kicker">Biggest actionable gaps</h3>
        <p className="citation-card-note">
          Gap ranking uses competitor-led shopping answers. It is not shown for product fact checks.
        </p>
      </section>
    );
  }
  if (!ok) {
    return (
      <section className="citation-card citation-card-gaps" data-citation-gaps>
        <h3 className="citation-card-kicker">Biggest actionable gaps</h3>
        <p data-citation-reconcile>
          The gap ranking is hidden because category counts do not match the losing-answer total.
        </p>
      </section>
    );
  }
  const visible = showAll ? gaps : gaps.slice(0, 3);
  return (
    <section className="citation-card citation-card-gaps" data-citation-gaps>
      <h3 className="citation-card-kicker">Biggest actionable gaps</h3>
      <p className="citation-card-lead">
        Shopping categories with the most competitor-led answers that cited no Fender-owned page
      </p>
      {visible.length === 0 ? (
        <p className="citation-card-note">No competitor-led shopping answers lacked a Fender-owned citation.</p>
      ) : (
        <ol className="citation-gap-list">
          {visible.map((gap) => (
            <li key={gap.category}>
              <button
                type="button"
                className="citation-gap-btn"
                data-citation-gap={gap.category}
                data-ai-pick={`gap:${gap.category}`}
                onClick={() => onPickGap(gap)}
              >
                <span className="citation-gap-count">{gap.count}</span>
                <span className="citation-gap-body">
                  <strong>{gap.categoryLabel}</strong>
                  <span>
                    {gap.competitor} led · no Fender-owned page cited
                  </span>
                  {gap.topDomains.length > 0 ? (
                    <span className="citation-gap-domains">
                      Top cited: {gap.topDomains.map((d) => `${d.domain} (${d.links})`).join(", ")}
                    </span>
                  ) : (
                    <span className="citation-gap-domains">No third-party links recorded in those answers</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {gaps.length > 3 ? (
        <button type="button" className="citation-gap-more" data-citation-gaps-toggle onClick={onToggleAll}>
          {showAll ? "Show top three" : `See full ranking (${gaps.length} categories)`}
        </button>
      ) : null}
    </section>
  );
}

export function CitationExecutiveGrid({
  presence,
  scopeNoun,
  ownedPie,
  association,
  associationApplicable,
  gaps,
  gapsOk,
  gapsApplicable,
  showAllGaps,
  onToggleAllGaps,
  onPickGap,
}: {
  presence: OwnedPresence;
  scopeNoun: string;
  ownedPie: CitationPie | null;
  association: { arms: [AssociationArm, AssociationArm]; ok: boolean } | null;
  associationApplicable: boolean;
  gaps: CitationGap[];
  gapsOk: boolean;
  gapsApplicable: boolean;
  showAllGaps: boolean;
  onToggleAllGaps: () => void;
  onPickGap: (gap: CitationGap) => void;
}) {
  return (
    <div className="citation-exec-grid" data-citation-exec>
      <PresenceCard presence={presence} scopeNoun={scopeNoun} ownedPie={ownedPie} />
      <AssociationCard
        arms={association?.arms ?? null}
        ok={association?.ok ?? false}
        applicable={associationApplicable}
      />
      <GapsCard
        gaps={gaps}
        ok={gapsOk}
        applicable={gapsApplicable}
        showAll={showAllGaps}
        onToggleAll={onToggleAllGaps}
        onPickGap={onPickGap}
      />
    </div>
  );
}
