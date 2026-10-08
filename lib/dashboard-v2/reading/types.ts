/**
 * The reading contract for dashboard v2. See docs/v2/03-reading-model.md.
 * Every figure on screen is a Reading<T>. A reading is never a bare number.
 */

export type ReadingStatus = "complete" | "partial" | "unavailable";

export type Coverage = {
  /** Rows the run actually read. */
  read: number;
  /** Rows the run should have read, or null when the population is unknown. */
  population: number | null;
  /** ISO timestamp of the read, or null when none is stored. */
  asOf: string | null;
  /** The reading run that produced the figure, or null when none is stored. */
  runId: string | null;
  /** Source table or feed name, for the explainer. */
  source: string;
};

export type Reading<T> =
  | { status: "complete"; value: T; coverage: Coverage; registryId: string }
  | { status: "partial"; value: T; coverage: Coverage; registryId: string }
  | { status: "unavailable"; reason: string; coverage: Coverage | null; registryId: string };

export type Rate = { numerator: number; denominator: number; pct: number };

/** A candidate for a headline. Lower rank numbers are higher priority. */
export type Finding = {
  registryId: string;
  rank: number;
  reading: Reading<unknown>;
};

export type RegistryUnit = "percent" | "count" | "timestamp" | "none" | "usd";
export type RegistryOwner = "intofocus" | "client" | "coo" | "mixed";
export type RegistryConfidence = "measured" | "assumption" | "estimate";

export type ThresholdKind = "higher_is_better" | "lower_is_better" | "count_is_bad";

/**
 * Where the warning and danger lines sit for one metric.
 * The numbers are in the metric's own unit (percent points for a rate, a count for a count).
 */
export type ThresholdRule = {
  kind: ThresholdKind;
  warn: number;
  danger: number;
};

/** One row of data/v2/metric-registry.seed.json, plus an optional threshold rule. */
export type RegistryRow = {
  id: string;
  name: string;
  meaning: string;
  unit: RegistryUnit;
  source_tables: string;
  population: string;
  formula: string;
  owner: RegistryOwner;
  confidence: RegistryConfidence;
  notes: string;
  threshold?: ThresholdRule;
};

export type NodeStatus = "danger" | "warning" | "success" | "neutral";
