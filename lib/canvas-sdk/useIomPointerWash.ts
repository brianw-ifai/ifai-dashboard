"use client";

import { useEffect, type RefObject } from "react";

/** Keeps --pointer-x / --pointer-y in sync for .canvas-pointer-wash on IOM shells. */
export function useIomPointerWash(bodyRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const onPointerMove = (event: PointerEvent) => {
      const box = body.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = ((event.clientX - box.left) / box.width) * 100;
      const y = ((event.clientY - box.top) / box.height) * 100;
      body.style.setProperty("--pointer-x", `${x}%`);
      body.style.setProperty("--pointer-y", `${y}%`);
    };

    body.addEventListener("pointermove", onPointerMove);
    return () => body.removeEventListener("pointermove", onPointerMove);
  }, [bodyRef]);
}
