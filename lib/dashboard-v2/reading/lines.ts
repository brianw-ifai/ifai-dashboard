import { formatAsOf, formatInt, formatReadingParts, isRate, UNAVAILABLE_WORD } from "./format";
import type { Reading, RegistryRow, RegistryUnit } from "./types";

/**
 * Short lines every surface shares: the figure alone, the coverage line, the as-of line, and the
 * numerator-and-denominator sentence. Each one is built from the reading, never typed.
 */

/** The figure by itself, or the word "unavailable". */
export function figureText(reading: Reading<unknown>, unit?: RegistryUnit): string {
  return formatReadingParts(reading, unit).value;
}

/** "read 438 of 1,007, not final" for a partial reading; the as-of for a complete one; the reason otherwise. */
export function coverageLine(reading: Reading<unknown>): string {
  if (reading.status === "unavailable") return `${UNAVAILABLE_WORD}: ${reading.reason}`;
  const { read, population, asOf } = reading.coverage;
  if (reading.status === "partial") {
    const span = population === null ? `read ${formatInt(read)}, population unknown` : `read ${formatInt(read)} of ${formatInt(population)}`;
    return `${span}, not final`;
  }
  return `as of ${formatAsOf(asOf)}`;
}

/** "as of Oct 8, 2026, 19:41 UTC", or the reason when the reading has no coverage. */
export function asOfLine(reading: Reading<unknown>): string {
  if (reading.coverage?.asOf) return `as of ${formatAsOf(reading.coverage.asOf)}`;
  if (reading.status === "unavailable") return `${UNAVAILABLE_WORD}: ${reading.reason}`;
  return "no date stored";
}

/**
 * "48 of 438" from a rate or from the stored numerator and denominator, followed by the
 * registry's population text when there is one. Unavailable readings give the word and reason.
 */
export function numeratorDenominatorSentence(
  reading: Reading<unknown>,
  stored: { numerator: number | null; denominator: number | null },
  registry: RegistryRow | null,
  unit?: RegistryUnit,
): string {
  if (reading.status === "unavailable") return `${UNAVAILABLE_WORD}: ${reading.reason}`;
  const population = registry?.population ? ` ${registry.population.replace(/\.$/, "")}.` : "";
  if (isRate(reading.value)) {
    return `${formatInt(reading.value.numerator)} of ${formatInt(reading.value.denominator)}.${population}`;
  }
  if (stored.numerator !== null && stored.denominator !== null) {
    return `${formatInt(stored.numerator)} of ${formatInt(stored.denominator)}.${population}`;
  }
  return `${figureText(reading, unit)}.${population}`;
}

/** "Oct 8, 2026, 19:41 UTC" style as-of for a plain ISO string. */
export function asOfText(iso: string | null | undefined): string {
  return formatAsOf(iso);
}

/** Percentage points, one decimal. */
export function formatPoints(points: number): string {
  if (!Number.isFinite(points)) return UNAVAILABLE_WORD;
  return `${points.toFixed(1)} points`;
}
