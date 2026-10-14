"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  isColumnNode,
  scrollColumnLayoutToCenter,
  type ColumnLayoutPlan,
} from "@/lib/canvas-sdk/column-layout";
import { iomMotionMs } from "@/lib/canvas-sdk/iom-motion";
import type { CanvasNode } from "@/lib/canvas-sdk/types";

/** Keep the open spoke centered in the wide-panel column rail. */
export function useColumnRailScroll({
  columnLayout,
  columnPlan,
  columnScrollKey,
  focusedSpokeId,
  revealSatellites,
  nodes,
  svgRef,
  viewportRef,
}: {
  columnLayout: boolean;
  columnPlan: ColumnLayoutPlan | null;
  columnScrollKey: number;
  focusedSpokeId: string | null;
  revealSatellites: boolean;
  nodes: CanvasNode[];
  svgRef: RefObject<SVGSVGElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
}) {
  const columnScrollReadyRef = useRef(false);
  const columnScrollSpokeRef = useRef<string | null>(null);

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
      nodes.find((node) => node.spokeId === focusedSpokeId && isColumnNode(node)) ?? null;
    if (!match) return;

    const slot = columnPlan.positions.get(match.id);
    if (!slot) return;

    const motionMs = (baseMs: number) => (revealSatellites ? iomMotionMs(baseMs) : baseMs);
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
      const retry = window.setTimeout(() => scrollActive("smooth"), motionMs(120));
      return () => window.clearTimeout(retry);
    }

    columnScrollReadyRef.current = true;
    scrollActive("auto");
    let innerFrame = 0;
    const frame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => scrollActive("smooth"));
    });
    const timers = [80, 320, 520]
      .map((ms) => motionMs(ms))
      .map((ms) => window.setTimeout(() => scrollActive("smooth"), ms));

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
    nodes,
    svgRef,
    viewportRef,
  ]);
}
