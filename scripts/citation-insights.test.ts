// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/citation-insights.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { citationEvidence } from "../lib/ai-search/citations.ts";
import { citationPies } from "../lib/ai-search/citation-pies.ts";
import {
  citationAssociation,
  citationGaps,
  ownedPresence,
  sourceMix,
  topDomainBars,
} from "../lib/ai-search/citation-insights.ts";
import type { AiCallRow, AiCitationRow } from "../lib/ai-search/types.ts";

function call(patch: Partial<AiCallRow>): AiCallRow {
  return {
    id: "row",
    audit_run_id: "run",
    sim_id: 1,
    engine: "chatgpt",
    model: null,
    category: "beginner",
    prompt: "Best guitar under $300",
    prompt_key: "p",
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
    created_at: "2026-10-18T12:00:00.000Z",
    ...patch,
  };
}

function cite(
  simulationId: string,
  url: string,
  domain: string,
  patch: Partial<AiCitationRow> = {},
): AiCitationRow {
  return {
    audit_run_id: "run",
    sim_id: 1,
    simulation_id: simulationId,
    prompt_key: "p",
    prompt_kind: "commercial",
    category: "beginner",
    engine: "chatgpt",
    position: 1,
    url,
    domain,
    title: domain,
    ...patch,
  };
}

const calls = [
  call({ id: "w1", sim_id: 1, outcome: "fender_win", category: "beginner" }),
  call({
    id: "w2",
    sim_id: 2,
    outcome: "fender_win",
    category: "beginner",
    prompt: "Best starter Strat",
  }),
  call({
    id: "l1",
    sim_id: 3,
    outcome: "competitor_win",
    primary_brand: "Yamaha",
    category: "beginner",
    prompt: "Best beginner bass",
  }),
  call({
    id: "l2",
    sim_id: 4,
    outcome: "competitor_win",
    primary_brand: "Yamaha",
    category: "acoustic",
    prompt: "Best acoustic under $500",
  }),
  call({
    id: "l3",
    sim_id: 5,
    outcome: "competitor_win",
    primary_brand: "Taylor",
    category: "acoustic",
    prompt: "Best acoustic for folk",
  }),
  call({
    id: "u1",
    sim_id: 6,
    outcome: "unresolved",
    primary_brand: null,
    category: "amp",
    prompt: "Best practice amp",
  }),
];

const citations: AiCitationRow[] = [
  cite("w1", "https://www.fender.com/guitars", "fender.com"),
  cite("w1", "https://www.sweetwater.com/guitars", "sweetwater.com", { position: 2 }),
  cite("w2", "https://www.fender.com/strat", "fender.com"),
  cite("l1", "https://www.yamaha.com/basses", "yamaha.com"),
  cite("l1", "https://www.reddit.com/r/Bass", "reddit.com", { position: 2 }),
  cite("l2", "https://www.taylorguitars.com/guitars", "taylorguitars.com"),
  cite("l3", "https://www.guitarcenter.com/acoustic", "guitarcenter.com"),
];

test("owned presence counts answers and links separately", () => {
  const read = citationEvidence(calls, citations, "commercial");
  const presence = ownedPresence(read);
  assert.equal(presence.answered, 6);
  assert.equal(presence.answersWithOwned, 2);
  assert.equal(presence.ownedLinks, 2);
  assert.equal(presence.totalLinks, 7);
});

test("association arms sum to resolved shopping answers", () => {
  const read = citationEvidence(calls, citations, "commercial");
  const assoc = citationAssociation(calls, read, "commercial");
  assert.ok(assoc);
  assert.equal(assoc.ok, true);
  assert.equal(assoc.resolvedTotal, 5);
  const [cited, notCited] = assoc.arms;
  assert.equal(cited.fenderLed, 2);
  assert.equal(cited.resolved, 2);
  assert.equal(notCited.fenderLed, 0);
  assert.equal(notCited.resolved, 3);
  assert.equal(citationAssociation(calls, read, "probe"), null);
});

test("gaps rank competitor-led answers with no Fender-owned page", () => {
  const read = citationEvidence(calls, citations, "commercial");
  const result = citationGaps(calls, read, "commercial");
  assert.ok(result);
  assert.equal(result.ok, true);
  assert.equal(result.totalLosing, 3);
  assert.equal(result.gaps[0].category, "acoustic");
  assert.equal(result.gaps[0].count, 2);
  assert.equal(result.gaps[0].competitor, "Taylor");
  assert.ok(result.gaps[0].topDomains.some((d) => d.domain === "taylorguitars.com" || d.domain === "guitarcenter.com"));
  assert.equal(result.gaps[1].category, "beginner");
  assert.equal(result.gaps[1].count, 1);
  assert.equal(result.gaps[1].competitor, "Yamaha");
  assert.deepEqual(result.gaps[1].topDomains.map((d) => d.domain).sort(), ["reddit.com", "yamaha.com"]);
});

test("source mix and pies reconcile with link totals", () => {
  const read = citationEvidence(calls, citations, "commercial");
  const mix = sourceMix(read);
  assert.ok(mix);
  assert.equal(mix.total, read.rows.length);
  assert.equal(
    mix.slices.reduce((sum, slice) => sum + slice.count, 0),
    read.rows.length,
  );
  const pies = citationPies(read);
  assert.ok(pies);
  assert.equal(pies.some((pie) => (pie.id as string) === "answers"), false);
  const classes = pies.find((pie) => pie.id === "classes");
  const owned = pies.find((pie) => pie.id === "owned");
  assert.equal(classes?.total, 7);
  assert.equal(owned?.total, 7);
  assert.equal(
    classes?.slices.reduce((sum, slice) => sum + slice.count, 0),
    7,
  );
  assert.equal(
    owned?.slices.reduce((sum, slice) => sum + slice.count, 0),
    7,
  );
  const bars = topDomainBars(read, 3);
  assert.equal(bars[0].domain, "fender.com");
  assert.equal(bars[0].links, 2);
});
