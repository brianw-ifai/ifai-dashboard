"use client";

import type { ReactNode } from "react";
import { clientColumn, type RetailColumn } from "@/components/v3/live/ResizableTable";
import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { EvidenceLink } from "@/components/v3/live/ai-search/EvidenceLink";
import { AI_TABS } from "@/lib/ai-search/canvas-surfaces";
import type { AiTermKey } from "@/lib/ai-search/definitions";
import {
  HEADLINE_ROLES,
  ROLE_LABELS,
  sumRoleTallies,
  type HeadlineRole,
  type RoleGroupTally,
} from "@/lib/ai-search/question-role";
import { isSmallSample, type OutcomeTally } from "@/lib/ai-search/run-metrics";
import { pct, resolvedPhrase, summarizeRun } from "@/lib/ai-search/summary";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";

const SIM = AI_TABS.simulations;

const ROLE_TERMS: Record<HeadlineRole, AiTermKey> = {
  unbranded_discovery: "unbranded discovery",
  branded_consideration: "branded consideration",
};

export function roleColumn(role: HeadlineRole, width = 196): RetailColumn {
  const name = ROLE_LABELS[role];
  return {
    ...clientColumn(role, name, "number", width, 150),
    label: <AiTerm term={ROLE_TERMS[role]}>{name}</AiTerm>,
  };
}

/** A ranked rate sorts by its share. A small sample sorts as missing, so it is not ranked. */
export function roleRateSort(tally: OutcomeTally, largestResolved: number): SortInput {
  if (tally.resolved <= 0 || isSmallSample(tally.resolved, largestResolved)) return null;
  return tally.fenderWins / tally.resolved;
}

export function largestResolved(groups: readonly RoleGroupTally[], role: HeadlineRole): number {
  return Math.max(0, ...groups.map((group) => group.roles[role].resolved));
}

function roleLink(role: HeadlineRole, outcome: "fender_win" | "resolved", label: string, children: ReactNode) {
  return (
    <EvidenceLink focus={{ field: "role", value: `${role}/${outcome}` }} tab={SIM} label={label}>
      {children}
    </EvidenceLink>
  );
}

/** One role's Fender leads over its resolved answers. Percent only when the sample can be ranked. */
export function RoleCount({
  role,
  tally,
  largestResolved: largest,
}: {
  role: HeadlineRole;
  tally: OutcomeTally;
  largestResolved: number;
}) {
  const small = tally.resolved > 0 && isSmallSample(tally.resolved, largest);
  if (tally.resolved <= 0) {
    return <span data-ai-role-count={role}>No resolved answers</span>;
  }
  const name = ROLE_LABELS[role];
  return (
    <span data-ai-role-count={role} data-small-sample={small ? "true" : undefined}>
      {roleLink(role, "fender_win", `${name}: Fender/Squier leads`, tally.fenderWins)}
      {" of "}
      {roleLink(role, "resolved", `${name}: resolved answers`, tally.resolved)}
      <span className="ai-role-detail">
        {small ? <AiTerm term="small sample">Too few to compare</AiTerm> : pct(tally.fenderWins, tally.resolved)}
      </span>
    </span>
  );
}

function pairCount(role: HeadlineRole, tally: OutcomeTally, largest: number) {
  const name = ROLE_LABELS[role];
  if (tally.resolved <= 0) return <span data-ai-role-count={role}>None resolved</span>;
  const small = isSmallSample(tally.resolved, largest);
  return (
    <span data-ai-role-count={role} data-small-sample={small ? "true" : undefined}>
      {roleLink(role, "fender_win", `${name}: Fender/Squier leads`, tally.fenderWins)} of{" "}
      {roleLink(role, "resolved", `${name}: resolved answers`, tally.resolved)}
      {small ? null : <span className="ai-role-detail">{pct(tally.fenderWins, tally.resolved)}</span>}
    </span>
  );
}

/** Two counts for one engine-and-category cell. A small cell has no percent, and the two counts are not combined. */
export function RolePair({
  unbranded,
  branded,
  largestUnbranded,
  largestBranded,
}: {
  unbranded: OutcomeTally;
  branded: OutcomeTally;
  largestUnbranded: number;
  largestBranded: number;
}) {
  return (
    <>
      <div>Unbranded {pairCount("unbranded_discovery", unbranded, largestUnbranded)}</div>
      <div>Branded {pairCount("branded_consideration", branded, largestBranded)}</div>
    </>
  );
}

export function RoleSumLine({
  groups,
  preface,
}: {
  groups: readonly RoleGroupTally[];
  preface: string;
}) {
  return (
    <p className="ai-role-footnote" data-ai-role-totals>
      {preface}{" "}
      {HEADLINE_ROLES.map((role, index) => {
        const tally = sumRoleTallies(groups, role);
        const name = ROLE_LABELS[role];
        return (
          <span key={role} data-ai-role-total={role}>
            {index > 0 ? " " : null}
            <AiTerm term={ROLE_TERMS[role]}>{name}</AiTerm>
            {": "}
            {tally.resolved > 0 ? (
              <>
                Fender/Squier leads {roleLink(role, "fender_win", `${name}: Fender/Squier leads`, tally.fenderWins)} of{" "}
                {roleLink(role, "resolved", `${name}: resolved answers`, tally.resolved)} resolved answers (
                {pct(tally.fenderWins, tally.resolved)}).
              </>
            ) : (
              "no resolved answers."
            )}
          </span>
        );
      })}
    </p>
  );
}

function keptOut(tally: OutcomeTally): string {
  const parts = [resolvedPhrase(tally)];
  if (tally.unresolved > 0) parts.push(`${tally.unresolved} with no clear leader`);
  if (tally.errors > 0) parts.push(`${tally.errors} provider errors`);
  return parts.join(", ");
}

/** What stays out of the two rates, in the same words as the Run Summary cards. */
export function KeptOutNote({ snapshot }: { snapshot: AiSearchSnapshot }) {
  const s = summarizeRun(snapshot);
  return (
    <ul className="ai-role-footnote">
      <li>
        <AiTerm term="brand-associated discovery">Brand-associated discovery</AiTerm>:{" "}
        <EvidenceLink focus={{ field: "role", value: "brand_associated_discovery/resolved" }} tab={SIM}>
          {keptOut(s.roles.associated)}
        </EvidenceLink>
        . Counted on its own, not inside unbranded discovery.
      </li>
      <li>
        <AiTerm term="shopping guidance">Shopping guidance</AiTerm>:{" "}
        <EvidenceLink focus={{ field: "role", value: "shopping_guidance" }} tab={SIM}>
          {keptOut(s.roles.guidance)}
        </EvidenceLink>
        . Not in either rate above.
      </li>
      <li>
        <AiTerm term="product-fact question">Product-fact questions</AiTerm>:{" "}
        <EvidenceLink focus={{ field: "role", value: "product_fact" }} tab={SIM}>
          {keptOut(s.roles.productFact)}
        </EvidenceLink>
        . These are still stored as shopping prompts, and they are not in either rate above.
      </li>
      <li>
        <EvidenceLink focus={{ field: "kind", value: "probe" }} tab={SIM}>
          {s.probesAnswered} answered
        </EvidenceLink>{" "}
        <AiTerm term="product fact check">product fact checks</AiTerm> stay on their own tab.
      </li>
      <li>
        Answers with <AiTerm term="no clear leader">no clear leader</AiTerm> and{" "}
        <AiTerm term="provider error">provider errors</AiTerm> stay out of both denominators.
      </li>
    </ul>
  );
}
