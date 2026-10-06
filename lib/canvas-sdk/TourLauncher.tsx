"use client";

import { useSlidingChrome } from "@/lib/canvas-sdk/useSlidingChrome";
import { Compass } from "lucide-react";

type Props = {
  open: boolean;
  exiting: boolean;
  onExitComplete: () => void;
  label: string;
  onLaunch: () => void;
};

export function TourLauncher({ open, exiting, onExitComplete, label, onLaunch }: Props) {
  const { mounted, onScreen, onTransitionEnd } = useSlidingChrome(
    open,
    exiting,
    onExitComplete,
  );

  if (!mounted) return null;

  return (
    <button
      type="button"
      className={`tour-launcher map-chrome-slide hdr-btn hdr-btn-primary${onScreen ? " map-chrome-onscreen" : ""}`}
      onClick={onLaunch}
      onTransitionEnd={onTransitionEnd}
      aria-hidden={!onScreen}
      tabIndex={onScreen ? 0 : -1}
    >
      <Compass size={14} />
      <span>{label}</span>
    </button>
  );
}
