export type HallucinationCauseRow = {
  root_cause: string | null;
  engine: string | null;
  category: string | null;
  prompt?: string | null;
};

export type HallucinationCauseGroup = {
  rootCause: string;
  count: number;
  engines: string[];
  categories: string[];
  examplePrompt: string | null;
};

export type HallucinationCauseSummary = {
  /** Flagged rows returned by the simulation read. */
  flagged: number;
  /** Flagged rows whose root_cause text is empty. */
  missingRootCause: number;
  groups: HallucinationCauseGroup[];
};

function unique(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const text = value?.trim();
    if (text) seen.add(text);
  }
  return [...seen];
}

/** Group stored root_cause text. Rows with no root cause are counted and not turned into a story. */
export function groupHallucinationCauses(rows: HallucinationCauseRow[]): HallucinationCauseSummary {
  const buckets = new Map<string, HallucinationCauseRow[]>();
  let missingRootCause = 0;

  for (const row of rows) {
    const text = row.root_cause?.trim() ?? "";
    if (!text) {
      missingRootCause += 1;
      continue;
    }
    const bucket = buckets.get(text);
    if (bucket) bucket.push(row);
    else buckets.set(text, [row]);
  }

  const groups = [...buckets.entries()]
    .map(([rootCause, bucket]) => ({
      rootCause,
      count: bucket.length,
      engines: unique(bucket.map((row) => row.engine)),
      categories: unique(bucket.map((row) => row.category)),
      examplePrompt: bucket.find((row) => row.prompt?.trim())?.prompt?.trim() ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.rootCause.localeCompare(b.rootCause));

  return {
    flagged: rows.length,
    missingRootCause,
    groups,
  };
}
