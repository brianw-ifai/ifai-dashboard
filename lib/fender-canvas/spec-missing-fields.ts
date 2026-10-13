import { pendingLabel } from "@/lib/fender-canvas/format";

export const NO_MISSING_AMAZON_FIELDS = "No missing fields";
export const MISSING_AMAZON_FIELDS_DETAIL_UNAVAILABLE = "Missing-field detail is not stored.";

/** Semicolon-separated Amazon field names. Blank pieces are not fields. */
export function amazonMissingFieldNames(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export type MissingAmazonFieldsPresentation =
  | { kind: "fields"; fields: string[] }
  | { kind: "none"; label: typeof NO_MISSING_AMAZON_FIELDS }
  | { kind: "pending"; label: string }
  | { kind: "detail-unavailable"; label: typeof MISSING_AMAZON_FIELDS_DETAIL_UNAVAILABLE };

/**
 * Empty stored fields at 100% completeness mean nothing is missing.
 * Pending data is only for a completeness figure or field list that is not stored.
 * A known gap without the field names says the detail is unavailable.
 */
export function presentMissingAmazonFields(
  missingFields: string | null | undefined,
  completenessPct: number | null | undefined,
): MissingAmazonFieldsPresentation {
  const fields = amazonMissingFieldNames(missingFields);
  if (fields.length > 0) return { kind: "fields", fields };
  const completeness =
    typeof completenessPct === "number" && Number.isFinite(completenessPct) ? completenessPct : null;
  if (completeness == null) return { kind: "pending", label: pendingLabel() };
  if (completeness >= 100) return { kind: "none", label: NO_MISSING_AMAZON_FIELDS };
  return { kind: "detail-unavailable", label: MISSING_AMAZON_FIELDS_DETAIL_UNAVAILABLE };
}
