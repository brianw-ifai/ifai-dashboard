import type { Coverage, Rate, Reading } from "./types";

/** What a reading needs besides its value: who produced it and where it came from. */
export type ReadingMeta = {
  registryId: string;
  coverage: Coverage;
};

/** What a reading run tells us about itself. */
export type RunMeta = {
  registryId: string;
  runId: string | null;
  asOf: string | null;
  source: string;
};

export function complete<T>(value: T, meta: ReadingMeta): Reading<T> {
  return { status: "complete", value, coverage: meta.coverage, registryId: meta.registryId };
}

export function partial<T>(value: T, meta: ReadingMeta): Reading<T> {
  return { status: "partial", value, coverage: meta.coverage, registryId: meta.registryId };
}

export function unavailable<T = never>(
  reason: string,
  registryId: string,
  coverage: Coverage | null = null,
): Reading<T> {
  return { status: "unavailable", reason, coverage, registryId };
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** True when an input is absent: null, undefined, or a number that isn't finite. */
export function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "number" && !Number.isFinite(value)) return true;
  return false;
}

/** A run that read fewer rows than its population is not final. */
export function isPartialCoverage(coverage: Coverage): boolean {
  return coverage.population !== null && coverage.read < coverage.population;
}

/**
 * A rate reading. Returns unavailable when the denominator is zero or missing,
 * so the result is never NaN or Infinity.
 */
export function rate(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  meta: ReadingMeta,
): Reading<Rate> {
  if (isMissing(denominator)) {
    return unavailable("No denominator was stored.", meta.registryId, meta.coverage);
  }
  if (denominator === 0) {
    return unavailable("The denominator is zero, so there is no rate to show.", meta.registryId, meta.coverage);
  }
  if (isMissing(numerator)) {
    return unavailable("No numerator was stored.", meta.registryId, meta.coverage);
  }
  const num = numerator as number;
  const den = denominator as number;
  const value: Rate = { numerator: num, denominator: den, pct: (num / den) * 100 };
  return isPartialCoverage(meta.coverage) ? partial(value, meta) : complete(value, meta);
}

/**
 * A reading from one run. Partial when the run read fewer rows than its population,
 * complete otherwise. A missing value is unavailable, never zero.
 */
export function readingFromRun<T>(
  rowsRead: number,
  populationCount: number | null,
  value: T | null | undefined,
  meta: RunMeta,
): Reading<T> {
  const coverage: Coverage = {
    read: rowsRead,
    population: populationCount,
    asOf: meta.asOf,
    runId: meta.runId,
    source: meta.source,
  };
  if (isMissing(value)) {
    return unavailable("The run stored no value for this reading.", meta.registryId, coverage);
  }
  const readingMeta: ReadingMeta = { registryId: meta.registryId, coverage };
  const confirmed = value as T;
  return isPartialCoverage(coverage) ? partial(confirmed, readingMeta) : complete(confirmed, readingMeta);
}

/**
 * A stored zero with a run id is a confirmed reading of zero. It is complete, not missing.
 */
export function zeroWithRun(meta: RunMeta, rowsRead = 0): Reading<number> {
  return complete(0, {
    registryId: meta.registryId,
    coverage: { read: rowsRead, population: rowsRead, asOf: meta.asOf, runId: meta.runId, source: meta.source },
  });
}
