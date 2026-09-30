import type { CanvasNode } from "@/lib/canvas-sdk/types";

/** Target on-screen bubble diameter in the left rail (px). */
export const IOM_COLUMN_BUBBLE_DIAMETER_PX = 200;

/** Viewport width (px) reserved for the bubble column when the panel is open. */
export const IOM_GRAPH_RAIL_PX = 240;

/** SVG viewBox width for column mode — paired with rail width for 200px bubbles. */
export const IOM_COLUMN_VIEW_WIDTH = 240;

const COLUMN_NODE_ORDER = [
  "hub",
  "spoke-fixes",
  "spoke-roadmap",
  "spoke-aeo",
  "spoke-retail",
  "spoke-specs",
  "spoke-competitors",
] as const;

export function isColumnNode(node: CanvasNode): boolean {
  return node.variant === "hub" || COLUMN_NODE_ORDER.includes(node.id as (typeof COLUMN_NODE_ORDER)[number]);
}

export function columnBubbleRadiusViewBox(
  viewBoxWidth = IOM_COLUMN_VIEW_WIDTH,
  railPx = IOM_GRAPH_RAIL_PX,
): number {
  return (IOM_COLUMN_BUBBLE_DIAMETER_PX * viewBoxWidth) / (2 * railPx);
}

export type ColumnLayoutPlan = {
  positions: Map<string, { x: number; y: number }>;
  viewBox: { w: number; h: number };
  bubbleR: number;
};

/** Stacks hub/spoke nodes in a single column with non-overlapping spacing. */
export function buildColumnLayout(
  nodes: CanvasNode[],
  railPx = IOM_GRAPH_RAIL_PX,
): ColumnLayoutPlan {
  const main = nodes.filter(isColumnNode);
  const byId = new Map(main.map((node) => [node.id, node]));
  const ordered: CanvasNode[] = [];

  for (const id of COLUMN_NODE_ORDER) {
    const node = byId.get(id);
    if (node) ordered.push(node);
  }
  for (const node of main) {
    if (!ordered.includes(node)) ordered.push(node);
  }

  const viewW = IOM_COLUMN_VIEW_WIDTH;
  const centerX = viewW / 2;
  const gap = 22;
  const paddingY = 36;
  let bubbleR = columnBubbleRadiusViewBox(viewW, railPx);

  const positions = new Map<string, { x: number; y: number }>();
  let yTop = paddingY;

  for (const node of ordered) {
    positions.set(node.id, { x: centerX, y: yTop + bubbleR });
    yTop += bubbleR * 2 + gap;
  }

  const viewH = Math.max(720, yTop + paddingY);

  return {
    positions,
    viewBox: { w: viewW, h: viewH },
    bubbleR,
  };
}
