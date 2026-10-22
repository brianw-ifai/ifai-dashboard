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

function RoleOwnedCard({
  byType,
  applicable,
  onPickGroup,
}: {
  byType: OwnedByQuestionType | null;
  applicable: boolean;
  onPickGroup: (role: RoleOwnedPresence, group: RoleOwnedGroup) => void;
}) {
  if (!applicable) {
    return (
      <section className="citation-card citation-card-roles" data-citation-association>
        <h3 className="citation-card-kicker">Fender-owned pages by question type</h3>
        <p className="citation-card-note">
          Lead rates apply to shopping answers. Product fact checks do not name a brand leader, so this
          comparison is not shown for this scope.
        </p>
      </section>
    );
  }
  if (!byType || !byType.ok) {
    return (
      <section className="citation-card citation-card-roles" data-citation-association>
        <h3 className="citation-card-kicker">Fender-owned pages by question type</h3>
        <p data-citation-reconcile>
          The role bars are hidden because owned and not-owned groups do not match each role&apos;s
          resolved total.
        </p>
      </section>
    );
  }

  const { insight } = byType;
  return (
    <section className="citation-card citation-card-roles" data-citation-association>
      <h3 className="citation-card-kicker">Fender-owned pages by question type</h3>
      <p className="citation-role-insight" data-citation-role-insight>
        Fender-owned pages were cited in {insight.withOwned} of {insight.resolved}{" "}
        {insight.roleLabel.toLowerCase()} answers
      </p>
      <p className="citation-card-note">Denominator is resolved answers, matching the headline rates.</p>
      <ul className="citation-role-list">
        {byType.roles.map((role) => {
          const total = Math.max(role.resolved, 1);
          return (
            <li key={role.role} data-citation-role={role.role} data-role-resolved={role.resolved}>
              <div className="citation-role-label">
                <strong>{role.roleLabel}</strong>
                <span>
                  {role.withOwned} with a Fender-owned page · {role.withoutOwned} without
                </span>
              </div>
              <div
                className="citation-role-track"
                role="img"
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
                      {group.smallSample ? ` · ${SMALL_SAMPLE_LABEL}` : ""}
                    </li>
                  ) : null,
                )}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="citation-card-caveat" data-citation-assoc-caveat>
        Counts from one run. An association, not proof of cause.
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
        Unbranded discovery and branded consideration categories with the most competitor-led answers
        that cited no Fender-owned page
      </p>
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
  ownedPie,
  byQuestionType,
  rolesApplicable,
  gaps,
  gapsOk,
  gapsApplicable,
  showAllGaps,
  onToggleAllGaps,
  onPickGap,
  onPickRoleGroup,
}: {
  presence: OwnedPresence;
  scopeNoun: string;
  ownedPie: CitationPie | null;
  byQuestionType: OwnedByQuestionType | null;
  rolesApplicable: boolean;
  gaps: CitationGap[];
  gapsOk: boolean;
  gapsApplicable: boolean;
  showAllGaps: boolean;
  onToggleAllGaps: () => void;
  onPickGap: (gap: CitationGap) => void;
  onPickRoleGroup: (role: RoleOwnedPresence, group: RoleOwnedGroup) => void;
}) {
  return (
    <div className="citation-exec-grid" data-citation-exec>
      <PresenceCard presence={presence} scopeNoun={scopeNoun} ownedPie={ownedPie} />
      <RoleOwnedCard
        byType={byQuestionType}
        applicable={rolesApplicable}
        onPickGroup={onPickRoleGroup}
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
