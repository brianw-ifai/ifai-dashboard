"use client";

import { useState } from "react";
import { CitationControlsStrip } from "@/components/v3/live/ai-search/CitationControlsStrip";
import { CitationDomainsMix } from "@/components/v3/live/ai-search/CitationDomainsMix";
import { CitationExecutiveGrid, GapsCard } from "@/components/v3/live/ai-search/CitationExecutiveGrid";
import {
  citationGaps,
  ownedByQuestionType,
  ownedPresence,
  topDomainBars,
  type CitationGap,
  type RoleOwnedGroup,
  type RoleOwnedPresence,
} from "@/lib/ai-search/citation-insights";
import { citationPies, unbrandedAnswerPie, unbrandedBrandPie } from "@/lib/ai-search/citation-pies";
import type { CitationRead, CitationScope } from "@/lib/ai-search/citations";
import { groupCitations } from "@/lib/ai-search/citations";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

export type CitationPick =
  | { field: "domain" | "class" | "engine" | "category"; value: string }
  | { field: "gap"; value: string; simulationIds: string[] }
  | { field: "role_owned"; value: string; simulationIds: string[] }
  | null;

export function CitationHero({
  snapshot,
  read,
  scope,
  scopeNoun,
  onScope,
  onPick,
  showSmallSample,
}: {
  snapshot: AiSearchSnapshot;
  read: CitationRead;
  scope: CitationScope;
  scopeNoun: string;
  onScope: (scope: CitationScope) => void;
  onPick: (pick: CitationPick) => void;
  /** A single run still marks a thin lead-rate group. A month total does not. */
  showSmallSample: boolean;
}) {
  const [showAllGaps, setShowAllGaps] = useState(false);
  const presence = ownedPresence(read);
  const pies = citationPies(read);
  const mixPie = pies?.find((pie) => pie.id === "classes") ?? null;
  const byQuestionType = ownedByQuestionType(snapshot.calls, read, scope);
  const unbrandedPie = unbrandedAnswerPie(byQuestionType);
  const brandPie = unbrandedBrandPie(snapshot.calls, read);
  const gapResult = citationGaps(snapshot.calls, read, scope);
  const domains = groupCitations(read.rows, (row) => row.domain);
  const bars = topDomainBars(read, 10);
  const shoppingScope = scope !== "probe";

  const onPickGap = (gap: CitationGap) => {
    onPick({ field: "gap", value: gap.category, simulationIds: gap.simulationIds });
  };

  const onPickRoleGroup = (role: RoleOwnedPresence, group: RoleOwnedGroup) => {
    onPick({
      field: "role_owned",
      value: `${role.role}:${group.key}`,
      simulationIds: group.simulationIds,
    });
  };

  return (
    <div className="citation-hero" data-citation-hero>
      <CitationControlsStrip
        snapshot={snapshot}
        read={read}
        scope={scope}
        onScope={onScope}
        scopeNoun={scopeNoun}
        part="scopes"
      />
      {pies == null ? (
        <p data-citation-reconcile>
          The charts are hidden because their slices do not match the table totals.
        </p>
      ) : null}
      <CitationExecutiveGrid
        presence={presence}
        scopeNoun={scopeNoun}
        unbrandedPie={unbrandedPie}
        mixPie={mixPie}
        brandPie={brandPie}
        byQuestionType={byQuestionType}
        rolesApplicable={shoppingScope}
        showSmallSample={showSmallSample}
        onPickRoleGroup={onPickRoleGroup}
      />
      <CitationControlsStrip
        snapshot={snapshot}
        read={read}
        scope={scope}
        onScope={onScope}
        scopeNoun={scopeNoun}
        part="meta"
      />
      <div className="citation-row-domains">
        <CitationDomainsMix
          bars={bars}
          totalDomains={domains.length}
          onPickDomain={(domain) => onPick({ field: "domain", value: domain })}
          onShowAllDomains={() => onPick(null)}
        />
        <GapsCard
          gaps={gapResult?.gaps ?? []}
          ok={gapResult?.ok ?? false}
          applicable={shoppingScope}
          showAll={showAllGaps}
          onToggleAll={() => setShowAllGaps((value) => !value)}
          onPickGap={onPickGap}
        />
      </div>
    </div>
  );
}
