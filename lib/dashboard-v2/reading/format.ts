import type { Rate, Reading, RegistryUnit } from "./types";

const intFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const asOfFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export const UNAVAILABLE_WORD = "unavailable";

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) return UNAVAILABLE_WORD;
  return intFormat.format(Math.round(value));
}

/** One decimal, with the percent sign. */
export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return UNAVAILABLE_WORD;
  return `${value.toFixed(1)}%`;
}

/** Whole dollars when the value is whole, otherwise cents. */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return UNAVAILABLE_WORD;
  return Number.isInteger(value) ? usdWhole.format(value) : usdCents.format(value);
}

/** UTC date and time, for example "Oct 8, 2026, 19:30 UTC". */
export function formatAsOf(iso: string | null | undefined): string {
  if (!iso) return "no date stored";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "date not readable";
  return `${asOfFormat.format(new Date(ms))} UTC`;
}

export function isRate(value: unknown): value is Rate {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return typeof r.numerator === "number" && typeof r.denominator === "number" && typeof r.pct === "number";
}

/** A rate shows its numerator and denominator next to the percentage. */
export function formatRate(value: Rate): string {
  return `${formatPct(value.pct)} (${formatInt(value.numerator)} of ${formatInt(value.denominator)})`;
}

/** Formats a confirmed value by the registry unit. */
export function formatValue(value: unknown, unit?: RegistryUnit): string {
  if (isRate(value)) return formatRate(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return UNAVAILABLE_WORD;
    switch (unit) {
      case "usd":
        return formatUsd(value);
      case "percent":
        return formatPct(value);
      case "timestamp":
        return formatAsOf(new Date(value).toISOString());
      case "count":
      case "none":
      default:
        return Number.isInteger(value) ? formatInt(value) : String(value);
    }
  }
  if (typeof value === "string") {
    return unit === "timestamp" ? formatAsOf(value) : value;
  }
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value === null || value === undefined) return UNAVAILABLE_WORD;
  return String(value);
}

export type ReadingText = {
  /** The figure itself, or the word "unavailable". */
  value: string;
  /** Coverage note for partial readings, the reason for unavailable ones, null for complete. */
  note: string | null;
};

/** Splits a reading into its figure and its note so the UI can style them apart. */
export function formatReadingParts(reading: Reading<unknown>, unit?: RegistryUnit): ReadingText {
  if (reading.status === "unavailable") {
    return { value: UNAVAILABLE_WORD, note: reading.reason };
  }
  const value = formatValue(reading.value, unit);
  if (reading.status === "partial") {
    const { read, population } = reading.coverage;
    const span =
      population === null
        ? `read ${formatInt(read)}, population unknown`
        : `read ${formatInt(read)} of ${formatInt(population)}`;
    return { value, note: `not final, ${span}` };
  }
  return { value, note: null };
}

/**
 * One line for a reading. Complete: the figure. Partial: the figure, "not final", and
 * "read N of M". Unavailable: the word "unavailable" and the reason, never a digit.
 */
export function formatReading(reading: Reading<unknown>, unit?: RegistryUnit): string {
  const parts = formatReadingParts(reading, unit);
  if (reading.status === "unavailable") return `${parts.value}: ${parts.note}`;
  return parts.note ? `${parts.value}, ${parts.note}` : parts.value;
}
