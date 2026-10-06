"use client";

import { useCallback, useEffect, useState } from "react";

/** Slide-on / slide-off chrome (guided tour, zoom HUD, etc.). */
export function useSlidingChrome(
  open: boolean,
  exiting: boolean,
  onExitComplete: () => void,
) {
  const [mounted, setMounted] = useState(open);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    if (!open || exiting) return;
    setMounted(true);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOnScreen(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [open, exiting]);

  useEffect(() => {
    if (!exiting) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOnScreen(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [exiting]);

  useEffect(() => {
    if (!open && !exiting) setOnScreen(false);
  }, [open, exiting]);

  const onTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== "transform") return;
      if (onScreen) return;
      if (exiting) onExitComplete();
      setMounted(false);
    },
    [exiting, onExitComplete, onScreen],
  );

  return { mounted, onScreen, onTransitionEnd };
}
