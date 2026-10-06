"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from "react";
import {
  ConnLine,
  GraphBubble,
  GraphHub,
  TourSpotlight,
} from "@/lib/canvas-sdk/GraphPrimitives";
import {
  buildColumnLayout,
  isColumnNode,
  scrollColumnLayoutToCenter,
} from "@/lib/canvas-sdk/column-layout";
import { iomMotionMs } from "@/lib/canvas-sdk/iom-motion";
import type { CanvasEdge, CanvasNode, CanvasSpec } from "@/lib/canvas-sdk/types";

const MAIN_BUBBLES = new Set([
  "hub",
  "spoke-aeo",
  "spoke-fixes",
  "spoke-roadmap",
  "spoke-retail",
  "spoke-competitors",
  "spoke-specs",
]);

function satelliteClusters(spec: CanvasSpec) {
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

function GraphStage({ spec }: { spec: CanvasSpec }) {
  if (spec.appearance !== "iom") return null;
  const hub = spec.nodes?.find((node) => node.variant === "hub");
  const cx = hub?.x ?? 800;
  const cy = hub?.y ?? 500;
  // Swirl occupies the upper mark; pin that center on the hub and clip the wordmark off.
  const swirlWidth = 720;
  const imgW = swirlWidth / 0.366;
  const imgH = imgW * (4500 / 8000);
  const imgX = cx - imgW / 2;
  const imgY = cy - imgH * 0.4436;

  return (
    <g className="graph-stage" pointerEvents="none">
      <g className="stage-washes stage-washes-dark">
        <ellipse cx={cx} cy={cy} rx={980} ry={680} fill="url(#iomStageCore)" />
        <ellipse cx={cx - 560} cy={cy - 350} rx={720} ry={540} fill="url(#iomStageBlue)" />
        <ellipse cx={cx + 560} cy={cy + 350} rx={800} ry={580} fill="url(#iomStageLilac)" />
      </g>
      <g className="stage-washes stage-washes-light">
        <ellipse cx={cx} cy={cy} rx={980} ry={680} fill="url(#iomStageCoreLight)" />
        <ellipse cx={cx - 560} cy={cy - 350} rx={720} ry={540} fill="url(#iomStageBlueLight)" />
        <ellipse cx={cx + 560} cy={cy + 350} rx={800} ry={580} fill="url(#iomStageLilacLight)" />
      </g>
      <g clipPath="url(#iomWatermarkClip)">
        <image
          href="/intofocus-ai-logo-stacked-full-color.png"
          x={imgX}
          y={imgY}
          width={imgW}
          height={imgH}
          opacity={0.13}
        />
      </g>
    </g>
  );
}

function GraphNode({
  node,
  centered,
  onFocusNode,
  onResetView,
  onShowTooltip,
  onHideTooltip,
  onGroupEnter,
  onGroupLeave,
  onSelect,
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
  emphasis?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  enterDelay?: number;
}) {
  const Node = node.variant === "hub" ? GraphHub : GraphBubble;
  return (
    <Node
      id={node.id}
      x={node.x}
      y={node.y}
      r={node.r}
      contentRadius={contentRadius}
      status={node.status}
      title={node.title}
      titleSize={node.titleSize}
      stats={node.stats}
      meta={node.id === "spoke-retail" ? node.meta : undefined}
      centered={centered}
      logoSrc={node.logoSrc}
      emphasis={emphasis}
      selected={selected}
      dimmed={dimmed}
      enterDelay={enterDelay}
      onClick={() => {
        onSelect?.();
        // The center node is the portfolio overview. A click always reopens it,
        // including when the camera is already framed on the hub.
        if (node.spokeId) onFocusNode(node.spokeId, node.subTab);
        else onResetView();
        onHideTooltip();
      }}
      onMouseEnter={(evt) => {
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

type Props = {
  spec: CanvasSpec;
  svgRef: RefObject<SVGSVGElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  transform: string;
  tourActive: boolean;
  tourX: number;
  tourY: number;
  tourRadius: number;
  tourCategory: string;
  onFocusNode: (spokeId: string, subTab?: string) => void;
  onResetView: () => void;
  overviewNonce: number;
  focusedSpokeId?: string | null;
  columnScrollKey?: number;
  columnLayout?: boolean;
  mapExiting?: boolean;
  mapEntering?: boolean;
  columnRailExiting?: boolean;
  onShowTooltip: (evt: MouseEvent, title: string, desc: string, hasMoreInfo?: boolean) => void;
  onHideTooltip: () => void;
};

export function CanvasGraph({
  spec,
  svgRef,
  viewportRef,
  transform,
  tourActive,
  tourX,
  tourY,
  tourRadius,
  tourCategory,
  onFocusNode,
  onResetView,
  overviewNonce,
  focusedSpokeId = null,
  columnScrollKey = 0,
  columnLayout = false,
  mapExiting = false,
  mapEntering = false,
  columnRailExiting = false,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  const mapViewBox = spec.viewBox ?? { w: 1600, h: 1000 };
  const columnPlan = useMemo(
    () => (columnLayout ? buildColumnLayout(spec.nodes ?? []) : null),
    [columnLayout, spec.nodes],
  );
  const activeViewBox = columnPlan?.viewBox ?? mapViewBox;
  const viewBoxAttr = columnPlan
    ? `${columnPlan.viewBox.x} ${columnPlan.viewBox.y} ${columnPlan.viewBox.w} ${columnPlan.viewBox.h}`
    : `0 0 ${activeViewBox.w} ${activeViewBox.h}`;
  const revealSatellites = spec.appearance === "iom";
  const motionMs = (baseMs: number) => (revealSatellites ? iomMotionMs(baseMs) : baseMs);
  const clusters = useMemo(
    () => (revealSatellites ? satelliteClusters(spec) : null),
    [revealSatellites, spec],
  );
  const satelliteIds = new Set(clusters?.groups.flatMap((group) => group.nodes.map((node) => node.id)) ?? []);
  /* Which satellite cluster is showing. The camera reset bumps `overviewNonce`,
     and stamping that onto the state lets a reset collapse the clusters by
     derivation — no reset effect, and a hide timer that fires afterwards is
     already a no-op because the derived value is null. */
  const [reveal, setReveal] = useState<{
    nonce: number;
    open: string | null;
    pinned: string | null;
  }>({ nonce: overviewNonce, open: null, pinned: null });
  const hideTimer = useRef(0);
  const columnLayoutWasActiveRef = useRef(false);
  const columnScrollReadyRef = useRef(false);
  const columnScrollSpokeRef = useRef<string | null>(null);
  const [columnRailEnterKey, setColumnRailEnterKey] = useState(0);

  useEffect(() => {
    if (columnLayout && !columnLayoutWasActiveRef.current) {
      setColumnRailEnterKey((key) => key + 1);
    }
    columnLayoutWasActiveRef.current = columnLayout;
  }, [columnLayout]);

  const current = reveal.nonce === overviewNonce ? reveal : null;
  const openParentId = current?.open ?? null;
  const pinnedParentId = current?.pinned ?? null;

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const revealGroup = (parentId: string) => {
    window.clearTimeout(hideTimer.current);
    setReveal({ nonce: overviewNonce, open: parentId, pinned: pinnedParentId });
  };

  const holdGroup = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setReveal((prev) => ({ ...prev, open: null })),
      motionMs(2000),
    );
  };

  const pinGroup = (parentId: string) => {
    window.clearTimeout(hideTimer.current);
    setReveal({ nonce: overviewNonce, open: parentId, pinned: parentId });
  };

  const emphasis = spec.appearance === "iom";
  const focusedNode = focusedSpokeId
    ? (spec.nodes ?? []).find((node) => node.spokeId === focusedSpokeId && MAIN_BUBBLES.has(node.id)) ?? null
    : null;

  const touchesFocus = (edge: CanvasEdge) =>
    Boolean(
      focusedNode &&
        ((edge.x1 === focusedNode.x && edge.y1 === focusedNode.y) ||
          (edge.x2 === focusedNode.x && edge.y2 === focusedNode.y)),
    );

  const nodePosition = (node: CanvasNode) => {
    const slot = columnPlan?.positions.get(node.id);
    return slot ?? { x: node.x, y: node.y };
  };

  useEffect(() => {
    if (!columnLayout) {
      columnScrollReadyRef.current = false;
      columnScrollSpokeRef.current = null;
      return;
    }
    if (!focusedSpokeId || !columnPlan) return;
    const viewport = viewportRef.current;
    const svg = svgRef.current;
    if (!viewport || !svg) return;

    const match =
      (spec.nodes ?? []).find(
        (node) => node.spokeId === focusedSpokeId && isColumnNode(node),
      ) ?? null;
    if (!match) return;

    const slot = columnPlan.positions.get(match.id);
    if (!slot) return;

    const scrollActive = (behavior: ScrollBehavior = "smooth") => {
      scrollColumnLayoutToCenter(viewport, svg, slot.y, behavior);
    };

    const spokeChanged =
      columnScrollReadyRef.current &&
      columnScrollSpokeRef.current !== null &&
      columnScrollSpokeRef.current !== focusedSpokeId;
    columnScrollSpokeRef.current = focusedSpokeId;

    if (spokeChanged) {
      scrollActive("smooth");
      const retry = window.setTimeout(
        () => scrollActive("smooth"),
        revealSatellites ? iomMotionMs(120) : 120,
      );
      return () => window.clearTimeout(retry);
    }

    columnScrollReadyRef.current = true;
    scrollActive("auto");
    let innerFrame = 0;
    const frame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => scrollActive("smooth"));
    });
    const retryMs = [80, 320, 520].map((ms) => motionMs(ms));
    const timers = retryMs.map((ms) => window.setTimeout(() => scrollActive("smooth"), ms));

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(innerFrame);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [
    columnLayout,
    columnPlan,
    columnScrollKey,
    focusedSpokeId,
    revealSatellites,
    spec.nodes,
    svgRef,
    viewportRef,
  ]);

  const renderNode = (node: CanvasNode, parentId?: string, delayMs = 0) => {
    const { x, y } = nodePosition(node);
    const inColumn = Boolean(columnPlan && isColumnNode(node));
    const r = inColumn ? columnPlan!.bubbleR : node.r;
    const contentRadius = inColumn ? node.r : undefined;
    return (
    <GraphNode
      key={node.id}
      node={{ ...node, x, y, r }}
      contentRadius={contentRadius}
      centered={emphasis}
      emphasis={emphasis && (!columnLayout || node.variant === "hub")}
      selected={Boolean(focusedNode && node.id === focusedNode.id)}
      enterDelay={delayMs}
      onFocusNode={onFocusNode}
      onResetView={onResetView}
      onShowTooltip={onShowTooltip}
      onHideTooltip={onHideTooltip}
      onGroupEnter={parentId ? () => revealGroup(parentId) : undefined}
      onGroupLeave={parentId ? holdGroup : undefined}
      onSelect={MAIN_BUBBLES.has(node.id) && node.id !== "hub" ? () => pinGroup(node.id) : undefined}
    />
    );
  };

  const columnPreserve = columnLayout ? "xMidYMin meet" : "xMidYMid meet";
  const graphSvg = (
    <svg
      key={columnLayout ? "column" : "map"}
      ref={svgRef}
      className={`canvas-svg${columnLayout ? " column-scroll-svg" : ""}`}
      viewBox={viewBoxAttr}
      preserveAspectRatio={columnPreserve}
      style={columnLayout ? undefined : { transform }}
    >
      {spec.appearance === "iom" && !columnLayout
        ? [250, 390, 530].map((radius) => {
            const hub = spec.nodes?.find((node) => node.variant === "hub");
            return (
              <circle
                key={`orbit-${radius}`}
                className="orbit-ring"
                cx={hub?.x ?? 800}
                cy={hub?.y ?? 500}
                r={radius}
              />
            );
          })
        : null}

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
        <filter id="auraBlur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <radialGradient id="hubBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#28375f" />
          <stop offset="52%" stopColor="#17213d" />
          <stop offset="100%" stopColor="#0d1222" />
        </radialGradient>
        <radialGradient id="spokeBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#222d4a" />
          <stop offset="55%" stopColor="#151c31" />
          <stop offset="100%" stopColor="#0e1322" />
        </radialGradient>
        <radialGradient id="luxHubAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!columnLayout
        ? (clusters ? clusters.trunk : (spec.edges ?? [])).map((edge, idx) => (
            <ConnLine key={`edge-${idx}`} {...edge} hot={touchesFocus(edge)} />
          ))
        : null}

      {!columnLayout && clusters
        ? clusters.groups.map((group) => (
            <g
              key={`satellites-${group.parent.id}`}
              className={`satellite-group${openParentId === group.parent.id || pinnedParentId === group.parent.id ? " visible" : ""}`}
            >
              {group.edges.map((edge, idx) => (
                <ConnLine key={`sat-edge-${group.parent.id}-${idx}`} {...edge} hot={touchesFocus(edge)} />
              ))}
              {group.nodes.map((node, idx) =>
                renderNode(node, group.parent.id, idx * motionMs(80)),
              )}
            </g>
          ))
        : null}

      {(spec.paths ?? []).map((path, idx) => (
        <path
          key={`path-${idx}`}
          className="conn-path"
          d={path.d}
          fill="none"
          stroke={path.stroke ?? "var(--danger-red)"}
          strokeWidth={path.strokeWidth ?? 2.5}
          opacity={path.opacity ?? 0.85}
        />
      ))}

      {(spec.nodes ?? [])
        .filter(
          (node) =>
            node.variant !== "hub" &&
            !satelliteIds.has(node.id) &&
            (!columnLayout || isColumnNode(node)),
        )
        .map((node) => renderNode(node, clusters?.groups.some((group) => group.parent.id === node.id) ? node.id : undefined))}

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
        .map((node) => renderNode(node))}

      {!columnLayout ? (
        <TourSpotlight
          active={tourActive}
          x={tourX}
          y={tourY}
          radius={tourRadius}
          category={tourCategory}
        />
      ) : null}
    </svg>
  );

  const mapViewBoxAttr = `0 0 ${mapViewBox.w} ${mapViewBox.h}`;
  const mapStage =
    spec.appearance === "iom" ? (
      <svg
        className="canvas-stage"
        viewBox={mapViewBoxAttr}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
          <defs>
            <radialGradient id="iomStageCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#143458" stopOpacity="0.62" />
              <stop offset="72%" stopColor="#143458" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="iomStageBlue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="iomStageLilac" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.12" />
              <stop offset="65%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="iomStageCoreLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
              <stop offset="72%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="iomStageBlueLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="iomStageLilacLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.16" />
              <stop offset="65%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
            <clipPath id="iomWatermarkClip">
              <rect
                x={(spec.nodes?.find((node) => node.variant === "hub")?.x ?? 800) - 400}
                y={(spec.nodes?.find((node) => node.variant === "hub")?.y ?? 500) - 300}
                width={800}
                height={580}
              />
            </clipPath>
          </defs>
          <GraphStage spec={spec} />
      </svg>
    ) : null;

  const showMapLayer = !columnLayout || mapExiting || mapEntering;

  return (
    <>
      {showMapLayer ? (
        spec.appearance === "iom" ? (
          <div
            className={`iom-map-layer${mapExiting ? " iom-map-exiting" : ""}${mapEntering ? " iom-map-entering" : ""}`}
          >
            {mapStage}
            {graphSvg}
          </div>
        ) : (
          graphSvg
        )
      ) : null}
      {columnLayout ? (
        <div
          key={columnRailEnterKey}
          className={`column-bubble-list${columnRailExiting ? " iom-column-rail-exiting" : ""}`}
        >
          {graphSvg}
        </div>
      ) : null}
    </>
  );
}
