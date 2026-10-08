import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const WRONG_SPEC_FLAGS_ID = "ai_wrong_spec_flags";

/** Count of answers flagged for a wrong spec; the denominator is every answer read. */
export function selectWrongSpecFlags(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, WRONG_SPEC_FLAGS_ID);
}
