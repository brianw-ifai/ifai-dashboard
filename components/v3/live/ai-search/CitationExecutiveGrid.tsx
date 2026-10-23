"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { CitationPieDisc, CitationPieLegend } from "@/components/v3/live/ai-search/CitationPieDisc";
import type { CitationPie } from "@/lib/ai-search/citation-pies";
import type {
  CitationGap,
  OwnedByQuestionType,
  OwnedPresence,
  RoleOwnedGroup,
  RoleOwnedPresence,
} from "@/lib/ai-search/citation-insights";
import type { HeadlineRole } from "@/lib/ai-search/question-role";
import { SMALL_SAMPLE_LABEL, pct } from "@/lib/ai-search/summary";

const ROLE_TERMS: Partial<Record<HeadlineRole, "unbranded discovery" | "branded consideration">> = {
  unbranded_discovery: "unbranded discovery",
  branded_consideration: "branded consideration",
};

function RoleName({ role, label }: { role: HeadlineRole; label: string }) {
  const term = ROLE_TERMS[role];
  return term ? <AiTerm term={term}>{label}</AiTerm> : <span>{label}</span>;
}

function PresenceCard({
  presence,
  scopeNoun,
  unbrandedPie,
  unbranded,
}: {
  presence: OwnedPresence;
  scopeNoun: string;
  unbrandedPie: CitationPie | null;
  unbranded: { withOwned: number; resolved: number } | null;
}) {
  const hero = unbranded
    ? `${unbranded.withOwned} of ${unbranded.resolved}`
    : presence.answered > 0
      ? pct(presence.answersWithOwned, presence.answered)
      : "No answers";
  const share = unbranded ? pct(unbranded.withOwned, unbranded.resolved) : null;
  return (
    <section className="citation-card citation-card-presence" data-citation-presence>
      <h3 className="citation-card-kicker">
        <AiTerm term="Fender-owned">Fender-owned</AiTerm> pages
      </h3>
      <p className="citation-hero-value" data-citation-hero-value>
        {hero}
      </p>
      {share && share !== "No resolved answers" ? (
        <p className="citation-hero-pct" data-citation-hero-pct>
          <span className="citation-hero-pct-figure">{share}</span> cited a Fender-owned page
        </p>
      ) : null}
      <p className="citation-hero-ratio" data-citation-hero-ratio>
        {unbranded ? (
          <>
            <AiTerm term="unbranded discovery">unbranded discovery</AiTerm> answers cited a Fender-owned page
          </>
        ) : (
          `${presence.answersWithOwned} of ${presence.answered} ${scopeNoun} cited at least one Fender-owned page`
        )}
      </p>
      <p className="citation-card-secondary" data-ai-fender-owned>
        {presence.answersWithOwned} of {presence.answered} {scopeNoun} cited at least one Fender-owned page.{" "}
        {presence.ownedLinks} of {presence.totalLinks} cited links (
        {pct(presence.ownedLinks, presence.totalLinks)}) led to Fender-owned sites.
      </p>
      {unbrandedPie && unbrandedPie.total > 0 ? (
        <figure className="citation-pie citation-pie-owned" data-citation-pie="unbranded" data-pie-total={unbrandedPie.total}>
          <CitationPieDisc
            pie={unbrandedPie}
            sizeClass="citation-pie-disc citation-pie-disc-owned"
            tip={`This pie is the same count as ${hero}. ${unbrandedPie.slices.map((slice) => `${slice.count} ${slice.label}`).join(". ")}. Total ${unbrandedPie.total} unbranded discovery answers.`}
          />
          <figcaption>
            <strong>Same {hero} answers</strong>
            <CitationPieLegend pie={unbrandedPie} />
            <p>Slices total {unbrandedPie.total} {unbrandedPie.totalLabel}.</p>
          </figcaption>
        </figure>
      ) : null}
    </section>
  );
}

function RoleGroupButton({
  role,
  group,
  share,
  onPick,
}: {
  role: RoleOwnedPresence;
  group: RoleOwnedGroup;
  share: number;
  onPick: (role: RoleOwnedPresence, group: RoleOwnedGroup) => void;
}) {
  if (group.resolved <= 0 || share <= 0) return null;
  const lead = `Fender led ${group.fenderLed} of ${group.resolved}`;
  const sample = group.smallSample ? ` · ${SMALL_SAMPLE_LABEL}` : "";
  return (
    <button
      type="button"
      className={`citation-role-seg citation-role-seg-${group.key}`}
      style={{ flexGrow: share, flexBasis: 0 }}
      data-citation-role-group={`${role.role}:${group.key}`}
      data-role-n={group.resolved}
      data-ai-pick={`role_owned:${role.role}:${group.key}`}
      onClick={() => onPick(role, group)}
      aria-label={`${role.roleLabel}: ${group.label}, ${group.resolved} resolved answers. ${lead}${sample}.`}
    >
      <span className="citation-role-seg-count">{group.resolved}</span>
    </button>
  );
}

function SourceMixFigure({ pie }: { pie: CitationPie | null }) {
  if (pie == null) {
    return <p data-citation-reconcile>The source-mix chart is hidden because its slices do not match the cited-link total.</p>;
  }
  if (pie.total === 0) return <p className="citation-card-note">No cited links in this view.</p>;
  return (
    <>
      <h3 className="citation-card-kicker">Source mix</h3>
      <figure className="citation-pie citation-pie-mix" data-citation-pie="classes" data-pie-total={pie.total}>
        <CitationPieDisc
          pie={pie}
          sizeClass="citation-pie-disc citation-pie-disc-mix"
          tip={`Source mix of ${pie.total} cited links. ${pie.slices.map((slice) => `${slice.label} ${slice.count}`).join(". ")}.`}
        />
        <figcaption>
          <strong>
            Cited links by <AiTerm term="source class">source class</AiTerm>
          </strong>
          <CitationPieLegend pie={pie} />
          <p>
            Slices total {pie.total} {pie.totalLabel}.
          </p>
        </figcaption>
      </figure>
    </>
  );
}

function RoleOwnedCard({
  byType,
  applicable,
  mixPie,
  showSmallSample,
  onPickGroup,
}: {
  byType: OwnedByQuestionType | null;
  applicable: boolean;
  mixPie: CitationPie | null;
  showSmallSample: boolean;
  onPickGroup: (role: RoleOwnedPresence, group: RoleOwnedGroup) => void;
}) {
  const mix = <SourceMixFigure pie={mixPie} />;
  if (!applicable) {
    return (
      <section className="citation-card citation-card-mix" data-citation-association>
        {mix}
        <p className="citation-card-note">
          Lead rates apply to shopping answers. Product fact checks do not name a brand leader, so this
          comparison is not shown for this scope.
        </p>
      </section>
    );
  }
  if (!byType || !byType.ok) {
    return (
      <section className="citation-card citation-card-mix" data-citation-association>
        {mix}
        <p data-citation-reconcile>
          The role bars are hidden because owned and not-owned groups do not match each role&apos;s
          resolved total.
        </p>
      </section>
    );
  }

  return (
    <section className="citation-card citation-card-mix" data-citation-association>
      {mix}
      <h3 className="citation-card-kicker citation-card-kicker-follow">By question type</h3>
      <ul className="citation-role-list">
        {byType.roles.map((role) => {
          const total = Math.max(role.resolved, 1);
          return (
            <li key={role.role} data-citation-role={role.role} data-role-resolved={role.resolved}>
              <div className="citation-role-label">
                <strong>
                  <RoleName role={role.role} label={role.roleLabel} />
                </strong>
                <span>
                  {role.withOwned} of {role.resolved} cited a Fender-owned page
                </span>
              </div>
              <div
                className="citation-role-track citation-chart-tip ifai-term"
                role="img"
                tabIndex={0}
                data-ifai-tooltip-title={role.roleLabel}
                data-ifai-tooltip-desc={`${role.withOwned} of ${role.resolved} ${role.roleLabel} answers cited a Fender-owned page. ${role.withoutOwned} did not.`}
                aria-label={`${role.roleLabel}: ${role.withOwned} of ${role.resolved} resolved answers cited a Fender-owned page. ${role.withoutOwned} did not.`}
              >
                <RoleGroupButton
                  role={role}
                  group={role.groups[0]}
                  share={role.groups[0].resolved / total}
                  onPick={onPickGroup}
                />
                <RoleGroupButton
                  role={role}
                  group={role.groups[1]}
                  share={role.groups[1].resolved / total}
                  onPick={onPickGroup}
                />
              </div>
              <ul className="citation-role-leads">
                {role.groups.map((group) =>
                  group.resolved > 0 ? (
                    <li key={group.key} data-citation-role-lead={`${role.role}:${group.key}`}>
                      {group.label}: Fender led {group.fenderLed} of {group.resolved}
                      {showSmallSample && group.smallSample ? ` · ${SMALL_SAMPLE_LABEL}` : ""}
                    </li>
                  ) : null,
                )}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="citation-card-caveat" data-citation-assoc-caveat>
        {showSmallSample ? "Counts from one run. " : "Counts add the runs in this window. "}
        An association, not proof of cause.
      </p>
    </section>
  );
}

function BrandCard({ pie }: { pie: CitationPie | null }) {
  return (
    <section className="citation-card citation-card-brands" data-citation-brands>
      <h3 className="citation-card-kicker">
        Brands cited in <AiTerm term="unbranded discovery">unbranded discovery</AiTerm>
      </h3>
      {pie == null ? (
        <p data-citation-reconcile>The brand chart is hidden because its slices do not match the brand-site link total.</p>
      ) : pie.total === 0 ? (
        <p className="citation-card-note">No brand website was cited in unbranded discovery answers.</p>
      ) : (
        <figure className="citation-pie citation-pie-mix" data-citation-pie="brands" data-pie-total={pie.total}>
          <CitationPieDisc
            pie={pie}
            sizeClass="citation-pie-disc citation-pie-disc-brands"
            tip={`Brand websites cited in unbranded discovery. ${pie.slices.map((slice) => `${slice.label} ${slice.count}`).join(". ")}. Retail and editorial sites are in the source mix.`}
          />
          <figcaption>
            <strong>Brand websites only</strong>
            <CitationPieLegend pie={pie} />
            <p>Slices total {pie.total} {pie.totalLabel}.</p>
          </figcaption>
        </figure>
      )}
    </section>
  );
}

export function GapsCard({
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
      <p className="citation-card-lead">Competitor led, and no Fender-owned page was cited</p>
      {visible.length === 0 ? (
        <p className="citation-card-note">
          No competitor-led discovery or consideration answers lacked a Fender-owned citation.
        </p>
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
                  <span>{gap.competitor} led · no Fender-owned page cited</span>
                  {gap.topDomains.length > 0 ? (
                    <span className="citation-gap-domains">
                      Top cited: {gap.topDomains.map((d) => `${d.domain} (${d.links})`).join(", ")}
                    </span>
                  ) : (
                    <span className="citation-gap-domains">
                      No third-party links recorded in those answers
                    </span>
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
  unbrandedPie,
  mixPie,
  brandPie,
  byQuestionType,
  rolesApplicable,
  showSmallSample,
  onPickRoleGroup,
}: {
  presence: OwnedPresence;
  scopeNoun: string;
  unbrandedPie: CitationPie | null;
  mixPie: CitationPie | null;
  brandPie: CitationPie | null;
  byQuestionType: OwnedByQuestionType | null;
  rolesApplicable: boolean;
  showSmallSample: boolean;
  onPickRoleGroup: (role: RoleOwnedPresence, group: RoleOwnedGroup) => void;
}) {
  return (
    <div className="citation-exec-grid" data-citation-exec>
      <PresenceCard
        presence={presence}
        scopeNoun={scopeNoun}
        unbrandedPie={unbrandedPie}
        unbranded={
          rolesApplicable && byQuestionType?.ok
            ? { withOwned: byQuestionType.insight.withOwned, resolved: byQuestionType.insight.resolved }
            : null
        }
      />
      <RoleOwnedCard
        byType={byQuestionType}
        applicable={rolesApplicable}
        mixPie={mixPie}
        showSmallSample={showSmallSample}
        onPickGroup={onPickRoleGroup}
      />
      {rolesApplicable ? <BrandCard pie={brandPie} /> : null}
    </div>
  );
}
