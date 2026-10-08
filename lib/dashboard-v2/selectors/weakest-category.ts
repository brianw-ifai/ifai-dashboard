import { rate, unavailable } from "../reading/build";
import type { Rate, Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { coverageFromRun, metricRows, missingReason, registryRow, runById } from "./common";

export const CATEGORY_SHARE_ID = "ai_answer_share_by_category";

/** Categories with fewer resolved answers than this are not ranked (registry population rule). */
export const MIN_RESOLVED_FOR_RANKING = 10;

/** Prompts in this category name the client's own products, so it is left out of the ranking. */
export const EXCLUDED_CATEGORY = "hallucinations";

export type CategoryShare = {
  category: string;
  clientShare: Reading<Rate>;
  topRival: string | null;
  rivalShare: Reading<Rate> | null;
  resolved: number;
};

export type WeakestCategory = {
  /** The weakest category's client share. Unavailable when nothing can be ranked. */
  reading: Reading<Rate>;
  category: string | null;
  topRival: string | null;
  rivalShare: Reading<Rate> | null;
  /** Client share minus the top rival's share, in percentage points. */
  gapPoints: Reading<number>;
  /** Every ranked category, weakest first. */
  categories: CategoryShare[];
};

export function selectWeakestCategory(bundle: SandboxBundle): WeakestCategory {
  const registry = registryRow(bundle, CATEGORY_SHARE_ID);
  const rows = metricRows(bundle, CATEGORY_SHARE_ID);
  const none = (reason: string): WeakestCategory => ({
    reading: unavailable(reason, CATEGORY_SHARE_ID),
    category: null,
    topRival: null,
    rivalShare: null,
    gapPoints: unavailable(reason, CATEGORY_SHARE_ID),
    categories: [],
  });
  if (!registry || rows.length === 0) return none(missingReason(bundle, CATEGORY_SHARE_ID, registry));

  const categories: CategoryShare[] = [];
  for (const row of rows) {
    if (row.dimension_name !== "category" || !row.dimension_value) continue;
    if (row.dimension_value === EXCLUDED_CATEGORY) continue;
    if ((row.denominator ?? 0) < MIN_RESOLVED_FOR_RANKING) continue;
    const run = runById(bundle, row.reading_run_id);
    const coverage = run
      ? coverageFromRun(run)
      : { read: row.denominator ?? 0, population: null, asOf: row.computed_at, runId: row.reading_run_id, source: registry.source_tables };
    const clientShare = rate(row.numerator, row.denominator, { registryId: CATEGORY_SHARE_ID, coverage });
    const rivalRow = rows.find(
      (r) => r.dimension_name === "category_top_rival" && r.dimension_value?.startsWith(`${row.dimension_value}:`),
    );
    const topRival = rivalRow?.dimension_value?.slice(row.dimension_value.length + 1) ?? null;
    const rivalShare = rivalRow
      ? rate(rivalRow.numerator, rivalRow.denominator, { registryId: CATEGORY_SHARE_ID, coverage })
      : null;
    categories.push({ category: row.dimension_value, clientShare, topRival, rivalShare, resolved: row.denominator ?? 0 });
  }

  const ranked = categories
    .filter((c) => c.clientShare.status !== "unavailable")
    .sort((a, b) => {
      const ap = a.clientShare.status === "unavailable" ? Number.POSITIVE_INFINITY : a.clientShare.value.pct;
      const bp = b.clientShare.status === "unavailable" ? Number.POSITIVE_INFINITY : b.clientShare.value.pct;
      return ap - bp || a.category.localeCompare(b.category);
    });
  if (ranked.length === 0) return none("No category has enough resolved answers to rank.");

  const weakest = ranked[0];
  const share = weakest.clientShare;
  const rival = weakest.rivalShare;
  const gapPoints: Reading<number> =
    share.status !== "unavailable" && rival && rival.status !== "unavailable"
      ? { status: share.status, value: share.value.pct - rival.value.pct, coverage: share.coverage, registryId: CATEGORY_SHARE_ID }
      : unavailable("No rival share is stored for this category.", CATEGORY_SHARE_ID, share.status === "unavailable" ? null : share.coverage);

  return {
    reading: share,
    category: weakest.category,
    topRival: weakest.topRival,
    rivalShare: rival,
    gapPoints,
    categories: ranked,
  };
}
