"use client";

import { useEffect, useMemo } from "react";
import { CanvasLoadingShell } from "@/components/v3/live/CanvasLoadingShell";
import { DataFreshnessBar } from "@/components/v3/live/DataFreshnessBar";
import { useFenderCanvasData } from "@/components/v3/use-fender-canvas-data";
import { buildFenderCanvasSpec } from "@/lib/fender-canvas/build-canvas-spec";
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
}: {
  userMenu?: CanvasUserMenu;
  viewerId?: string;
}) {
  const { bundle, loading, stale, error } = useFenderCanvasData();

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
    if (!bundle) return null;
    return buildFenderCanvasSpec(bundle, {
      userMenu,
      viewerId,
      metricStorageSuffix: viewerStorageScope(viewerId),
      headerSlot: (
        <DataFreshnessBar fresh={bundle.fresh} stale={stale} />
      ),
    });
  }, [bundle, stale, userMenu, viewerId]);

  if (loading && !spec) {
    return <CanvasLoadingShell />;
  }

  if (!spec) {
    return (
      <div style={{ padding: 24, color: "var(--danger-red, #ef4444)" }}>
        Could not load live canvas data.{error ? ` ${error.message}` : ""}
      </div>
    );
  }

  return <IntelligenceCanvas spec={spec} />;
}
