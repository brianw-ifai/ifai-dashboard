import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const BUNDLE_SHARE_ID = "bundle_share";

/** Active offers whose title marks a bundle, kit, pack, or combo. */
export function selectBundleShare(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, BUNDLE_SHARE_ID, { againstActive: true });
}
