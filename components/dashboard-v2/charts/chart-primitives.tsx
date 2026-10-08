"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { NodeStatus } from "@/lib/canvas-sdk/types";

/**
 * Shared pieces for the inline SVG charts: a measured width so text stays at real pixel sizes,
 * the hatch pattern for unavailable marks, status and series color tokens, and the button
 * behavior every mark gets (click, Enter, Space, aria-expanded).
 */

export const CHART_FONT = 12;
export const BAR_THICKNESS = 14;
export const GAP = 2;

export function useMeasuredWidth(fallback = 560): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export function statusColor(status: NodeStatus): string {
  return `var(--dv2-status-${status})`;
}

export function seriesColor(index: number): string {
  return `var(--dv2-series-${(index % 3) + 1})`;
}

/** The hatch pattern for an unavailable or not-read mark. Returns the fill url and the defs. */
export function useHatch(): { fill: string; defs: ReactNode } {
  const raw = useId();
  const id = `dv2-hatch-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const defs = (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--dv2-neutral)" strokeWidth="1.5" />
      </pattern>
    </defs>
  );
  return { fill: `url(#${id})`, defs };
}

export type MarkProps = {
  role: "button";
  tabIndex: 0;
  className: string;
  "aria-expanded": boolean;
  "aria-controls": string;
  "aria-label": string;
  "data-mark-id": string;
  "data-registry-id": string;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<SVGGElement>) => void;
};

/** Every chart mark is a button that opens the drawer for its registry row. */
export function markProps(args: {
  id: string;
  registryId: string;
  label: string;
  open: boolean;
  controls: string;
  onActivate: () => void;
}): MarkProps {
  return {
    role: "button",
    tabIndex: 0,
    className: `dv2-mark${args.open ? " dv2-mark-open" : ""}`,
    "aria-expanded": args.open,
    "aria-controls": args.controls,
    "aria-label": `${args.label}: open the evidence`,
    "data-mark-id": args.id,
    "data-registry-id": args.registryId,
    onClick: args.onActivate,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        args.onActivate();
      }
    },
  };
}

/** A hover and focus note that uses the SDK's definition tooltip, never a native title. */
export function hoverNoteProps(title: string, desc: string) {
  return {
    className: "ifai-term dv2-hover-note",
    tabIndex: 0,
    "data-ifai-tooltip-title": title,
    "data-ifai-tooltip-desc": desc,
    "aria-label": `${title}: ${desc}`,
  };
}

/** Truncates a label to fit a pixel budget at the chart font, ending with an ellipsis. */
export function fitLabel(text: string, maxPx: number): string {
  const perChar = CHART_FONT * 0.56;
  const max = Math.max(3, Math.floor(maxPx / perChar));
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function Legend({ items }: { items: Array<{ label: string; color?: string; hatched?: boolean }> }) {
  return (
    <ul className="dv2-legend" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className={`dv2-legend-swatch${item.hatched ? " dv2-legend-hatched" : ""}`} style={item.color ? { background: item.color } : undefined} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
