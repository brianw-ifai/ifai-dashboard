import type { CanvasEdge, CanvasNode, CanvasSpec } from "@/lib/canvas-sdk/types";

export const MAIN_BUBBLES = new Set([
  "hub",
  "spoke-aeo",
  "spoke-fixes",
  "spoke-roadmap",
  "spoke-retail",
  "spoke-competitors",
  "spoke-specs",
]);

export function satelliteClusters(spec: CanvasSpec) {
  const nodes = spec.nodes ?? [];
  const at = new Map(nodes.map((node) => [`${node.x},${node.y}`, node]));
  const groups = new Map<string, { parent: CanvasNode; nodes: CanvasNode[]; edges: CanvasEdge[] }>();
  const trunk: CanvasEdge[] = [];

  for (const edge of spec.edges ?? []) {
    const start = at.get(`${edge.x1},${edge.y1}`);
    const end = at.get(`${edge.x2},${edge.y2}`);
    if (!start || !end) {
      trunk.push(edge);
      continue;
    }
    const startMain = MAIN_BUBBLES.has(start.id);
    const endMain = MAIN_BUBBLES.has(end.id);
    const parent = startMain && !endMain ? start : endMain && !startMain ? end : null;
    const child = parent === start ? end : parent === end ? start : null;
    if (!parent || !child) {
      trunk.push(edge);
      continue;
    }
    const group = groups.get(parent.id) ?? { parent, nodes: [], edges: [] };
    group.nodes.push(child);
    group.edges.push(edge);
    groups.set(parent.id, group);
  }

  return { groups: [...groups.values()], trunk };
}
