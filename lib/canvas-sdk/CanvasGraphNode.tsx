"use client";

import type { MouseEvent } from "react";
import { GraphBubble, GraphHub } from "@/lib/canvas-sdk/GraphPrimitives";
import type { CanvasNode } from "@/lib/canvas-sdk/types";

export function CanvasGraphNode({
  node,
  centered,
  onFocusNode,
  onResetView,
  onShowTooltip,
  onHideTooltip,
  onGroupEnter,
  onGroupLeave,
  onSelect,
  onInspect,
  emphasis,
  selected,
  dimmed,
  enterDelay,
  contentRadius,
}: {
  node: CanvasNode;
  contentRadius?: number;
  centered: boolean;
  onFocusNode: (spokeId: string, subTab?: string) => void;
  onResetView: () => void;
  onShowTooltip: (evt: MouseEvent, title: string, desc: string, hasMoreInfo?: boolean) => void;
  onHideTooltip: () => void;
  onGroupEnter?: () => void;
  onGroupLeave?: () => void;
  onSelect?: () => void;
  onInspect?: () => void;
  emphasis?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  enterDelay?: number;
}) {
  const Node = node.variant === "hub" ? GraphHub : GraphBubble;
  const titleSize =
    contentRadius != null && node.railTitleSize != null ? node.railTitleSize : node.titleSize;
  return (
    <Node
      id={node.id}
      x={node.x}
      y={node.y}
      r={node.r}
      contentRadius={contentRadius}
      status={node.status}
      title={node.title}
      titleSize={titleSize}
      stats={node.stats}
      meta={node.id === "spoke-retail" || node.id === "spoke-roadmap" ? node.meta : undefined}
      centered={centered}
      logoSrc={node.logoSrc}
      emphasis={emphasis}
      selected={selected}
      dimmed={dimmed}
      enterDelay={enterDelay}
      onInspect={onInspect}
      onClick={() => {
        onSelect?.();
        onInspect?.();
        // The center node is the portfolio overview. A click always reopens it,
        // including when the camera is already framed on the hub.
        if (node.spokeId) onFocusNode(node.spokeId, node.subTab);
        else onResetView();
        onHideTooltip();
      }}
      onMouseEnter={(evt) => {
        onInspect?.();
        onGroupEnter?.();
        onShowTooltip(
          evt,
          node.tooltip.title,
          node.tooltip.desc,
          node.tooltip.hasMoreInfo ?? Boolean(node.spokeId),
        );
      }}
      onMouseMove={(evt) => {
        onShowTooltip(
          evt,
          node.tooltip.title,
          node.tooltip.desc,
          node.tooltip.hasMoreInfo ?? Boolean(node.spokeId),
        );
      }}
      onMouseLeave={() => {
        onGroupLeave?.();
        onHideTooltip();
      }}
    />
  );
}
