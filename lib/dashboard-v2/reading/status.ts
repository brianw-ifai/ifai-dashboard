import { isRate } from "./format";
import type { NodeStatus, Reading, RegistryRow, ThresholdRule } from "./types";

/** The number a threshold rule compares: a count, a percent, or a rate's percent. */
function comparable(value: unknown, rule: ThresholdRule): number | null {
  if (isRate(value)) return rule.kind === "count_is_bad" ? value.numerator : value.pct;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

/**
 * Maps a reading to a node status using only the registry row's threshold rule.
 * Unavailable is always neutral. A row with no rule is neutral.
 */
export function statusFor(reading: Reading<unknown>, row: RegistryRow | null | undefined): NodeStatus {
  if (reading.status === "unavailable") return "neutral";
  const rule = row?.threshold;
  if (!rule) return "neutral";
  const n = comparable(reading.value, rule);
  if (n === null) return "neutral";

  switch (rule.kind) {
    case "higher_is_better":
      if (n <= rule.danger) return "danger";
      if (n <= rule.warn) return "warning";
      return "success";
    case "lower_is_better":
    case "count_is_bad":
      if (n >= rule.danger) return "danger";
      if (n >= rule.warn) return "warning";
      return "success";
    default:
      return "neutral";
  }
}
