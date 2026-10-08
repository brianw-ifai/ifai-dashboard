import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const MAP_BELOW_ID = "map_below";

/** Unavailable until a MAP row exists; the registry notes carry the reason. */
export function selectMapBelow(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, MAP_BELOW_ID);
}
