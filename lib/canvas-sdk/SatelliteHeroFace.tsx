"use client";

import { satelliteHeroLayout } from "@/lib/canvas-sdk/hero-fit";
import type { NodeStatus } from "@/lib/canvas-sdk/types";

const ROW_CLASS = {
  title: "node-title node-face-title",
  value: "node-hero-value",
  valueText: "node-hero-value",
  label: "node-hero-label",
} as const;

/** Title, hero value, and label at fixed sizes, centered in a circle sized to hold them. */
export function SatelliteHeroFace({
  title,
  value,
  label,
  status,
}: {
  title: string;
  value: string;
  label: string;
  status: NodeStatus;
}) {
  const { rows } = satelliteHeroLayout(title, value, label);
  const statusClass = status !== "neutral" ? ` status-${status}` : "";
  return (
    <g className="node-face node-hero satellite-hero">
      {rows.map((row, index) => (
        <text
          key={`${row.kind}-${index}`}
          className={`${ROW_CLASS[row.kind]}${row.kind === "value" || row.kind === "valueText" ? statusClass : ""}`}
          y={row.baseline}
          textAnchor="middle"
          fontSize={row.size}
        >
          {row.text}
        </text>
      ))}
    </g>
  );
}
