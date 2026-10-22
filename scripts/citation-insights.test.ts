// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/citation-insights.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { citationEvidence } from "../lib/ai-search/citations.ts";
import { citationPies } from "../lib/ai-search/citation-pies.ts";
import {
  citationGaps,
  ownedByQuestionType,
  ownedPresence,
  sourceMix,
  topDomainBars,
} from "../lib/ai-search/citation-insights.ts";
import { questionRole } from "../lib/ai-search/question-role.ts";
import { roleTally } from "../lib/ai-search/question-role.ts";
import { SMALL_SAMPLE_LABEL } from "../lib/ai-search/summary.ts";
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

test("owned-by-role groups sum to each headline role resolved total", () => {
  const read = citationEvidence(calls, citations, "commercial");
  const byType = ownedByQuestionType(calls, read, "commercial");
  assert.ok(byType);
  assert.equal(byType.ok, true);
  for (const role of byType.roles) {
    const expected = roleTally(calls, role.role);
    assert.equal(role.resolved, expected.resolved);
    assert.equal(role.withOwned + role.withoutOwned, expected.resolved);
    assert.equal(role.groups[0].resolved + role.groups[1].resolved, expected.resolved);
  }
  assert.equal(ownedByQuestionType(calls, read, "probe"), null);
});

test("owned citations concentrated in branded questions do not inflate unbranded", () => {
  const mixed = [
    call({
      id: "u1",
      sim_id: 1,
      prompt: "Best guitar under $300",
      outcome: "competitor_win",
      primary_brand: "Yamaha",
      category: "beginner",
    }),
    call({
      id: "u2",
      sim_id: 2,
      prompt: "Best bass under $400",
      outcome: "competitor_win",
      primary_brand: "Yamaha",
      category: "basses",
    }),
    call({
      id: "u3",
      sim_id: 3,
      prompt: "Best acoustic under $500",
      outcome: "fender_win",
      category: "acoustic",
    }),
    call({
      id: "b1",
      sim_id: 4,
      prompt: "Is the Fender Stratocaster a good first guitar",
      outcome: "fender_win",
      category: "electrics",
    }),
    call({
      id: "b2",
      sim_id: 5,
      prompt: "Is a Squier Affinity a good bass",
      outcome: "fender_win",
      category: "basses",
    }),
    call({
      id: "b3",
      sim_id: 6,
      prompt: "Fender Player vs PRS SE comparison",
      outcome: "fender_win",
      category: "electrics",
    }),
    call({
      id: "pf1",
      sim_id: 7,
      prompt: "What pickup types does the Player II Strat use",
      outcome: "fender_win",
      category: "electrics",
    }),
  ];
  assert.equal(questionRole(mixed[0]), "unbranded_discovery");
  assert.equal(questionRole(mixed[3]), "branded_consideration");
  assert.equal(questionRole(mixed[6]), "product_fact");

  const cites: AiCitationRow[] = [
    cite("b1", "https://www.fender.com/strat", "fender.com"),
    cite("b2", "https://www.fender.com/squier", "fender.com"),
    cite("b3", "https://www.fender.com/player", "fender.com"),
    cite("pf1", "https://www.fender.com/player-ii", "fender.com"),
    cite("u1", "https://www.yamaha.com/guitars", "yamaha.com"),
    cite("u2", "https://www.sweetwater.com/bass", "sweetwater.com"),
  ];
  const read = citationEvidence(mixed, cites, "commercial");
  const byType = ownedByQuestionType(mixed, read, "commercial");
  assert.ok(byType);
  assert.equal(byType.ok, true);

  const unbranded = byType.roles.find((role) => role.role === "unbranded_discovery");
  const branded = byType.roles.find((role) => role.role === "branded_consideration");
  assert.ok(unbranded && branded);
  // Owned citations sit on branded (and product-fact) answers, not unbranded.
  assert.equal(unbranded.withOwned, 0);
  assert.equal(unbranded.withoutOwned, 3);
  assert.equal(unbranded.resolved, roleTally(mixed, "unbranded_discovery").resolved);
  assert.equal(branded.withOwned, 3);
  assert.equal(branded.withoutOwned, 0);
  assert.equal(byType.insight.withOwned, 0);
  assert.equal(byType.insight.resolved, 3);
  // Small samples on the thin owned / not-owned arms carry the label.
  assert.equal(branded.groups[0].smallSample, true);
  assert.match(
    `Fender led ${branded.groups[0].fenderLed} of ${branded.groups[0].resolved}${branded.groups[0].smallSample ? ` · ${SMALL_SAMPLE_LABEL}` : ""}`,
    new RegExp(SMALL_SAMPLE_LABEL),
  );
});

test("gaps only count headline-role competitor losses without Fender-owned pages", () => {
  const mixed = [
    call({
      id: "u1",
      sim_id: 1,
      prompt: "Best acoustic under $500",
      outcome: "competitor_win",
      primary_brand: "Yamaha",
      category: "acoustic",
    }),
    call({
      id: "pf1",
      sim_id: 2,
      prompt: "What pickup types does the Player II Strat use",
      outcome: "competitor_win",
      primary_brand: "Gibson",
      category: "electrics",
    }),
    call({
      id: "g1",
      sim_id: 3,
      prompt: "How much should I spend on a first guitar",
      outcome: "competitor_win",
      primary_brand: "Yamaha",
      category: "beginner",
    }),
  ];
  assert.equal(questionRole(mixed[0]), "unbranded_discovery");
  assert.equal(questionRole(mixed[1]), "product_fact");
  assert.equal(questionRole(mixed[2]), "shopping_guidance");
  const cites = [
    cite("u1", "https://www.yamaha.com/acoustic", "yamaha.com"),
    cite("pf1", "https://www.gibson.com/les-paul", "gibson.com"),
    cite("g1", "https://www.sweetwater.com/guide", "sweetwater.com"),
  ];
  const read = citationEvidence(mixed, cites, "commercial");
  const result = citationGaps(mixed, read, "commercial");
  assert.ok(result);
  assert.equal(result.ok, true);
  assert.equal(result.totalLosing, 1);
  assert.equal(result.gaps[0].category, "acoustic");
  assert.equal(result.gaps[0].count, 1);
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
