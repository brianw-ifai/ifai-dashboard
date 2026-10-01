"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_VIEWBOX = { w: 1600, h: 1000 };

const DEFAULT_CAMERA_ANIMATION_MS = 600;

export function useCanvasCamera({
  viewBox = DEFAULT_VIEWBOX,
  viewportRef,
  svgRef,
  cameraAnimationMs = DEFAULT_CAMERA_ANIMATION_MS,
}: {
  viewBox?: { w: number; h: number };
  viewportRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  /** How long `camera-animating` stays on the SVG; should match theme CSS transition duration. */
  cameraAnimationMs?: number;
}) {
  const pan = useRef({
    scale: 1,
    x: 0,
    y: 0,
    isPanning: false,
    startX: 0,
    startY: 0,
  });
  const cameraTimerRef = useRef(0);
  const [transform, setTransform] = useState("translate(0px, 0px) scale(1)");

  const applyTransform = useCallback(() => {
    const { x, y, scale } = pan.current;
    setTransform(`translate(${x}px, ${y}px) scale(${scale})`);
  }, []);

  const runCameraAnimation = useCallback(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.classList.add("camera-animating");
      window.clearTimeout(cameraTimerRef.current);
      cameraTimerRef.current = window.setTimeout(() => {
        svg.classList.remove("camera-animating");
      }, cameraAnimationMs);
    }
    applyTransform();
  }, [applyTransform, cameraAnimationMs, svgRef]);

  const viewBoxToLocal = useCallback(
    (x: number, y: number) => {
      const viewport = viewportRef.current;
      const w = viewport?.clientWidth ?? 0;
      const h = viewport?.clientHeight ?? 0;
      const fit = Math.min(w / viewBox.w, h / viewBox.h);
      return {
        x: (w - viewBox.w * fit) / 2 + x * fit,
        y: (h - viewBox.h * fit) / 2 + y * fit,
      };
    },
    [viewBox.h, viewBox.w, viewportRef],
  );

  const framePoint = useCallback(
    (viewX: number, viewY: number, scale: number, insetRight = 0) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const point = viewBoxToLocal(viewX, viewY);
      pan.current.scale = scale;
      pan.current.x = (viewport.clientWidth - insetRight) / 2 - point.x * scale;
      pan.current.y = viewport.clientHeight / 2 - point.y * scale;
      runCameraAnimation();
    },
    [runCameraAnimation, viewBoxToLocal, viewportRef],
  );

  const frameOverview = useCallback(() => {
    pan.current.scale = 1;
    pan.current.x = 0;
    pan.current.y = 0;
    runCameraAnimation();
  }, [runCameraAnimation]);

  const frameOverviewInstant = useCallback(() => {
    const svg = svgRef.current;
    if (svg) {
      window.clearTimeout(cameraTimerRef.current);
      svg.classList.remove("camera-animating");
    }
    pan.current.scale = 1;
    pan.current.x = 0;
    pan.current.y = 0;
    applyTransform();
  }, [applyTransform, svgRef]);

  const zoomBy = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const cx = viewport.clientWidth / 2;
      const cy = viewport.clientHeight / 2;
      const prevScale = pan.current.scale;
      const nextScale = Math.min(Math.max(prevScale * factor, 0.45), 3.0);
      const contentX = (cx - pan.current.x) / prevScale;
      const contentY = (cy - pan.current.y) / prevScale;

      pan.current.scale = nextScale;
      pan.current.x = cx - contentX * nextScale;
      pan.current.y = cy - contentY * nextScale;
      applyTransform();
    },
    [applyTransform, viewportRef],
  );

  useEffect(() => {
    return () => window.clearTimeout(cameraTimerRef.current);
  }, []);

  return {
    pan,
    transform,
    applyTransform,
    framePoint,
    frameOverview,
    frameOverviewInstant,
    zoomBy,
  };
}
