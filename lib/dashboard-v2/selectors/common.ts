import { isPartialCoverage, rate, unavailable } from "../reading/build";
import { labelForAnyKind } from "../reading/labels";
import type { Coverage, Reading, RegistryRow, RegistryUnit, ThresholdRule } from "../reading/types";
import type {
  MetricRegistryRow,
  MetricValueRow,
  ReadingRunRow,
  SandboxBundle,
} from "../data/types";

/**
 * Shared pieces for the selectors. Every figure comes from a metric_value row, every coverage
 * from the reading_run that fed it, and every label from the metric_registry row. Nothing here
 * holds a figure.
 */

const UNITS: RegistryUnit[] = ["percent", "count", "timestamp", "none", "usd"];
const OWNERS: RegistryRow["owner"][] = ["intofocus", "client", "coo", "mixed"];
const CONFIDENCES: RegistryRow["confidence"][] = ["measured", "assumption", "estimate"];

function pick<T extends string>(value: string, allowed: T[], fallback: T): T {
  return (allowed as string[]).includes(value) ? (value as T) : fallback;
}

/** Maps a sandbox.metric_registry row to the reading model's RegistryRow. */
export function toRegistryRow(row: MetricRegistryRow): RegistryRow {
  const rule = row.status_rule;
  const threshold: ThresholdRule | undefined =
    rule && typeof rule.warn === "number" && typeof rule.danger === "number"
      ? { kind: rule.kind, warn: rule.warn, danger: rule.danger }
      : undefined;
  return {
    id: row.registry_id,
    name: row.name,
    meaning: row.meaning,
    unit: pick(row.unit, UNITS, "none"),
    source_tables: (row.source_tables ?? []).join(", "),
    population: row.population ?? "",
    formula: row.formula ?? "",
    owner: pick(row.owner, OWNERS, "mixed"),
    confidence: pick(row.confidence, CONFIDENCES, "measured"),
    notes: row.notes ?? "",
    threshold,
  };
}

export function registryKey(bundle: SandboxBundle, registryId: string): string {
  return `${bundle.clientId}:${registryId}`;
}

/** The registry row for an id, or null when the registry read failed or the row is missing. */
export function registryRow(bundle: SandboxBundle, registryId: string): RegistryRow | null {
  if (bundle.registry.error) return null;
  const row = bundle.registry.rows.find((r) => r.registry_id === registryId);
  return row ? toRegistryRow(row) : null;
}

/** Every metric_value row for a registry id, or [] when the part failed. */
export function metricRows(bundle: SandboxBundle, registryId: string): MetricValueRow[] {
  if (bundle.metricValues.error) return [];
  const key = registryKey(bundle, registryId);
  return bundle.metricValues.rows.filter((r) => r.registry_key === key);
}

export function runById(bundle: SandboxBundle, runId: string | null | undefined): ReadingRunRow | null {
  if (!runId || bundle.runs.error) return null;
  return bundle.runs.rows.find((r) => r.reading_run_id === runId) ?? null;
}

/** Coverage of a run: rows read of the population, as of when it finished, named by its workflow. */
export function coverageFromRun(run: ReadingRunRow): Coverage {
  return {
    read: run.rows_read,
    population: run.population_count,
    asOf: run.finished_at ?? run.started_at,
    runId: run.reading_run_id,
    source: run.workflow_name ?? run.source,
  };
}

/** The active-offer count the retail metrics are measured against, from catalog_monitored. */
export function activePopulation(bundle: SandboxBundle): number | null {
  const row = metricRows(bundle, "catalog_monitored").find(
    (r) => r.dimension_name === "offer_status" && r.dimension_value === "active",
  );
  return row && typeof row.numeric_value === "number" ? row.numeric_value : null;
}

/** Why a reading has no value: the part that failed, the missing registry row, or the missing value. */
export function missingReason(bundle: SandboxBundle, registryId: string, registry: RegistryRow | null): string {
  if (bundle.registry.error) return `The metric registry could not be read: ${bundle.registry.error}`;
  if (!registry) return `No registry row is stored for ${registryId}.`;
  if (bundle.metricValues.error) return `The metric values could not be read: ${bundle.metricValues.error}`;
  return registry.notes || "No value is stored for this reading yet.";
}

export type MetricReadingOptions = {
  /** Match one dimension row instead of the undimensioned row. */
  dimension?: { name: string; value: string };
  /** Mark the reading partial when its denominator is below the active-offer population. */
  againstActive?: boolean;
  /** Override the unit the value is shaped by (defaults to the registry unit). */
  unit?: RegistryUnit;
};

export type MetricReading = {
  reading: Reading<unknown>;
  registry: RegistryRow | null;
  row: MetricValueRow | null;
  run: ReadingRunRow | null;
  /** Numerator and denominator as stored, for the explainer sentence. */
  numerator: number | null;
  denominator: number | null;
};

function isPartialRun(run: ReadingRunRow | null, coverage: Coverage): boolean {
  if (run?.status === "partial") return true;
  return isPartialCoverage(coverage);
}

function coverageFor(bundle: SandboxBundle, row: MetricValueRow, registry: RegistryRow | null): { coverage: Coverage; run: ReadingRunRow | null } {
  const run = runById(bundle, row.reading_run_id);
  if (run) return { coverage: coverageFromRun(run), run };
  const read = row.denominator ?? row.numerator ?? 0;
  return {
    coverage: {
      read,
      population: null,
      asOf: row.computed_at,
      runId: row.reading_run_id,
      source: registry?.source_tables || "metric_value",
    },
    run: null,
  };
}

/**
 * One reading from one metric_value row. Percent units become a Rate from numerator and
 * denominator; every other unit takes numeric_value. Partial when the run is partial, read
 * fewer rows than its population, or (when asked) the denominator is below the active population.
 */
export function metricReading(bundle: SandboxBundle, registryId: string, options: MetricReadingOptions = {}): MetricReading {
  const registry = registryRow(bundle, registryId);
  const rows = metricRows(bundle, registryId);
  const row = options.dimension
    ? (rows.find((r) => r.dimension_name === options.dimension?.name && r.dimension_value === options.dimension?.value) ?? null)
    : (rows.find((r) => r.dimension_name === null) ?? null);

  if (!registry || !row) {
    return {
      reading: unavailable(missingReason(bundle, registryId, registry), registryId),
      registry,
      row,
      run: null,
      numerator: row?.numerator ?? null,
      denominator: row?.denominator ?? null,
    };
  }

  const unit = options.unit ?? registry.unit;
  const { coverage, run } = coverageFor(bundle, row, registry);
  const meta = { registryId, coverage };

  let reading: Reading<unknown>;
  if (unit === "percent") {
    reading = rate(row.numerator, row.denominator, meta);
  } else if (row.numeric_value === null || row.numeric_value === undefined) {
    reading = unavailable("The stored value is empty.", registryId, coverage);
  } else {
    reading = { status: "complete", value: row.numeric_value, coverage, registryId };
  }

  if (reading.status !== "unavailable") {
    let partial = isPartialRun(run, coverage);
    if (options.againstActive && row.denominator !== null) {
      const active = activePopulation(bundle);
      if (active !== null && row.denominator < active) partial = true;
    }
    if (partial) reading = { ...reading, status: "partial" };
  }

  return { reading, registry, row, run, numerator: row.numerator, denominator: row.denominator };
}

/** A reading that holds a composite text value built from stored rows (seller mix, channels). */
export function compositeReading(
  registryId: string,
  text: string,
  coverage: Coverage,
  partial: boolean,
): Reading<string> {
  return { status: partial ? "partial" : "complete", value: text, coverage, registryId };
}

/** Human labels for stored codes come from the one label map in reading/labels.ts. */
export function codeLabel(code: string): string {
  return labelForAnyKind(code);
}
