"use client";

import type { MouseEvent } from "react";
import type { CanvasEdge, NodeStatus } from "@/lib/canvas-sdk/types";

function polar(radius: number, deg: number) {
  const angle = (deg * Math.PI) / 180;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

function headerArcPath(radius: number, fontSize: number, title: string, inset?: number) {
  const rim = inset ?? Math.max(5.5, fontSize * 0.22 + 3);
  const r = Math.max(16, radius - rim);
  const arcLen = Math.max(title.length * fontSize * 0.5, fontSize * 4);
  const halfDeg = Math.min(
    78,
    Math.max(radius < 55 ? 55 : 48, ((arcLen / r) * 180) / Math.PI / 2 + 8),
  );
  const start = polar(r, 270 - halfDeg);
  const end = polar(r, 270 + halfDeg);
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function pillSize(label: string, fontSize: number) {
  return {
    width: Math.max(fontSize * 2.6, label.length * fontSize * 0.56 + fontSize * 1.4),
    height: fontSize + 9,
  };
}

export function CurvedHeader({
  id,
  radius,
  title,
  fontSize,
  inset,
  className = "node-title",
}: {
  id: string;
  radius: number;
  title: string;
  fontSize: number;
  inset?: number;
  className?: string;
}) {
  const pathId = `node-header-arc-${id}`;
  return (
    <>
      <path id={pathId} d={headerArcPath(radius, fontSize, title, inset)} fill="none" />
      <text className={className} fontSize={fontSize} dy={fontSize * 0.82}>
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {title}
        </textPath>
      </text>
    </>
  );
}

function StatPill({
  label,
  y,
  fontSize,
  status,
}: {
  label: string;
  y: number;
  fontSize: number;
  status?: NodeStatus;
}) {
  const { width, height } = pillSize(label, fontSize);
  const statusClass =
    status && status !== "neutral" ? ` status-${status}` : "";
  return (
    <g className="node-stat" transform={`translate(0, ${y})`}>
      <rect
        className={`node-stat-pill${statusClass}`}
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={height / 2}
      />
      <text className="node-stat-text" y={fontSize * 0.35} textAnchor="middle" fontSize={fontSize}>
        {label}
      </text>
    </g>
  );
}

export function CenteredStack({
  radius,
  stats,
  meta,
  pillSize: fontSize,
  status,
}: {
  radius: number;
  stats: string[];
  meta?: string;
  pillSize: number;
  status?: NodeStatus;
}) {
  const metaSize = fontSize * 0.82;
  const pillH = fontSize + 9;
  const metaH = meta ? metaSize + 2 : 0;
  const gap = radius < 62 ? 4 : 6;
  const rows = stats.length + (meta ? 1 : 0);
  const stackH = stats.length * pillH + metaH + Math.max(0, rows - 1) * gap;
  const nudge = radius < 62 ? 3 : 2;
  let y = -stackH / 2 + pillH / 2 + nudge;

  const pills = stats.map((label) => {
    const node = <StatPill key={label} label={label} y={y} fontSize={fontSize} status={status} />;
    y += pillH + gap;
    return node;
  });

  return (
    <>
      {pills}
      {meta ? (
        <text className="node-meta" y={y - pillH / 2 + metaH / 2} textAnchor="middle" fontSize={metaSize}>
          {meta}
        </text>
      ) : null}
    </>
  );
}

type BubbleIcon = "sparkles" | "bag" | "radar" | "clipboard" | "wrench";

const PRIMARY_SPOKES = new Set([
  "spoke-aeo",
  "spoke-retail",
  "spoke-competitors",
  "spoke-specs",
  "spoke-fixes",
]);

const SPOKE_ICONS: Record<string, BubbleIcon> = {
  "spoke-aeo": "sparkles",
  "spoke-retail": "bag",
  "spoke-competitors": "radar",
  "spoke-specs": "clipboard",
  "spoke-fixes": "wrench",
};

function BubbleGlyph({ icon }: { icon: BubbleIcon }) {
  return (
    <svg
      className="node-glyph"
      x={-11}
      y={-11}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon === "sparkles" ? (
        <path d="M9.9 15.5A2 2 0 0 0 8.5 14.1L2.4 12.5a.5.5 0 0 1 0-1L8.5 9.9A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" />
      ) : null}
      {icon === "bag" ? (
        <>
          <path d="M6 7h12l-1 13H7L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </>
      ) : null}
      {icon === "radar" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <path d="M12 12 17 7" />
        </>
      ) : null}
      {icon === "clipboard" ? (
        <>
          <rect x="7" y="4" width="10" height="16" rx="2" />
          <path d="M9 4.5h6v2H9z" />
          <path d="m9 13 2 2 4-4" />
        </>
      ) : null}
      {icon === "wrench" ? (
        <path d="M14.7 6.3a4.5 4.5 0 0 0-6.2 6.2L4 17a2 2 0 1 0 3 3l4.5-4.5a4.5 4.5 0 0 0 6.2-6.2L15 12l-3-3z" />
      ) : null}
    </svg>
  );
}

function titleLines(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2 || title.length <= 12) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function CenteredFace({
  title,
  stat,
  status,
  icon,
  radius,
  hub,
  prominent,
  logoSrc,
}: {
  title: string;
  stat?: string;
  status: NodeStatus;
  icon?: BubbleIcon;
  radius: number;
  hub?: boolean;
  prominent?: boolean;
  logoSrc?: string;
}) {
  const statusClass = status !== "neutral" ? ` status-${status}` : "";
  if (hub) {
    const lines = titleLines(title);
    const titleY = logoSrc ? 6 : -16;
    const titleStep = logoSrc ? 26 : 28;
    const titleSize = logoSrc ? 20 : 22;
    return (
      <g className="node-face">
        {logoSrc ? (
          <image
            className="hub-logo"
            href={logoSrc}
            x={-60}
            y={-72}
            width={120}
            height={45}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : null}
        {lines.map((line, index) => (
          <text
            key={line}
            className="node-title hub-title"
            y={titleY + index * titleStep}
            textAnchor="middle"
            fontSize={titleSize}
          >
            {line}
          </text>
        ))}
      </g>
    );
  }

  const lines = titleLines(title);
  const titleSize = prominent ? 20 : radius >= 74 ? 12 : 11;
  const lineH = titleSize + 4;
  const iconY = icon ? -radius * (prominent ? 0.46 : 0.38) : 0;
  const titleStart = icon ? (prominent ? 2 : -radius * 0.05) : -lineH * (lines.length / 2);
  const statY = titleStart + lines.length * lineH + 11;

  return (
    <g className="node-face">
      {icon ? (
        <g className="node-glyph-wrap" transform={`translate(0, ${iconY})`}>
          <BubbleGlyph icon={icon} />
        </g>
      ) : null}
      {lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          className="node-title node-face-title"
          y={titleStart + index * lineH}
          textAnchor="middle"
          fontSize={titleSize}
        >
          {line}
        </text>
      ))}
      {stat ? (
        <text
          className={`node-face-stat${statusClass}`}
          y={statY}
          textAnchor="middle"
          fontSize={radius >= 70 ? 12 : 11}
        >
          {stat}
        </text>
      ) : null}
    </g>
  );
}

type BubbleProps = {
  id: string;
  x: number;
  y: number;
  r: number;
  status: NodeStatus;
  title: string;
  titleSize?: number;
  stats: string[];
  meta?: string;
  centered?: boolean;
  logoSrc?: string;
  onClick: () => void;
  onMouseEnter: (evt: MouseEvent) => void;
  onMouseLeave: () => void;
};

export function GraphBubble({
  id,
  x,
  y,
  r,
  status,
  title,
  titleSize,
  stats,
  meta,
  centered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: BubbleProps) {
  const headerSize = titleSize ?? (r >= 70 ? 14.5 : r >= 50 ? 13 : 12);
  const statSize = r >= 70 ? 12 : 10.5;
  const statusClass = status !== "neutral" ? ` status-${status}` : "";

  return (
    <g
      className={`graph-node${PRIMARY_SPOKES.has(id) ? " spoke-primary" : ""}`}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <circle r={r + 10} className={`node-halo${statusClass}`} />
      <g className="node-inner">
        <circle r={r} className={`node-circle${statusClass}`} filter="url(#nodeShadow)" />
        {centered ? (
          <CenteredFace
            title={title}
            stat={stats[0]}
            status={status}
            icon={SPOKE_ICONS[id]}
            radius={r}
            prominent={PRIMARY_SPOKES.has(id)}
          />
        ) : (
          <>
            <CurvedHeader id={id} radius={r} title={title} fontSize={headerSize} />
            <CenteredStack radius={r} stats={stats} meta={meta} pillSize={statSize} />
          </>
        )}
      </g>
    </g>
  );
}

export function GraphHub({
  id,
  x,
  y,
  r,
  status,
  title,
  titleSize,
  stats,
  meta,
  centered = false,
  logoSrc,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: BubbleProps) {
  const pulseR = r * (140 / 98);
  const midR = r * (118 / 98);
  const headerSize = titleSize ?? 15;

  return (
    <g
      className="graph-node graph-hub"
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <circle r={pulseR} fill="url(#brandHubGradient)" opacity="0.45" className="node-pulse-ring hub-halo-pulse" />
      <g className="node-inner">
        <circle
          className="hub-mid-ring"
          r={midR}
          fill="url(#brandHubGradient)"
          filter="url(#nodeShadow)"
          stroke="var(--border-dark)"
          strokeWidth="3"
        />
        <circle r={r} className="node-circle hub-core" />
        {centered ? (
          <CenteredFace title={title} stat={stats[0]} status={status} radius={r} hub logoSrc={logoSrc} />
        ) : (
          <>
            <CurvedHeader id={id} radius={r} title={title} fontSize={headerSize} className="node-title hub-title" />
            <CenteredStack radius={r} stats={stats} meta={meta} pillSize={12} status={status} />
          </>
        )}
      </g>
    </g>
  );
}

export function ConnLine({ x1, y1, x2, y2, kind = "default" }: CanvasEdge) {
  const kindClass =
    kind === "active" ? " active-spoke" : kind !== "default" ? ` ${kind}` : "";
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={`conn-line${kindClass}`} />;
}

export function TourSpotlight({
  active,
  x,
  y,
  radius,
  category,
}: {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  category: string;
}) {
  return (
    <g
      id="tour-spotlight-group"
      style={{ display: active ? "block" : "none", pointerEvents: "none" }}
      transform={`translate(${x}, ${y})`}
    >
      <circle
        id="tour-spotlight-pulse"
        r={radius + 10}
        fill="none"
        stroke="var(--accent-purple)"
        strokeWidth="3"
        strokeDasharray="10 5"
        className="node-pulse-ring"
        opacity="0.8"
      />
      <circle
        id="tour-spotlight-ring"
        r={radius}
        fill="none"
        stroke="var(--color-indigo)"
        strokeWidth="2.5"
        filter="url(#glow-accent)"
      />
      <g id="tour-spotlight-tag" transform={`translate(0, -${radius + 10})`}>
        <rect
          x="-95"
          y="-14"
          width="190"
          height="28"
          rx="14"
          fill="#070d18"
          stroke="var(--accent-purple)"
          strokeWidth="1.8"
          filter="url(#nodeShadow)"
        />
        <circle cx="-75" cy="0" r="4" fill="var(--accent-purple)" />
        <text
          x="6"
          y="4"
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="800"
          fill="#ffffff"
          letterSpacing="0.5"
          id="tour-spotlight-tag-text"
        >
          {category}
        </text>
      </g>
    </g>
  );
}
