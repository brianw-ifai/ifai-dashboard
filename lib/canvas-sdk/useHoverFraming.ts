"use client";

import { useCallback, useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import { hoverSlide, type Box } from "@/lib/canvas-sdk/hover-frame";
import { fittedSatelliteClusters, groupBounds } from "@/lib/canvas-sdk/satellite-fit";
import type { CanvasSpec } from "@/lib/canvas-sdk/types";

/** `.hub-slots` sits 18px in and is 268px wide; keep 16px clear of it. */
const SLOT_COLUMN_RIGHT = 302;
/** Pointer travel that counts as the reader moving on, not the map sliding under a still cursor. */
const POINTER_TRAVEL = 6;

/**
 * Hovering or focusing a main bubble slides the map so that bubble and its satellites sit
 * clear of the signal slots and as central as the other bubbles allow (see hoverSlide).
 * Closing the slots slides the map back.
 * The slide waits for the camera to settle and for the pointer to move, so a bubble that
 * lands under a still cursor does not reframe the map again.
 */
export function useHoverFraming({
  spec,
  enabled,
  slotsVisible,
  viewportRef,
  pan,
  panBy,
  frameOverview,
  settleMs,
}: {
  spec: CanvasSpec;
  enabled: boolean;
  slotsVisible: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
  pan: MutableRefObject<{ scale: number; x: number; y: number }>;
  panBy: (dx: number, dy: number) => void;
  frameOverview: () => void;
  settleMs: number;
}) {
  const groups = useMemo(() => fittedSatelliteClusters(spec).groups, [spec]);
  const mains = useMemo(() => {
    const satellites = new Set(groups.flatMap((group) => group.nodes.map((node) => node.id)));
    const circles = (spec.nodes ?? []).filter((node) => !satellites.has(node.id));
    return circles.reduce<Box>(
      (box, c) => ({
        minX: Math.min(box.minX, c.x - c.r - 40),
        minY: Math.min(box.minY, c.y - c.r - 40),
        maxX: Math.max(box.maxX, c.x + c.r + 40),
        maxY: Math.max(box.maxY, c.y + c.r + 40),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
  }, [groups, spec.nodes]);
  const framed = useRef<{ id: string; at: number; x: number; y: number } | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  const frameBubble = useCallback(
    (nodeId: string) => {
      if (!enabled) return;
      const node = spec.nodes?.find((item) => item.id === nodeId);
      const viewport = viewportRef.current;
      if (!node || !viewport) return;
      const last = framed.current;
      if (last?.id === nodeId) return;
      if (last) {
        const settling = performance.now() - last.at < settleMs;
        const keyboard = document.activeElement?.matches?.(".graph-node:focus-visible") ?? false;
        const travel = Math.hypot(pointer.current.x - last.x, pointer.current.y - last.y);
        if (settling || (!keyboard && travel < POINTER_TRAVEL)) return;
      }
      const viewBox = spec.viewBox ?? { w: 1600, h: 1000 };
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      const fit = Math.min(w / viewBox.w, h / viewBox.h);
      const { scale, x, y } = pan.current;
      const toScreen = (box: Box): Box => ({
        minX: ((w - viewBox.w * fit) / 2 + box.minX * fit) * scale + x,
        maxX: ((w - viewBox.w * fit) / 2 + box.maxX * fit) * scale + x,
        minY: ((h - viewBox.h * fit) / 2 + box.minY * fit) * scale + y,
        maxY: ((h - viewBox.h * fit) / 2 + box.maxY * fit) * scale + y,
      });
      const header = parseFloat(getComputedStyle(viewport).getPropertyValue("--canvas-header-height")) || 64;
      const room = { left: Math.max(0, SLOT_COLUMN_RIGHT - viewport.offsetLeft), top: header, right: w, bottom: h };
      const { dx, dy } = hoverSlide(toScreen(groupBounds(groups, node)), toScreen(mains), room);
      const moved = dx !== 0 || dy !== 0;
      if (moved) panBy(dx, dy);
      // Only a slide needs the settle and pointer-travel guard; a still map does not.
      framed.current = moved
        ? { id: nodeId, at: performance.now(), ...pointer.current }
        : { id: nodeId, at: -Infinity, x: Number.NaN, y: Number.NaN };
    },
    [enabled, groups, mains, pan, panBy, settleMs, spec.nodes, spec.viewBox, viewportRef],
  );

  useEffect(() => {
    if (slotsVisible || !framed.current) return;
    framed.current = null;
    if (enabled) frameOverview();
  }, [enabled, frameOverview, slotsVisible]);

  return frameBubble;
}
