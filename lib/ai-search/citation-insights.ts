import {
  groupCitations,
  SOURCE_CLASS_LABELS,
  SOURCE_CLASS_ORDER,
  type CitationEvidence,
  type CitationRead,
  type CitationScope,
  type SourceClass,
} from "@/lib/ai-search/citations";
import { callOutcome, categoryLabel, isSmallSample } from "@/lib/ai-search/run-metrics";
import type { AiCallRow } from "@/lib/ai-search/types";

export type OwnedPresence = {
  /** Shopping (or scoped) answers that cited at least one Fender-owned page. */
  answersWithOwned: number;
  answered: number;
  ownedLinks: number;
  totalLinks: number;
};

export type AssociationArm = {
  key: "cited_owned" | "no_owned";
  label: string;
  fenderLed: number;
  resolved: number;
  smallSample: boolean;
};

export type CitationAssociation = {
  arms: [AssociationArm, AssociationArm];
  /** Sum of both arms' resolved counts. Must equal resolved shopping answers in view. */
  resolvedTotal: number;
  ok: boolean;
};

export type CitationGap = {
  category: string;
  categoryLabel: string;
  /** Competitor-led answers in this category with no Fender-owned citation. */
  count: number;
  /** Leading competitor brand among those losing answers. */
  competitor: string;
  /** Top third-party domains cited in those same answers, by link count. */
  topDomains: Array<{ domain: string; links: number; sourceClass: SourceClass }>;
  simulationIds: string[];
};

export type DomainBar = {
  domain: string;
  links: number;
  answers: number;
  sourceClass: SourceClass;
  classLabel: string;
};

export type SourceMixSlice = {
  key: SourceClass;
  label: string;
  count: number;
};

export type SourceMix = {
  total: number;
  slices: SourceMixSlice[];
  ok: boolean;
};

export type OwnedPie = {
  total: number;
  owned: number;
  other: number;
  ok: boolean;
};

function answeredInScope(calls: AiCallRow[], scope: CitationScope): AiCallRow[] {
  return calls.filter((call) => {
    if (call.call_status !== "answered") return false;
    if (scope === "all") return true;
    return call.prompt_kind === scope;
  });
}

/** Commercial answered calls among the scoped answered set (lead outcomes only exist here). */
function shoppingAnswered(calls: AiCallRow[], scope: CitationScope): AiCallRow[] {
  return answeredInScope(calls, scope).filter((call) => call.prompt_kind === "commercial");
}

function ownedAnswerIds(rows: CitationEvidence[]): Set<string> {
  return new Set(rows.filter((row) => row.sourceClass === "fender_owned").map((row) => row.simulationId));
}

/** A. Share of scoped answers that cited at least one Fender-owned page, plus owned link share. */
export function ownedPresence(read: CitationRead): OwnedPresence {
  const ownedIds = ownedAnswerIds(read.rows);
  const ownedLinks = read.rows.filter((row) => row.sourceClass === "fender_owned").length;
  return {
    answersWithOwned: ownedIds.size,
    answered: read.answered,
    ownedLinks,
    totalLinks: read.rows.length,
  };
}

export function ownedPie(read: CitationRead): OwnedPie | null {
  const owned = read.rows.filter((row) => row.sourceClass === "fender_owned").length;
  const other = read.rows.length - owned;
  if (owned < 0 || other < 0) return null;
  const ok = owned + other === read.rows.length;
  if (!ok) return null;
  return { total: read.rows.length, owned, other, ok };
}

/**
 * B. Fender lead rate among resolved shopping answers that cited a Fender-owned page,
 * versus those that did not. Uses callOutcome: fender_win / resolved
 * (resolved = fender_win + disqualified + competitor_win).
 */
export function citationAssociation(
  calls: AiCallRow[],
  read: CitationRead,
  scope: CitationScope,
): CitationAssociation | null {
  if (scope === "probe") return null;
  const shopping = shoppingAnswered(calls, scope);
  const ownedIds = ownedAnswerIds(read.rows);

  const arms: AssociationArm[] = (
    [
      ["cited_owned", "Cited a Fender-owned page", true],
      ["no_owned", "Did not cite a Fender-owned page", false],
    ] as const
  ).map(([key, label, hasOwned]) => {
    const group = shopping.filter((call) => ownedIds.has(call.id) === hasOwned);
    let fenderLed = 0;
    let resolved = 0;
    for (const call of group) {
      const outcome = callOutcome(call);
      if (outcome === "fender_win") {
        fenderLed += 1;
        resolved += 1;
      } else if (outcome === "fender_win_disqualified" || outcome === "competitor_win") {
        resolved += 1;
      }
    }
    return { key, label, fenderLed, resolved, smallSample: false };
  });

  const resolvedTotal = arms[0].resolved + arms[1].resolved;
  let expectedResolved = 0;
  for (const call of shopping) {
    const outcome = callOutcome(call);
    if (
      outcome === "fender_win" ||
      outcome === "fender_win_disqualified" ||
      outcome === "competitor_win"
    ) {
      expectedResolved += 1;
    }
  }
  const largest = Math.max(arms[0].resolved, arms[1].resolved);
  arms[0].smallSample = isSmallSample(arms[0].resolved, largest);
  arms[1].smallSample = isSmallSample(arms[1].resolved, largest);

  const ok = resolvedTotal === expectedResolved;
  return {
    arms: [arms[0], arms[1]],
    resolvedTotal,
    ok,
  };
}

/**
 * C. Shopping categories ranked by competitor-led answers with no Fender-owned citation.
 * Returns null when the ranking cannot reconcile (should not happen with stored data).
 */
export function citationGaps(
  calls: AiCallRow[],
  read: CitationRead,
  scope: CitationScope,
): { gaps: CitationGap[]; totalLosing: number; ok: boolean } | null {
  if (scope === "probe") return null;
  const shopping = shoppingAnswered(calls, scope);
  const ownedIds = ownedAnswerIds(read.rows);
  const rowsBySim = new Map<string, CitationEvidence[]>();
  for (const row of read.rows) {
    const list = rowsBySim.get(row.simulationId) ?? [];
    list.push(row);
    rowsBySim.set(row.simulationId, list);
  }

  const losing = shopping.filter(
    (call) => callOutcome(call) === "competitor_win" && !ownedIds.has(call.id),
  );
  const byCategory = new Map<string, AiCallRow[]>();
  for (const call of losing) {
    const key = call.category ?? "";
    byCategory.set(key, [...(byCategory.get(key) ?? []), call]);
  }

  const gaps: CitationGap[] = [...byCategory.entries()]
    .map(([category, bucket]) => {
      const brands = new Map<string, number>();
      for (const call of bucket) {
        const brand = call.primary_brand?.trim() || "Brand not recorded";
        brands.set(brand, (brands.get(brand) ?? 0) + 1);
      }
      const competitor =
        [...brands.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
        "Brand not recorded";

      const domainCounts = new Map<string, { links: number; sourceClass: SourceClass }>();
      for (const call of bucket) {
        for (const row of rowsBySim.get(call.id) ?? []) {
          if (row.sourceClass === "fender_owned") continue;
          const entry = domainCounts.get(row.domain) ?? { links: 0, sourceClass: row.sourceClass };
          entry.links += 1;
          domainCounts.set(row.domain, entry);
        }
      }
      const topDomains = [...domainCounts.entries()]
        .map(([domain, entry]) => ({ domain, links: entry.links, sourceClass: entry.sourceClass }))
        .sort((a, b) => b.links - a.links || a.domain.localeCompare(b.domain))
        .slice(0, 3);

      return {
        category,
        categoryLabel: categoryLabel(category),
        count: bucket.length,
        competitor,
        topDomains,
        simulationIds: bucket.map((call) => call.id).sort(),
      };
    })
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const rankedSum = gaps.reduce((sum, gap) => sum + gap.count, 0);
  return { gaps, totalLosing: losing.length, ok: rankedSum === losing.length };
}

export function topDomainBars(read: CitationRead, limit = 10): DomainBar[] {
  return groupCitations(read.rows, (row) => row.domain)
    .slice(0, limit)
    .map((group) => {
      const sourceClass =
        read.rows.find((row) => row.domain === group.key)?.sourceClass ?? ("other" as SourceClass);
      return {
        domain: group.key,
        links: group.rows,
        answers: group.answers,
        sourceClass,
        classLabel: SOURCE_CLASS_LABELS[sourceClass],
      };
    });
}

export function sourceMix(read: CitationRead): SourceMix | null {
  const grouped = groupCitations(read.rows, (row) => row.sourceClass);
  const slices = SOURCE_CLASS_ORDER.map((key) => ({
    key,
    label: SOURCE_CLASS_LABELS[key],
    count: grouped.find((group) => group.key === key)?.rows ?? 0,
  })).filter((slice) => slice.count > 0);
  const sum = slices.reduce((n, slice) => n + slice.count, 0);
  if (sum !== read.rows.length) return null;
  return { total: read.rows.length, slices, ok: true };
}
