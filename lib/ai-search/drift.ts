import { cleanPrompt, engineLabel, isCommercial, isConfirmedHallucination } from "@/lib/ai-search/run-metrics";
import type { AiCallRow, AiProbeRow } from "@/lib/ai-search/types";

export type ProbeState = "confirmed" | "no_contradiction" | "no_fact" | "provider_error" | "unverified";

export const PROBE_STATE_LABELS: Record<ProbeState, string> = {
  confirmed: "Contradiction found",
  no_contradiction: "No contradiction found for this fact",
  no_fact: "No verified fact available",
  provider_error: "No answer returned",
  unverified: "Unverified flag",
};

export function probeState(row: AiProbeRow): ProbeState {
  if (row.call_status === "error") return "provider_error";
  switch (row.material_hallucination) {
    case "confirmed":
      return row.hallucination_evidence?.trim() ? "confirmed" : "unverified";
    case "none":
      return "no_contradiction";
    case "suspected":
    case "historical_unverified":
      return "unverified";
    default:
      return "no_fact";
  }
}

export type ProbeEvidence = {
  key: string;
  simId: number;
  promptKey: string;
  prompt: string;
  engine: string;
  model: string | null;
  state: ProbeState;
  claim: string | null;
  sourceUrl: string | null;
  evidence: string | null;
  checkedAt: string | null;
  verifiedAt: string | null;
};

export type DriftRead = {
  probes: ProbeEvidence[];
  answered: number;
  errors: number;
  /** Answered probes compared against a verified fact. */
  checked: number;
  confirmed: number;
  noContradiction: number;
  noFact: number;
  unverified: number;
  /** Commercial answers with a confirmed contradiction. They are not counted as Fender wins. */
  commercialConfirmed: number;
  /** Commercial answers the collector compared against a verified fact. */
  commercialChecked: number;
  commercialAnswered: number;
  /** Confirmed contradictions across probes and commercial answers. */
  totalConfirmed: number;
  /** Answers compared with a verified fact, probes and commercial together. */
  totalChecked: number;
  /** Distinct facts used by the fact checks, with their source page. */
  facts: Array<{ promptKey: string; claim: string; sourceUrl: string | null; verifiedAt: string | null }>;
  /** What the fact-check section leads with, in the operator's terms. */
  coverage: FactCheckCoverage;
};

export type FactCheckCoverage = {
  /** Product-fact questions sent in this run. */
  questionsSent: number;
  /** Those questions that have a fact IntoFocus verified on a Fender page. */
  questionsWithFact: number;
  /** Verified facts an answer was actually compared against. */
  factsChecked: number;
  /** Answers compared against one of those facts. */
  answersChecked: number;
  /** Checked answers that contradicted the verified fact. */
  contradictions: number;
  /** Engines that returned a checked answer. */
  checkedEngines: string[];
  /** Questions with no verified fact yet, and the answers left unevaluated. */
  questionsWithoutFact: string[];
  answersWithoutFact: number;
  /** Fact-check calls an engine failed to answer. */
  failedCalls: number;
  failedEngines: string[];
};

function engineNames(rows: ProbeEvidence[]): string[] {
  return [...new Set(rows.map((row) => engineLabel(row.engine)))].sort();
}

function factCheckCoverage(rows: ProbeEvidence[]): FactCheckCoverage {
  const checkedStates: ProbeState[] = ["confirmed", "no_contradiction"];
  const checked = rows.filter((row) => checkedStates.includes(row.state));
  const failed = rows.filter((row) => row.state === "provider_error");
  const withoutFact = rows.filter((row) => row.state === "no_fact");

  return {
    questionsSent: new Set(rows.map((row) => row.promptKey)).size,
    questionsWithFact: new Set(rows.filter((row) => row.claim).map((row) => row.promptKey)).size,
    factsChecked: new Set(checked.map((row) => row.promptKey)).size,
    answersChecked: checked.length,
    contradictions: checked.filter((row) => row.state === "confirmed").length,
    checkedEngines: engineNames(checked),
    questionsWithoutFact: [...new Set(withoutFact.map((row) => row.promptKey))].sort(),
    answersWithoutFact: withoutFact.length,
    failedCalls: failed.length,
    failedEngines: engineNames(failed),
  };
}

export function driftRead(calls: AiCallRow[], probes: AiProbeRow[]): DriftRead {
  const rows: ProbeEvidence[] = probes
    .map((row) => ({
      key: `${row.audit_run_id}:${row.sim_id}`,
      simId: row.sim_id,
      promptKey: row.prompt_key ?? "",
      prompt: cleanPrompt(row.prompt),
      engine: (row.engine ?? "").toLowerCase(),
      model: row.model,
      state: probeState(row),
      claim: row.verified_claim?.trim() || null,
      sourceUrl: row.verified_source_url?.trim() || null,
      evidence: row.hallucination_evidence?.trim() || null,
      checkedAt: row.created_at,
      verifiedAt: row.verified_at,
    }))
    .sort((a, b) => a.promptKey.localeCompare(b.promptKey) || a.engine.localeCompare(b.engine));

  const count = (state: ProbeState) => rows.filter((row) => row.state === state).length;
  const commercial = calls.filter(isCommercial);
  const commercialAnswered = commercial.filter((row) => row.call_status === "answered");

  const facts = new Map<string, DriftRead["facts"][number]>();
  for (const row of rows) {
    if (row.claim && !facts.has(row.promptKey)) {
      facts.set(row.promptKey, {
        promptKey: row.promptKey,
        claim: row.claim,
        sourceUrl: row.sourceUrl,
        verifiedAt: row.verifiedAt,
      });
    }
  }

  const commercialConfirmed = commercialAnswered.filter(isConfirmedHallucination).length;
  const commercialChecked = commercialAnswered.filter(
    (row) => row.material_hallucination === "confirmed" || row.material_hallucination === "none",
  ).length;
  const checked = count("confirmed") + count("no_contradiction");

  return {
    probes: rows,
    answered: rows.filter((row) => row.state !== "provider_error").length,
    errors: count("provider_error"),
    checked,
    confirmed: count("confirmed"),
    noContradiction: count("no_contradiction"),
    noFact: count("no_fact"),
    unverified: count("unverified"),
    commercialConfirmed,
    commercialChecked,
    commercialAnswered: commercialAnswered.length,
    totalConfirmed: count("confirmed") + commercialConfirmed,
    totalChecked: checked + commercialChecked,
    facts: [...facts.values()],
    coverage: factCheckCoverage(rows),
  };
}
