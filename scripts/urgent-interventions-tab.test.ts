// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/urgent-interventions-tab.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  BRIEFING_COUNT_MISSING,
  briefingFindingsLead,
} from "../lib/fender-canvas/briefing-retail-lead.ts";
import { urgentInterventionsHtml } from "../lib/fender-canvas/urgent-interventions-html.ts";
import { bindCopy } from "../lib/fender-canvas/template-vars.ts";

const root = new URL("..", import.meta.url);

function read(rel: string): string {
  return readFileSync(new URL(rel, root), "utf8");
}

const FINDING_LABELS = [
  "Buy Box withheld",
  "MAP leakage",
  "Splintered bundles",
  "Exact official product pages",
  "Unbranded discovery",
] as const;

const FINDING_IDS = [
  "buy_box",
  "map_leakage",
  "splintered_bundles",
  "exact_official_product",
  "unbranded_discovery",
] as const;

test("Urgent Interventions template drops spoke-template example cards", () => {
  const spec = JSON.parse(read("data/fender-v3-spec.json")) as {
    spokes: { suggestions: { tabs: string[]; tabTemplates: string[] } };
  };
  assert.equal(spec.spokes.suggestions.tabs[0], "Urgent Interventions");
  const template = spec.spokes.suggestions.tabTemplates[0] ?? "";
  assert.match(template, /\{urgent_interventions\}/);
  assert.doesNotMatch(template, /Austin Bazaar|GearTree|A\+|comparison matrix|tabular spec|Bundle MAP|ai_action_card/i);
  assert.doesNotMatch(template, /\u2014/);
  assert.match(template, /phase_one_lift/);
  assert.match(template, /enterprise_potential/);

  const bound = bindCopy(template, {
    phase_one_lift: "+$680K",
    enterprise_potential: "+$38M to $62M",
    urgent_interventions: "<div class=\"action-card\">placeholder</div>",
  });
  assert.match(bound, /action-card/);
  assert.doesNotMatch(bound, /Austin Bazaar|\{urgent_interventions\}/);
});

test("urgentInterventionsHtml renders the five briefingFindingsLead rows with N of M", () => {
  const html = urgentInterventionsHtml(
    { phase: "loading" },
    { phase: "loading" },
    { phase: "loading" },
  );
  const lead = briefingFindingsLead(
    { phase: "loading" },
    { phase: "loading" },
    { phase: "loading" },
  );

  assert.equal(lead.findings.length, 5);
  assert.deepEqual(
    lead.findings.map((f) => f.id),
    [...FINDING_IDS],
  );

  for (let i = 0; i < FINDING_LABELS.length; i++) {
    const finding = lead.findings[i]!;
    assert.match(html, new RegExp(FINDING_LABELS[i]!));
    assert.match(html, new RegExp(`data-urgent-finding="${FINDING_IDS[i]}"`));
    assert.match(html, new RegExp(`data-ifai-open="${finding.spokeId}"`));
    assert.match(html, new RegExp(`data-ifai-tab="${finding.tab}"`));
    assert.match(html, new RegExp(BRIEFING_COUNT_MISSING));
  }

  assert.doesNotMatch(html, /\$|lost.?revenue|since last time|what changed|fee|retainer|Austin Bazaar/i);
  assert.doesNotMatch(html, /\u2014/);
  assert.equal((html.match(/data-urgent-finding=/g) ?? []).length, 5);
});

test("build-live-spokes wires urgent_interventions and leaves CurrentFindingsPanel on tab 2", () => {
  const spokes = read("components/v3/build-live-spokes.tsx");
  assert.match(spokes, /urgentInterventionsHtml/);
  assert.match(spokes, /urgent_interventions:\s*urgentInterventionsHtml\(retail,\s*findability,\s*ai\)/);
  assert.doesNotMatch(spokes, /ai_action_card|aiActionCardHtml/);
  assert.match(spokes, /suggestions:\s*\{[\s\S]*2:\s*\([^)]*\)\s*=>\s*<CurrentFindingsPanel/);
  assert.doesNotMatch(spokes, /suggestions:\s*\{[\s\S]*0:\s*/);
});
