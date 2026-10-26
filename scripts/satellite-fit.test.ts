// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/satellite-fit.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { SATELLITE_HERO_TEXT, satelliteHeroLayout } from "../lib/canvas-sdk/hero-fit.ts";
import { hoverSlide } from "../lib/canvas-sdk/hover-frame.ts";
import { fittedSatelliteClusters, groupBounds } from "../lib/canvas-sdk/satellite-fit.ts";
import type { CanvasNode, CanvasSpec } from "../lib/canvas-sdk/types.ts";
import { HUB_LAYOUT, fenderCanvasEdges, primarySpokeLayouts, satelliteNode, type SatelliteId } from "../lib/fender-canvas/primary-spoke-layout.ts";

const HEROES: Partial<Record<SatelliteId, { title: string; value: string; label: string }>> = {
  "sat-prompts": { title: "Run Details", value: "95.7%", label: "Brand Consideration" },
  "sat-citations": { title: "Citations", value: "19.1%", label: "Fender-Owned Links" },
  "sat-drift": { title: "Fact Checks", value: "100.0%", label: "Accuracy" },
};

const SATELLITES: SatelliteId[] = [
  "sat-prompts", "sat-citations", "sat-drift", "sat-buybox", "sat-asin", "sat-map",
  "sat-schema", "sat-tables", "sat-taylor", "sat-amps",
];

function node(id: string, x: number, y: number, r: number, extra: Partial<CanvasNode> = {}): CanvasNode {
  return { id, x, y, r, status: "neutral", title: id, stats: [], tooltip: { title: "", desc: "" }, ...extra } as CanvasNode;
}

function spec(): CanvasSpec {
  const nodes: CanvasNode[] = [
    node("hub", HUB_LAYOUT.x, HUB_LAYOUT.y, HUB_LAYOUT.r, { variant: "hub" }),
    ...primarySpokeLayouts().map((spoke) => node(spoke.id, spoke.x, spoke.y, spoke.r)),
    ...SATELLITES.map((id) => {
      const s = satelliteNode(id);
      const hero = HEROES[id];
      return node(id, s.x, s.y, s.r, hero ? { title: hero.title, heroValue: { value: hero.value, label: hero.label } } : {});
    }),
  ];
  return { nodes, edges: fenderCanvasEdges() } as unknown as CanvasSpec;
}

test("hero text stays at its readable size and the ring clears every row", () => {
  for (const hero of Object.values(HEROES)) {
    const layout = satelliteHeroLayout(hero.title, hero.value, hero.label);
    const value = layout.rows.find((row) => row.kind === "value");
    assert.equal(value?.size, SATELLITE_HERO_TEXT.value);
    for (const row of layout.rows.filter((item) => item.kind === "label")) assert.equal(row.size, SATELLITE_HERO_TEXT.label);
    assert.ok(layout.radius > 52, `${hero.title} needs more than the stored radius`);
  }
});

test("a worded empty value reads at label size, not as a giant number", () => {
  const layout = satelliteHeroLayout("Run Details", "No resolved answers", "Brand Consideration");
  assert.ok(layout.rows.every((row) => row.kind !== "value"));
  assert.ok(layout.radius < 90);
});

test("grown satellites clear their parent, each other, and every other bubble", () => {
  const { groups } = fittedSatelliteClusters(spec());
  const circles = [
    ...spec().nodes!.filter((item) => !SATELLITES.includes(item.id as SatelliteId)),
    ...groups.flatMap((group) => group.nodes),
  ];
  for (let i = 0; i < circles.length; i += 1) {
    for (let j = i + 1; j < circles.length; j += 1) {
      const a = circles[i];
      const b = circles[j];
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
      assert.ok(gap >= 12, `${a.id} and ${b.id} are ${gap.toFixed(1)} apart`);
    }
  }
  const ai = groups.find((group) => group.parent.id === "spoke-aeo")!;
  for (const sat of ai.nodes) {
    const hero = HEROES[sat.id as SatelliteId]!;
    assert.equal(sat.r, satelliteHeroLayout(hero.title, hero.value, hero.label).radius);
  }
  assert.deepEqual(
    ai.edges.map((edge) => [edge.x2, edge.y2]),
    ai.nodes.map((sat) => [sat.x, sat.y]),
  );
});

test("a group with no hero value keeps its stored places", () => {
  const { groups } = fittedSatelliteClusters(spec());
  const retail = groups.find((group) => group.parent.id === "spoke-retail")!;
  for (const sat of retail.nodes) {
    const stored = satelliteNode(sat.id as SatelliteId);
    assert.deepEqual([sat.x, sat.y, sat.r], [stored.x, stored.y, stored.r]);
  }
});

test("the framing box holds the bubble and its satellites", () => {
  const { groups } = fittedSatelliteClusters(spec());
  const parent = spec().nodes!.find((item) => item.id === "spoke-aeo")!;
  const box = groupBounds(groups, parent, 0);
  for (const sat of groups.find((group) => group.parent.id === "spoke-aeo")!.nodes) {
    assert.ok(sat.x - sat.r >= box.minX && sat.x + sat.r <= box.maxX);
    assert.ok(sat.y - sat.r >= box.minY && sat.y + sat.r <= box.maxY);
  }
});

test("the hover slide clears the slots without pushing other bubbles under them", () => {
  const room = { left: 302, top: 64, right: 1175, bottom: 640 };
  const mains = { minX: 300, minY: 70, maxX: 900, maxY: 630 };
  const left = hoverSlide({ minX: 134, minY: 120, maxX: 520, maxY: 440 }, mains, room);
  assert.ok(left.dx >= 302 + 16 - 134, "the left group clears the slots");
  assert.ok(left.dx <= 1175 - 16 - 900, "the right-hand bubbles stay on screen");
  assert.equal(left.dy, 0);
  const right = hoverSlide({ minX: 640, minY: 150, maxX: 1060, maxY: 520 }, mains, room);
  assert.ok(right.dx >= 302 + 16 - 300, "a right-hand group does not slide the left bubbles under the slots");
  assert.ok(right.dx <= 18);
  const hub = hoverSlide({ minX: 520, minY: 250, maxX: 700, maxY: 450 }, mains, room);
  assert.equal(hub.dx, Math.round((302 + 1175) / 2 - 610));
});
