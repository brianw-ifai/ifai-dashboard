import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSpecModel, figureOf, surfaceStrings, type SpecModel } from "@/lib/dashboard-v2/canvas/spec-model";
import { allFormattedStrings, selectAll, type AllSelections } from "@/lib/dashboard-v2/selectors/index";
import { bundleWithConflict, bundleWithListingsError, fixtureBundle, LISTINGS } from "./fixtures/bundle";

/** Digits with optional commas, decimals, a percent sign, or a leading dollar sign. */
const TOKEN = /\$?\d(?:[\d,]*\d)?(?:\.\d+)?%?/g;

function tokensOf(strings: string[]): Set<string> {
  const out = new Set<string>();
  for (const s of strings) for (const m of s.match(TOKEN) ?? []) out.add(m);
  return out;
}

/** Every number token on a surface that no selector produced, with the surface string it came from. */
function strayFigures(model: SpecModel, all: AllSelections): string[] {
  const allowed = tokensOf(allFormattedStrings(all));
  const stray: string[] = [];
  for (const [surface, strings] of Object.entries(surfaceStrings(model))) {
    for (const s of strings) {
      for (const token of s.match(TOKEN) ?? []) {
        if (!allowed.has(token)) stray.push(`${surface}: "${token}" in "${s}"`);
      }
    }
  }
  return stray;
}

test("every figure on every surface comes from a selector", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const model = buildSpecModel(all);
  const strings = surfaceStrings(model);
  assert.ok(strings.nodes.length > 0 && strings.commandCenter.length > 0 && strings.tour.length > 0 && strings.metrics.length > 0 && strings.tickers.length > 0);
  const stray = strayFigures(model, all);
  assert.deepEqual(stray, []);
});

test("a figure typed into a surface makes the check fail", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const model = buildSpecModel(all);
  assert.deepEqual(strayFigures(model, all), []);

  // Figures no selector produced for this bundle. The precondition proves the check is not vacuous.
  const allowed = tokensOf(allFormattedStrings(all));
  const typed = ["$7,350", "2,420", "86", "68%"];
  for (const token of typed) assert.ok(!allowed.has(token), `${token} already exists in the selector outputs`);

  const injected: SpecModel = structuredClone(model);
  injected.nodes[0].stats.push(`+${typed[0]} first-phase uplift`);
  injected.commandCenter.summary = `${injected.commandCenter.summary} ${typed[1]} stranded reviews.`;
  injected.tour[0].displays.push(`AI Scan Index ${typed[2]} of a hundred`);
  injected.metrics[0].value = typed[3];
  const stray = strayFigures(injected, all);
  assert.equal(stray.length, 4, `expected the injected figures to be caught, got ${JSON.stringify(stray)}`);
  for (const token of typed) assert.ok(stray.some((s) => s.includes(`"${token}"`)), `${token} was not caught`);
});

test("the spec shape: hub, six spokes, at most two satellites per spoke, stable ids, no filters or search", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const model = buildSpecModel(all);
  const hub = model.nodes.find((n) => n.variant === "hub");
  assert.equal(hub?.title, "Brand Portfolio");
  assert.equal(hub?.stats.length, 2);
  assert.deepEqual(
    model.spokes.map((s) => s.id),
    ["hub", "aeo", "ecommerce", "specs", "competitors", "suggestions", "money"],
  );
  assert.deepEqual(
    model.spokes.filter((s) => s.id !== "hub").map((s) => s.title),
    ["AI Search Visibility", "Portfolio Retail", "AI Readiness", "Competitive Radar", "Action Items", "Estimates"],
  );
  const satellites = model.nodes.filter((n) => n.id.startsWith("sat-"));
  const perSpoke = new Map<string, number>();
  for (const s of satellites) perSpoke.set(s.spokeId ?? "", (perSpoke.get(s.spokeId ?? "") ?? 0) + 1);
  for (const [, count] of perSpoke) assert.ok(count <= 2);
  assert.equal(model.tour.length, 7);
  assert.equal(model.commandCenter.title, "What needs attention");
  assert.equal(model.brand.name, "IntoFocus");
  assert.equal(model.brand.subtitle, "Fender");
  assert.ok(model.metrics.some((m) => m.id === "metric-featured_offer_suppressed"));
  assert.deepEqual(model.metricDefaults, ["metric-featured_offer_suppressed", "metric-ai_answer_share", "metric-action_items_open"]);
  assert.equal(model.tickers.length, 3);
  assert.match(model.headerText, /^Readings as of Oct 5, 2026, 16:26 UTC \(oldest source\)$/);
  // Every node and widget status is derived; the unavailable primary question is neutral.
  const primaryCard = model.cards.ecommerce.find((c) => c.registryId === "retail_control_partner_led");
  assert.equal(primaryCard?.tone, "neutral");
  assert.equal(primaryCard?.value, "unavailable");
});

test("copy rules: no em dashes, no exclamation marks, Featured Offer not Buy Box, AEO only for the discipline", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const model = buildSpecModel(all);
  const authored = [
    ...model.spokes.flatMap((s) => [s.title, s.desc, s.badge, s.navLabel, s.tourTitle, ...s.tabs]),
    model.commandCenter.title,
    model.commandCenter.desc,
    ...model.legend.map((l) => l.label),
    ...model.nodes.filter((n) => n.id.startsWith("sat-")).map((n) => n.title),
  ];
  for (const s of authored) {
    assert.ok(!s.includes("—"), `em dash in "${s}"`);
    assert.ok(!s.includes("!"), `exclamation mark in "${s}"`);
    assert.ok(!/buy box/i.test(s), `Buy Box in authored copy "${s}"`);
    assert.ok(!/\bAEO\b/.test(s), `AEO used as a name in "${s}"`);
  }
});

test("with the errored metric read, the affected registry ids show the word unavailable and no digit", () => {
  const all = selectAll(bundleWithListingsError());
  const model = buildSpecModel(all);
  const affected = new Set(Object.keys(all.details));
  assert.ok(affected.size > 5);
  let checked = 0;
  for (const node of model.nodes) {
    const bound = model.bindings.nodes[node.id] ?? [];
    if (!bound.some((id) => affected.has(id))) continue;
    for (const stat of node.stats) {
      if (!bound.every((id) => affected.has(id)) && !stat.includes("unavailable")) continue;
      assert.ok(!/\d/.test(stat), `digit on node ${node.id}: "${stat}"`);
      checked += 1;
    }
    assert.ok(node.stats.some((s) => s.includes("unavailable")), `node ${node.id} lacks the unavailable word`);
  }
  for (const metric of model.metrics) {
    const id = model.bindings.metrics[metric.id];
    if (!affected.has(id)) continue;
    assert.ok(!/\d/.test(metric.value), `digit in widget ${metric.id}: "${metric.value}"`);
    assert.ok(metric.value.startsWith("unavailable"));
    checked += 1;
  }
  for (const [index, step] of model.tour.entries()) {
    const ids = model.bindings.tour[String(index)];
    if (affected.has(ids[0])) {
      assert.equal(step.value, "unavailable");
      checked += 1;
    }
  }
  for (const item of model.commandCenter.items) {
    const id = model.bindings.commandItems[item.id];
    if (!affected.has(id)) continue;
    assert.ok(item.impact?.startsWith("unavailable"), `command item ${item.id}: "${item.impact}"`);
    checked += 1;
  }
  assert.ok(checked > 10);
  assert.deepEqual(strayFigures(model, all), []);
});

test("with conflicting stored rows, the same registry id formats identically on node, command center, tour, and widget", () => {
  const all = selectAll(bundleWithConflict());
  const model = buildSpecModel(all);
  const id = "featured_offer_suppressed";
  const figure = figureOf(all, id);
  assert.ok(/^\d/.test(figure));

  const node = model.nodes.find((n) => n.id === "sat-suppressed-offers");
  assert.ok(node && node.stats[0].startsWith(figure), `node stat "${node?.stats[0]}" vs "${figure}"`);
  const item = model.commandCenter.items.find((i) => model.bindings.commandItems[i.id] === id);
  assert.ok(item?.impact?.startsWith(figure), `command impact "${item?.impact}" vs "${figure}"`);
  const retailStep = model.tour.find((s) => s.nodeId === "ecommerce");
  assert.equal(retailStep?.value, figure);
  const widget = model.metrics.find((m) => m.id === `metric-${id}`);
  assert.ok(widget?.value.startsWith(figure), `widget "${widget?.value}" vs "${figure}"`);
  assert.deepEqual(strayFigures(model, all), []);
});
