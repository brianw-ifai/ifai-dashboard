// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/fact-check-column-label.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ACCURACY_LABELS,
  factCheckColumnLabel,
} from "../lib/ai-search/explorer-filter.ts";
import type { AiCallRow } from "../lib/ai-search/types.ts";

function call(patch: Partial<AiCallRow>): AiCallRow {
  return {
    id: "row",
    audit_run_id: "run",
    sim_id: 1,
    engine: "chatgpt",
    model: null,
    category: "electrics",
    prompt: "Prompt",
    prompt_key: "p1",
    prompt_kind: "commercial",
    call_status: "answered",
    outcome: "fender_win",
    primary_brand: "Fender/Squier",
    material_hallucination: "not_evaluated",
    hallucination_evidence: null,
    root_cause: null,
    remediation_patch: null,
    error_message: null,
    attempt_no: 1,
    repeat_no: 1,
    created_at: "2026-10-12T16:40:00Z",
    ...patch,
  };
}

test("factCheckColumnLabel returns n/a for commercial and shopping rows", () => {
  assert.equal(factCheckColumnLabel(call({ prompt_kind: "commercial" })), "n/a");
  assert.equal(factCheckColumnLabel(call({ prompt_kind: "shopping" })), "n/a");
  assert.equal(factCheckColumnLabel(call({ prompt_kind: null })), "n/a");
  // Accuracy on a non-probe must not leak into the Run Details Fact Check cell.
  assert.equal(
    factCheckColumnLabel(call({ prompt_kind: "commercial", material_hallucination: "confirmed" })),
    "n/a",
  );
});

test("factCheckColumnLabel keeps accuracy labels for probe rows", () => {
  assert.equal(
    factCheckColumnLabel(call({ prompt_kind: "probe", material_hallucination: "not_evaluated" })),
    "No verified fact available",
  );
  assert.equal(
    factCheckColumnLabel(call({ prompt_kind: "probe", material_hallucination: "none" })),
    "No contradiction found for this fact",
  );
  assert.equal(
    factCheckColumnLabel(call({ prompt_kind: "probe", material_hallucination: "confirmed" })),
    "Contradiction found",
  );
  assert.equal(
    factCheckColumnLabel(call({ prompt_kind: "probe", material_hallucination: "not_evaluated" })),
    ACCURACY_LABELS.not_evaluated,
  );
  assert.equal(
    factCheckColumnLabel(call({ prompt_kind: "probe", material_hallucination: "confirmed" })),
    ACCURACY_LABELS.confirmed,
  );
});

test("Run Details Checked header stays Checked and the body is not prefixed with checked", () => {
  const source = readFileSync("components/v3/live/ai-search/SimulationsExplorer.tsx", "utf8");
  assert.match(source, /clientColumn\(\s*"checked",\s*"Checked"/);
  // Body cell must be formatRunTime only — not "checked {formatRunTime(...)}".
  assert.doesNotMatch(source, /checked\s*\{formatRunTime\(row\.created_at\)\}/);
  assert.match(source, /<td>\{formatRunTime\(row\.created_at\)\}<\/td>/);
  // Fact Check cells go through the shared helper.
  assert.match(source, /factCheckColumnLabel\(row\)/);
});
