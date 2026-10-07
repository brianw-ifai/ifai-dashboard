"use client";

import {
  tabIndexFromSlug,
  type CanvasUrlState,
} from "@/lib/canvas-sdk/canvas-url-state";
import type { CanvasSpec } from "@/lib/canvas-sdk/types";
import { useCallback, useRef } from "react";

type PanelLayout = "wide" | "narrow" | "hidden";

type Deps = {
  spec: CanvasSpec;
  commandCenter: CanvasSpec["commandCenter"];
  iom: boolean;
  focusNode: (spokeId: string, subTab?: string) => void;
  enterTour: (stepIdx: number) => void;
  suspendTour: () => void;
  openCommandCenter: () => void;
  clearDeepLinkView: () => void;
  setPanelLayout: (layout: PanelLayout) => void;
  setUserMenuOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
};

function hasDeepLinkParams(parsed: CanvasUrlState): boolean {
  return Boolean(
    parsed.spokeId ||
      parsed.priorities ||
      parsed.tourStep !== null ||
      parsed.tourPaused ||
      parsed.menuOpen ||
      parsed.profileOpen ||
      parsed.panelLayout,
  );
}

export function useCanvasUrlApply(deps: Deps) {
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const seenDeepLinkRef = useRef(false);

  return useCallback((parsed: CanvasUrlState) => {
    const {
      spec,
      commandCenter,
      focusNode,
      enterTour,
      suspendTour,
      openCommandCenter,
      clearDeepLinkView,
      setPanelLayout,
      setUserMenuOpen,
      setProfileOpen,
    } = depsRef.current;

    setUserMenuOpen(parsed.menuOpen);
    setProfileOpen(parsed.profileOpen);

    if (parsed.tourStep !== null) {
      enterTour(parsed.tourStep - 1);
      if (parsed.tourPaused) suspendTour();
    } else if (parsed.tourPaused) {
      suspendTour();
    }

    if (parsed.priorities && commandCenter) {
      seenDeepLinkRef.current = true;
      openCommandCenter();
      if (parsed.panelLayout) setPanelLayout(parsed.panelLayout);
      return;
    }

    if (parsed.spokeId && spec.spokes[parsed.spokeId]) {
      seenDeepLinkRef.current = true;
      const spoke = spec.spokes[parsed.spokeId];
      const tabIdx = tabIndexFromSlug(spoke.tabs, parsed.tabSlug);
      const tabName = spoke.tabs[tabIdx];
      focusNode(parsed.spokeId, tabName);
      if (parsed.panelLayout) setPanelLayout(parsed.panelLayout);
      return;
    }

    if (hasDeepLinkParams(parsed)) {
      seenDeepLinkRef.current = true;
      return;
    }
    if (seenDeepLinkRef.current) {
      clearDeepLinkView();
      seenDeepLinkRef.current = false;
    }
  }, []);
}
