// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/ai-search-surfaces.test.ts
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { tabIndexFromSlug, tabSlug } from "../lib/canvas-sdk/canvas-url-state.ts";
import { AI_TABS, RADAR_TABS } from "../lib/ai-search/canvas-surfaces.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");
const spec = JSON.parse(read("data/fender-v3-spec.json"));

function files(dir: string, ext: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) return files(rel, ext);
    return rel.endsWith(ext) ? [rel] : [];
  });
}

test("AI Search and Competitive Radar tabs match the panels", () => {
  assert.deepEqual(spec.spokes.aeo.tabs, Object.values(AI_TABS));
  assert.deepEqual(spec.spokes.competitors.tabs, Object.values(RADAR_TABS));
});

test("old AI Search and Competitive Radar slugs still open the same tab", () => {
  const aeo = spec.spokes.aeo.tabs as string[];
  const radar = spec.spokes.competitors.tabs as string[];
  const copied: Array<[string[], string, number]> = [
    [aeo, "dual-index-scoring-executive-callout", 0],
    [aeo, "100-ai-simulations-interactive-explorer", 1],
    [aeo, "ai-spec-hallucination-engine-root-causes", 2],
    [aeo, "citation-ecosystem-fender-dtc-opportunity", 3],
    [aeo, "hallucination", 2],
    [radar, "head-to-head-category-battlecards", 0],
    [radar, "rival-strategies-countermeasures", 1],
    [radar, "multi-marketplace-channel-scope-sweetwater-reverb-walmart", 2],
  ];
  for (const [tabs, slug, index] of copied) assert.equal(tabIndexFromSlug(tabs, slug), index, slug);
  for (const tabs of [aeo, radar]) {
    tabs.forEach((tab, index) => assert.equal(tabIndexFromSlug(tabs, tabSlug(tab)), index));
  }
});

test("Competitive Radar has no retail-channel coverage", () => {
  const radar = JSON.stringify(spec.spokes.competitors);
  const panels = ["CategoryBattlecardsPanel", "CompetitorWinsPanel", "EngineComparisonPanel"].map((name) =>
    read(`components/v3/live/ai-search/${name}.tsx`),
  );
  for (const text of [radar, ...panels]) {
    assert.doesNotMatch(text, /Sweetwater|Reverb|Walmart|listing_channel_price|shelf price/i);
    assert.doesNotMatch(text, /\bMAP\b/);
  }
});

test("AI surfaces never read the pooled canvas_metrics sim fields", () => {
  for (const path of [
    "lib/fender-canvas/nodes-from-live.ts",
    "lib/fender-canvas/tour-from-live.ts",
    "lib/fender-canvas/command-center-from-live.ts",
    ...files("lib/ai-search", ".ts"),
    ...files("components/v3/live/ai-search", ".tsx"),
  ]) {
    assert.doesNotMatch(read(path), /\bm\.sim_|sim_win_pct|sim_hallucinations/, path);
  }
});

test("every headline figure opens its evidence", () => {
  const summary = read("components/v3/live/ai-search/RunSummaryPanel.tsx");
  for (const value of ["fender_win", "resolved", "competitor_win", "unresolved", "error", "probe"]) {
    assert.match(summary, new RegExp(`value: "${value}"`), value);
  }
  assert.match(read("components/v3/live/ai-search/CitationEcosystemPanel.tsx"), /CitationEvidenceTable/);
  assert.match(read("components/v3/live/ai-search/AiDriftPanel.tsx"), /field: "sim"/);
  assert.match(read("components/v3/live/ai-search/CompetitorWinsPanel.tsx"), /field: "sim"/);
});

test("remediation and root cause render only through the genuine-text check", () => {
  const drawer = read("components/v3/live/ai-search/SimulationEvidenceDrawer.tsx");
  assert.match(drawer, /genuineGuidance\(row\.root_cause/);
  assert.match(drawer, /genuineGuidance\(row\.remediation_patch/);
  assert.match(drawer, /\{remediation \? \(/);
});

test("dotted AI definitions use the custom tooltip, never a native title", () => {
  const term = read("components/v3/live/ai-search/AiTerm.tsx");
  for (const attr of ['className="ifai-term"', "data-ifai-tooltip-title", "data-ifai-tooltip-desc", "tabIndex={0}", "aria-label"]) {
    assert.ok(term.includes(attr), attr);
  }
  for (const path of files("components/v3/live/ai-search", ".tsx")) {
    assert.doesNotMatch(read(path), /\stitle=/, path);
  }
});

test("TSX files stay within 400 lines", () => {
  for (const path of [...files("components/v3", ".tsx"), ...files("lib/fender-canvas", ".tsx")]) {
    const lines = read(path).split("\n").length - 1;
    assert.ok(lines <= 400, `${path} has ${lines} lines`);
  }
});

test("client copy has no em dashes", () => {
  for (const path of [...files("components/v3/live/ai-search", ".tsx"), ...files("lib/ai-search", ".ts")]) {
    assert.doesNotMatch(read(path), /\u2014/, path);
  }
});

test("protected surfaces are unchanged", () => {
  assert.match(read("lib/canvas-sdk/canvas-chrome-flags.ts"), /SHOW_HEADER_TICKERS = false/);
  const spokes = read("components/v3/build-live-spokes.tsx");
  assert.match(spokes, /<RetailOverview read=\{retail\} \/>/);
  assert.match(spokes, /<SuppressedListingsPanel read=\{retail\} \/>/);
  assert.match(spokes, /<MapChannelPanel/);
  const roi = JSON.stringify(spec.spokes.suggestions);
  for (const figure of ["$680,000", "$38M to $62M", "$50,000,000"]) assert.ok(roi.includes(figure), figure);
  assert.doesNotMatch(roi, /Reddit \/r\/Guitar Community|largest SOV gaps/);
});
