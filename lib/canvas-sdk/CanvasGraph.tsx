"use client";

import type { MouseEvent, RefObject } from "react";
import {
  ConnLine,
  GraphBubble,
  GraphHub,
  TourSpotlight,
} from "@/lib/canvas-sdk/GraphPrimitives";
import type { CanvasNode, CanvasSpec } from "@/lib/canvas-sdk/types";

function GraphNode({
  node,
  onFocusNode,
  onResetView,
  onShowTooltip,
  onHideTooltip,
}: {
  node: CanvasNode;
  onFocusNode: (spokeId: string, subTab?: string) => void;
  onResetView: () => void;
  onShowTooltip: (evt: MouseEvent, title: string, desc: string, hasMoreInfo?: boolean) => void;
  onHideTooltip: () => void;
}) {
  const Node = node.variant === "hub" ? GraphHub : GraphBubble;
  return (
    <Node
      id={node.id}
      x={node.x}
      y={node.y}
      r={node.r}
      status={node.status}
      title={node.title}
      titleSize={node.titleSize}
      stats={node.stats}
      meta={node.meta}
      onClick={() => {
        if (node.spokeId) onFocusNode(node.spokeId, node.subTab);
        else onResetView();
      }}
      onMouseEnter={(evt) =>
        onShowTooltip(
          evt,
          node.tooltip.title,
          node.tooltip.desc,
          node.tooltip.hasMoreInfo ?? Boolean(node.spokeId),
        )
      }
      onMouseLeave={onHideTooltip}
    />
  );
}

type Props = {
  spec: CanvasSpec;
  svgRef: RefObject<SVGSVGElement | null>;
  transform: string;
  tourActive: boolean;
  tourX: number;
  tourY: number;
  tourRadius: number;
  tourCategory: string;
  onFocusNode: (spokeId: string, subTab?: string) => void;
  onResetView: () => void;
  onShowTooltip: (evt: MouseEvent, title: string, desc: string, hasMoreInfo?: boolean) => void;
  onHideTooltip: () => void;
};

export function CanvasGraph({
  spec,
  svgRef,
  transform,
  tourActive,
  tourX,
  tourY,
  tourRadius,
  tourCategory,
  onFocusNode,
  onResetView,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const viewBox = spec.viewBox ?? { w: 1600, h: 1000 };

  return (
    <svg
      ref={svgRef}
      className="canvas-svg"
      viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ transform }}
    >
      <defs>
        <radialGradient id="brandHubGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="glow-danger" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-accent" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="nodeShadow" x="-60%" y="-60%" width="220%" height="240%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0b1220" floodOpacity="0.4" />
        </filter>
      </defs>

      {(spec.edges ?? []).map((edge, idx) => (
        <ConnLine key={`edge-${idx}`} {...edge} />
      ))}

      {(spec.paths ?? []).map((path, idx) => (
        <path
          key={`path-${idx}`}
          d={path.d}
          fill="none"
          stroke={path.stroke ?? "var(--danger-red)"}
          strokeWidth={path.strokeWidth ?? 2.5}
          opacity={path.opacity ?? 0.85}
        />
      ))}

      {(spec.nodes ?? [])
        .filter((node) => node.variant !== "hub")
        .map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            onFocusNode={onFocusNode}
            onResetView={onResetView}
            onShowTooltip={onShowTooltip}
            onHideTooltip={onHideTooltip}
          />
        ))}

      {(spec.badges ?? []).map((badge, idx) => (
        <g key={`badge-${idx}`} transform={`translate(${badge.x}, ${badge.y})`}>
          <rect
            className="correlation-badge"
            x={-badge.width / 2}
            y={-badge.height / 2}
            width={badge.width}
            height={badge.height}
            rx={badge.height / 2}
            filter="url(#nodeShadow)"
          />
          <text
            className="correlation-badge-text"
            x="0"
            y="4"
            textAnchor="middle"
            fontSize="10.5"
          >
            {badge.text}
          </text>
        </g>
      ))}

      {(spec.nodes ?? [])
        .filter((node) => node.variant === "hub")
        .map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            onFocusNode={onFocusNode}
            onResetView={onResetView}
            onShowTooltip={onShowTooltip}
            onHideTooltip={onHideTooltip}
          />
        ))}

      <TourSpotlight
        active={tourActive}
        x={tourX}
        y={tourY}
        radius={tourRadius}
        category={tourCategory}
      />
    </svg>
  );
}
