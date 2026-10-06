"use client";

import { useEffect, useMemo } from "react";
import { applyPortfolioRetailReading } from "@/components/v3/apply-portfolio-retail";
import { fenderCanvasSpec } from "@/components/v3/fender-canvas-spec";
import {
  unavailableRetailReading,
  type PortfolioRetailReading,
} from "@/components/v3/portfolio-retail-reading";
import { IntelligenceCanvas } from "@/lib/canvas-sdk";
import type { CanvasUserMenu } from "@/lib/canvas-sdk/types";

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

function viewerStorageScope(viewerId?: string) {
  if (!viewerId) return "anonymous";
  let hash = 2166136261;
  for (const character of viewerId.trim().toLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function FenderBrandCanvas({
  userMenu,
  viewerId,
  retailReading = unavailableRetailReading,
}: {
  userMenu?: CanvasUserMenu;
  viewerId?: string;
  retailReading?: PortfolioRetailReading;
}) {
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

  const spec = useMemo(() => {
    const withRetail = applyPortfolioRetailReading(fenderCanvasSpec, retailReading);
    const metricWidgets = withRetail.metricWidgets
      ? {
          ...withRetail.metricWidgets,
          storageKey: `${withRetail.metricWidgets.storageKey}:${viewerStorageScope(viewerId)}`,
        }
      : undefined;
    return {
      ...withRetail,
      ...(userMenu ? { userMenu, userEmail: userMenu.email } : {}),
      ...(metricWidgets ? { metricWidgets } : {}),
    };
  }, [retailReading, userMenu, viewerId]);

  return <IntelligenceCanvas spec={spec} />;
}
