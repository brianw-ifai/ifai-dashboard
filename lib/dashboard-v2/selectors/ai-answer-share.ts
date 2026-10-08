import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";

export const AI_ANSWER_SHARE_ID = "ai_answer_share";

/** Rate over resolved answers; partial when the latest battery run is partial. */
export function selectAiAnswerShare(bundle: SandboxBundle): MetricReading {
  return metricReading(bundle, AI_ANSWER_SHARE_ID);
}
