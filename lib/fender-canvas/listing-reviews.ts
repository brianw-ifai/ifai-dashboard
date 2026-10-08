import { formatInt, pendingLabel } from "@/lib/fender-canvas/format";

/**
 * reviews_count is NOT NULL and defaults to 0. No job writes a confirmed count,
 * so 0 is unread, not a count of zero reviews. A positive stored count is shown.
 * The label does not assume how many listing rows exist.
 */
export function listingReviewLabel(count: unknown): string {
  const value =
    typeof count === "number"
      ? count
      : typeof count === "string" && count.trim() !== ""
        ? Number(count)
        : Number.NaN;
  if (!Number.isFinite(value) || value <= 0) return pendingLabel();
  return formatInt(value);
}
