import { satelliteFitRadius } from "@/lib/canvas-sdk/hero-fit";
import { satelliteClusters } from "@/lib/canvas-sdk/satellite-clusters";
import type { CanvasEdge, CanvasNode, CanvasSpec } from "@/lib/canvas-sdk/types";

export type SatelliteGroup = { parent: CanvasNode; nodes: CanvasNode[]; edges: CanvasEdge[] };

/** Clear space between two circles on the map. */
const CIRCLE_GAP = 16;
const PUSH_STEP = 6;
const MAX_PUSH = 240;

type Circle = { x: number; y: number; r: number };

function overlaps(a: Circle, b: Circle): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + CIRCLE_GAP;
}

function angleSpan(a: number, b: number): number {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

/**
 * Grow each satellite to fit its hero text, then place the group around its parent:
 * same directions as stored, pushed out so no circle touches the parent, a sibling, or
 * any other bubble on the map. A group whose satellites keep their stored size is unchanged.
 */
export function fitSatelliteGroup(group: SatelliteGroup, obstacles: Circle[]): SatelliteGroup {
  const radii = group.nodes.map((node) => satelliteFitRadius(node));
  if (radii.every((r, index) => r === group.nodes[index].r)) return group;

  const { parent } = group;
  // Angles are measured from the group's average direction, so a group that straddles
  // the 180 degree line does not wrap around to the far side of its parent.
  const base = Math.atan2(
    group.nodes.reduce((sum, node) => sum + Math.sin(Math.atan2(node.y - parent.y, node.x - parent.x)), 0),
    group.nodes.reduce((sum, node) => sum + Math.cos(Math.atan2(node.y - parent.y, node.x - parent.x)), 0),
  );
  const order = group.nodes
    .map((node, index) => ({
      index,
      angle: base + angleSpan(base, Math.atan2(node.y - parent.y, node.x - parent.x)),
      distance: Math.max(Math.hypot(node.x - parent.x, node.y - parent.y), parent.r + CIRCLE_GAP + radii[index]),
    }))
    .sort((a, b) => a.angle - b.angle);

  // Neighbours need enough angle between them that their circles clear each other.
  const needed = order.slice(1).map((item, i) => {
    const prev = order[i];
    const reach = Math.min(item.distance, prev.distance);
    const chord = Math.min(0.999, (radii[item.index] + radii[prev.index] + CIRCLE_GAP) / (2 * reach));
    return Math.max(angleSpan(prev.angle, item.angle), 2 * Math.asin(chord));
  });
  const span = needed.reduce((sum, step) => sum + step, 0);
  const middle = (order[0].angle + order[order.length - 1].angle) / 2;
  let angle = middle - span / 2;
  order.forEach((item, i) => {
    if (i > 0) angle += needed[i - 1];
    item.angle = angle;
  });

  const placed: Circle[] = [];
  const nodes = [...group.nodes];
  for (const item of order) {
    const r = radii[item.index];
    let circle: Circle = { x: 0, y: 0, r };
    for (let push = 0; push <= MAX_PUSH; push += PUSH_STEP) {
      const d = item.distance + push;
      circle = { x: parent.x + d * Math.cos(item.angle), y: parent.y + d * Math.sin(item.angle), r };
      if (![...obstacles, ...placed].some((other) => overlaps(circle, other))) break;
    }
    placed.push(circle);
    nodes[item.index] = { ...group.nodes[item.index], x: Math.round(circle.x), y: Math.round(circle.y), r };
  }

  const edges = nodes.map((node, index) => {
    const kind = group.edges[index]?.kind;
    const edge: CanvasEdge = { x1: parent.x, y1: parent.y, x2: node.x, y2: node.y };
    return kind ? { ...edge, kind } : edge;
  });
  return { parent, nodes, edges };
}

/** Fit every group. Main bubbles and the other groups' satellites are obstacles. */
export function fitSatelliteGroups(groups: SatelliteGroup[], mainNodes: CanvasNode[]): SatelliteGroup[] {
  const fitted: SatelliteGroup[] = [];
  groups.forEach((group, index) => {
    const pending = groups.slice(index + 1).flatMap((other) => other.nodes);
    const done = fitted.flatMap((other) => other.nodes);
    const obstacles = [...mainNodes, ...pending, ...done].map(({ x, y, r }) => ({ x, y, r }));
    fitted.push(fitSatelliteGroup(group, obstacles));
  });
  return fitted;
}

/** The map's satellite groups, each fitted to its hero text, plus the trunk edges. */
export function fittedSatelliteClusters(spec: CanvasSpec): { groups: SatelliteGroup[]; trunk: CanvasEdge[] } {
  const clusters = satelliteClusters(spec);
  const satelliteIds = new Set(clusters.groups.flatMap((group) => group.nodes.map((node) => node.id)));
  const mainNodes = (spec.nodes ?? []).filter((node) => !satelliteIds.has(node.id));
  return { groups: fitSatelliteGroups(clusters.groups, mainNodes), trunk: clusters.trunk };
}

/** Map-space box around a main bubble and its fitted satellites, halos included. */
export function groupBounds(
  groups: SatelliteGroup[],
  node: CanvasNode,
  halo = 30,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const circles = [node, ...(groups.find((group) => group.parent.id === node.id)?.nodes ?? [])];
  return {
    minX: Math.min(...circles.map((c) => c.x - c.r - halo)),
    minY: Math.min(...circles.map((c) => c.y - c.r - halo)),
    maxX: Math.max(...circles.map((c) => c.x + c.r + halo)),
    maxY: Math.max(...circles.map((c) => c.y + c.r + halo)),
  };
}
