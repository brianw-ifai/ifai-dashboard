/**
 * Which rows an AI Search drill-down should open on. Kept in the `evidence`
 * query parameter so a copied link reopens the same rows.
 * Format: `<field>:<value>`, for example `sim:1161`, `domain:fender.com`, `competitor:Yamaha`.
 */

export const EVIDENCE_PARAM = "evidence";

export const EVIDENCE_FIELDS = [
  "sim",
  "engine",
  "model",
  "category",
  "outcome",
  "kind",
  "accuracy",
  "competitor",
  "domain",
  "class",
  "role",
] as const;

export type EvidenceField = (typeof EVIDENCE_FIELDS)[number];

export type EvidenceFocus = { field: EvidenceField; value: string };

export function parseEvidence(raw: string | null | undefined): EvidenceFocus | null {
  if (!raw) return null;
  const index = raw.indexOf(":");
  if (index <= 0) return null;
  const field = raw.slice(0, index) as EvidenceField;
  const value = raw.slice(index + 1).trim();
  if (!EVIDENCE_FIELDS.includes(field) || !value) return null;
  return { field, value };
}

export function formatEvidence(focus: EvidenceFocus): string {
  return `${focus.field}:${focus.value}`;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let current: EvidenceFocus | null | undefined;

function readUrl(): EvidenceFocus | null {
  if (typeof window === "undefined") return null;
  return parseEvidence(new URLSearchParams(window.location.search).get(EVIDENCE_PARAM));
}

export function getEvidenceFocus(): EvidenceFocus | null {
  if (current === undefined) current = readUrl();
  return current;
}

export function setEvidenceFocus(focus: EvidenceFocus | null) {
  current = focus;
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    if (focus) url.searchParams.set(EVIDENCE_PARAM, formatEvidence(focus));
    else url.searchParams.delete(EVIDENCE_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeEvidenceFocus(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
