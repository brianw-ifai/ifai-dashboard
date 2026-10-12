import type { FactCheckCoverage } from "@/lib/ai-search/drift";
import { joinBrands } from "@/lib/ai-search/competitors";

const FACT = (n: number) => `${n} Fender product fact${n === 1 ? "" : "s"}`;
const ANSWER = (n: number) => `${n} answer${n === 1 ? "" : "s"}`;
const CALL = (n: number) => `${n} fact-check call${n === 1 ? "" : "s"}`;

/** The business result, first: what was checked, on which engines, and what came back. */
export function factCheckHeadline(c: FactCheckCoverage): string {
  if (c.answersChecked === 0) {
    return c.questionsSent === 0
      ? "This run sent no product fact checks."
      : `No product fact check completed in this run, so there is no accuracy result to report on ${FACT(c.questionsWithFact)}.`;
  }
  const scope = `${FACT(c.factsChecked)} ${c.factsChecked === 1 ? "was" : "were"} checked across ${joinBrands(c.checkedEngines)}.`;
  const result =
    c.contradictions === 0
      ? `No contradictions were found in ${ANSWER(c.answersChecked)}.`
      : `${c.contradictions} of ${c.answersChecked} answers contradicted the verified fact.`;
  return `${scope} ${result}`;
}

export const FACT_CHECK_SCOPE =
  "These checks cover the selected facts only. They do not prove every statement in each answer is accurate.";

export const FACT_CHECK_SHOPPING_SCOPE =
  "This run checked selected product facts, not every factual claim in the shopping answers.";

/** Engines that returned nothing. Secondary, never the headline. */
export function factCheckCoverageNote(c: FactCheckCoverage): string | null {
  if (c.failedCalls === 0) return null;
  return `${joinBrands(c.failedEngines)} did not return answers for ${CALL(c.failedCalls)}.`;
}

/** Questions IntoFocus has not yet verified a fact for. */
export function factCheckPendingNote(c: FactCheckCoverage): string | null {
  if (c.answersWithoutFact === 0) return null;
  const questions = c.questionsWithoutFact.length;
  return `${questions} question${questions === 1 ? "" : "s"} ${questions === 1 ? "has" : "have"} no verified Fender fact yet, so ${ANSWER(c.answersWithoutFact)} ${c.answersWithoutFact === 1 ? "was" : "were"} not evaluated.`;
}

/** Short form for the map bubble and the guided tour. */
export function factCheckShortLine(c: FactCheckCoverage): string {
  if (c.answersChecked === 0) return "No product fact check completed";
  return c.contradictions === 0
    ? `No contradictions in ${ANSWER(c.answersChecked)}`
    : `${c.contradictions} contradictions in ${ANSWER(c.answersChecked)}`;
}

export function factsCheckedLine(c: FactCheckCoverage): string {
  return `${c.factsChecked} facts checked`;
}
