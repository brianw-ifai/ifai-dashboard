import { MIN_COMPARABLE_RESOLVED } from "@/lib/ai-search/run-metrics";

/** Plain-language definitions shown on the dotted AI Search terms. */
export const AI_DEFINITIONS = {
  "Fender lead":
    "An answer where Fender or Squier is named more often than any competitor brand, counted by whole-word brand mentions. It measures mention share. It does not prove the engine recommended a specific Fender product.",
  resolved:
    "A commercial answer with a clear leader: Fender/Squier or one competitor is named most. Answers with no clear leader and provider errors are not in the denominator.",
  "no clear leader":
    "The answer did not name one brand more than the others. It is neither a win nor a loss, and it is reported on its own line.",
  "provider error":
    "The AI engine failed to return an answer for this call. It is neither a win nor a loss, and it is reported on its own line.",
  "product fact check":
    "A factual question about a Fender product, sent on purpose to check an answer against a fact IntoFocus verified on an official Fender page. These are not buying prompts, so they never count toward win rates or competitor share.",
  "shopping answer": "A usable response from one AI engine to one shopping prompt.",
  "cited link":
    "A web URL the AI engine explicitly returned with its answer. It does not prove that the source caused or endorsed the recommendation.",
  "Fender-owned": "A cited site controlled by Fender or another FMIC brand, classified by IntoFocus.",
  "partial run":
    "The run was published with some calls unanswered. Every figure covers the answered calls only, and the unanswered calls are listed.",
  "published run":
    "The one audit run IntoFocus has published as current. Earlier and unpublished runs are kept as history and never mixed into these figures.",
  "confirmed contradiction":
    "The answer contradicts a fact IntoFocus verified on a Fender page, and the stored evidence quotes the conflicting text.",
  "no contradiction found":
    "The answer was compared with one verified Fender fact and nothing in it contradicted that fact. It does not prove every statement in the answer is accurate.",
  "source class":
    "IntoFocus's grouping of a cited domain as brand-owned, retailer, editorial, community, video, or other.",
  "canonical URL":
    "The cited link with tracking parameters, page fragments, and www removed, so the same page counts once per answer.",
  "small sample": `Fewer than ${MIN_COMPARABLE_RESOLVED} resolved answers, or less than half of the largest sample beside it. The figure is shown, but it is not ranked against the others.`,
} as const;

export type AiTermKey = keyof typeof AI_DEFINITIONS;
