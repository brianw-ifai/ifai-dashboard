import type { SandboxBundle } from "../data/types";
import { selectAiAnswerShare } from "./ai-answer-share";
import { metricReading, type MetricReading } from "./common";
import { selectFeaturedOfferSuppressed } from "./featured-offer";

export const ECOMMERCE_TO_AI_LINK_ID = "ecommerce_to_ai_link";

export type EcommerceToAiLink = {
  /** Unavailable until a stored reading links one listing's gap to one answer. */
  link: MetricReading;
  /** The two measured sides shown next to each other in the first view. */
  aiSide: MetricReading;
  retailSide: MetricReading;
};

export function selectEcommerceToAiLink(bundle: SandboxBundle): EcommerceToAiLink {
  return {
    link: metricReading(bundle, ECOMMERCE_TO_AI_LINK_ID),
    aiSide: selectAiAnswerShare(bundle),
    retailSide: selectFeaturedOfferSuppressed(bundle),
  };
}
