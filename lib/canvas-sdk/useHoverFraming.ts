"use client";

import { useCallback, useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import { fittedSatelliteClusters, groupBounds } from "@/lib/canvas-sdk/satellite-fit";
import type { CanvasSpec } from "@/lib/canvas-sdk/types";

/** `.hub-slots` sits 18px in and is 268px wide; keep 16px clear of it. */
const SLOT_COLUMN_RIGHT = 302;
/** Pointer travel that counts as the reader moving on, not the map sliding under a still cursor. */
const POINTER_TRAVEL = 6;

/**
 * Hovering or focusing a main bubble slides the map so that bubble and its satellites sit
 * centered in the space the signal slots leave free. Closing the slots slides the map back.
 * The slide waits for the camera to settle and for the pointer to move, so a bubble that
 * lands under a still cursor does not reframe the map again.
 */
export function useHoverFraming({
  spec,
  enabled,
  slotsVisible,
  viewportRef,
  pan,
  framePoint,
  frameOverview,
  settleMs,
}: {
  spec: CanvasSpec;
  enabled: boolean;
  slotsVisible: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
  pan: MutableRefObject<{ scale: number }>;
  framePoint: (x: number, y: number, scale: number, insetRight?: number, insetLeft?: number) => void;
  frameOverview: () => void;
  settleMs: number;
}) {
  const groups = useMemo(() => fittedSatelliteClusters(spec).groups, [spec]);
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
      const box = groupBounds(groups, node);
      const insetLeft = Math.max(0, SLOT_COLUMN_RIGHT - viewport.offsetLeft);
      framePoint((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, pan.current.scale, 0, insetLeft);
      framed.current = { id: nodeId, at: performance.now(), ...pointer.current };
    },
    [enabled, framePoint, groups, pan, settleMs, spec.nodes, viewportRef],
  );

  useEffect(() => {
    if (slotsVisible || !framed.current) return;
    framed.current = null;
    if (enabled) frameOverview();
  }, [enabled, frameOverview, slotsVisible]);

  return frameBubble;
}
