import { isRate } from "./format";
import type { Finding } from "./types";

export type HeadlinePick = {
  /** The finding to show as the headline, or null when there are no findings. */
  headline: Finding | null;
  /** Unavailable findings that outrank the headline. The UI shows them beside it as coverage text. */
  coverage: Finding[];
  /** Why this finding won, in plain words for the explainer. */
  rule: string;
};

function isNonZero(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (isRate(value)) return value.numerator !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function byRank(a: Finding, b: Finding): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  return a.registryId.localeCompare(b.registryId);
}

/**
 * Rule 5: confirmed findings outrank unfinished reads. A complete or partial finding
 * with a non-zero value beats any unavailable finding regardless of rank. Among the
 * eligible findings the lowest rank number wins. Unavailable findings that outrank
 * the winner come back as coverage so the UI can show them beside the headline.
 */
export function pickHeadline(findings: Finding[]): HeadlinePick {
  const sorted = [...findings].sort(byRank);
  if (sorted.length === 0) return { headline: null, coverage: [], rule: "No findings were supplied." };

  const confirmed = sorted.filter((f) => f.reading.status !== "unavailable");
  const confirmedNonZero = confirmed.filter((f) => f.reading.status !== "unavailable" && isNonZero(f.reading.value));

  let headline: Finding;
  let rule: string;
  if (confirmedNonZero.length > 0) {
    headline = confirmedNonZero[0];
    rule = "The highest-ranked confirmed finding with a non-zero value leads.";
  } else if (confirmed.length > 0) {
    headline = confirmed[0];
    rule = "Every confirmed finding is zero, so the highest-ranked confirmed zero leads.";
  } else {
    headline = sorted[0];
    rule = "No finding was confirmed, so the highest-ranked unavailable finding leads.";
  }

  const coverage = sorted.filter(
    (f) => f !== headline && f.reading.status === "unavailable" && f.rank < headline.rank,
  );
  return { headline, coverage, rule };
}
