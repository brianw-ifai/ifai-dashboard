// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/fact-check-accuracy-lead.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { driftRead } from "../lib/ai-search/drift.ts";
import { factCheckAccuracyLead, factCheckHeadline } from "../lib/ai-search/fact-check-copy.ts";
import { pct } from "../lib/ai-search/summary.ts";
import type { AiProbeRow } from "../lib/ai-search/types.ts";

function probe(partial: Partial<AiProbeRow> & Pick<AiProbeRow, "sim_id" | "prompt_key" | "engine">): AiProbeRow {
  return {
    audit_run_id: "r1",
    prompt: `Question ${partial.prompt_key}`,
    model: null,
    call_status: "answered",
    material_hallucination: "none",
    hallucination_evidence: null,
    verified_claim: "Neck radius is 9.5 inches",
    verified_source_url: "https://www.fender.com/example",
    verified_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

test("accuracy lead matches satellite formula and population wording", () => {
  const probes = [
    probe({ sim_id: 1, prompt_key: "p1", engine: "chatgpt" }),
    probe({ sim_id: 2, prompt_key: "p1", engine: "gemini" }),
    probe({
      sim_id: 3,
      prompt_key: "p2",
      engine: "chatgpt",
      material_hallucination: "confirmed",
      hallucination_evidence: "Said 7.25",
    }),
  ];
  const coverage = driftRead([], probes).coverage;
  assert.equal(coverage.answersChecked, 3);
  assert.equal(coverage.contradictions, 1);
  const lead = factCheckAccuracyLead(coverage);
  assert.equal(lead.checked, 3);
  assert.equal(lead.matched, 2);
  assert.equal(lead.rate, pct(2, 3));
  assert.equal(lead.rate, "66.7%");
  assert.equal(lead.population, "2 of 3 answers matched.");
});

test("perfect accuracy is 100.0% with matching population", () => {
  const probes = [
    probe({ sim_id: 1, prompt_key: "p1", engine: "chatgpt" }),
    probe({ sim_id: 2, prompt_key: "p1", engine: "gemini" }),
  ];
  const lead = factCheckAccuracyLead(driftRead([], probes).coverage);
  assert.equal(lead.rate, "100.0%");
  assert.equal(lead.population, "2 of 2 answers matched.");
});

test("empty checks show no percentage and no fake 100%", () => {
  const emptyCoverage = driftRead([], []).coverage;
  const empty = factCheckAccuracyLead(emptyCoverage);
  assert.equal(empty.rate, null);
  assert.equal(empty.population, null);
  assert.equal(empty.matched, 0);
  assert.equal(empty.checked, 0);
  assert.equal(factCheckHeadline(emptyCoverage), "This run sent no product fact checks.");

  const failedOnly = [
    probe({
      sim_id: 1,
      prompt_key: "p1",
      engine: "chatgpt",
      call_status: "error",
      material_hallucination: "not_evaluated",
      verified_claim: null,
    }),
  ];
  const failedCoverage = driftRead([], failedOnly).coverage;
  const failedLead = factCheckAccuracyLead(failedCoverage);
  assert.equal(failedLead.rate, null);
  assert.doesNotMatch(String(failedLead.rate ?? ""), /100/);
  assert.match(factCheckHeadline(failedCoverage), /No product fact check completed/);
});
