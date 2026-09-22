"use client";

import { useEffect } from "react";
import { fenderCanvasSpec } from "@/components/v3/fender-canvas-spec";
import { IntelligenceCanvas } from "@/lib/canvas-sdk";

declare global {
  interface Window {
    toggleRoiMode?: (mode: "pilot" | "enterprise") => void;
    toggleResourcingMode?: (mode: "managed" | "copilot") => void;
  }
}

function togglePair(
  activeBtnId: string,
  inactiveBtnId: string,
  showId: string,
  hideId: string,
) {
  const activeBtn = document.getElementById(activeBtnId);
  const inactiveBtn = document.getElementById(inactiveBtnId);
  const show = document.getElementById(showId);
  const hide = document.getElementById(hideId);
  if (!activeBtn || !inactiveBtn || !show || !hide) return;
  activeBtn.classList.add("active");
  inactiveBtn.classList.remove("active");
  show.style.display = "block";
  hide.style.display = "none";
}

export function FenderBrandCanvas() {
  useEffect(() => {
    window.toggleRoiMode = (mode) => {
      if (mode === "enterprise") {
        togglePair("btn-roi-enterprise", "btn-roi-pilot", "roi-content-enterprise", "roi-content-pilot");
      } else {
        togglePair("btn-roi-pilot", "btn-roi-enterprise", "roi-content-pilot", "roi-content-enterprise");
      }
    };
    window.toggleResourcingMode = (mode) => {
      if (mode === "copilot") {
        togglePair(
          "btn-resourcing-copilot",
          "btn-resourcing-managed",
          "resourcing-content-copilot",
          "resourcing-content-managed",
        );
      } else {
        togglePair(
          "btn-resourcing-managed",
          "btn-resourcing-copilot",
          "resourcing-content-managed",
          "resourcing-content-copilot",
        );
      }
    };

    return () => {
      delete window.toggleRoiMode;
      delete window.toggleResourcingMode;
    };
  }, []);

  return <IntelligenceCanvas spec={fenderCanvasSpec} />;
}
