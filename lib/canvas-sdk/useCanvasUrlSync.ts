"use client";

import { isDashboardPath } from "@/lib/auth/dashboard-path";
import {
  buildCanvasSearchParams,
  canvasUrlQueryEquals,
  parseCanvasSearchParams,
  tabSlug,
  type CanvasUrlState,
} from "@/lib/canvas-sdk/canvas-url-state";
import type { CanvasUrlSyncSnapshot } from "@/lib/canvas-sdk/canvas-url-sync-types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export type { CanvasUrlSyncSnapshot } from "@/lib/canvas-sdk/canvas-url-sync-types";

type Options = {
  spokeIds: readonly string[];
  snapshot: CanvasUrlSyncSnapshot;
  onApplyFromUrl: (parsed: CanvasUrlState) => void;
  enabled?: boolean;
};

function snapshotToUrlState(snapshot: CanvasUrlSyncSnapshot): CanvasUrlState {
  const tabLabel = snapshot.tabLabels[snapshot.activeTab];
  const atOverview =
    !snapshot.spokeId &&
    snapshot.panelView === "spoke" &&
    !snapshot.tourActive &&
    !snapshot.tourSuspended;

  return {
    spokeId: snapshot.spokeId,
    tabSlug: snapshot.spokeId && tabLabel ? tabSlug(tabLabel) : null,
    priorities: snapshot.panelView === "command",
    panelLayout: atOverview ? null : snapshot.panelLayout,
    tourStep:
      snapshot.tourActive || snapshot.tourSuspended ? snapshot.tourStep + 1 : null,
    tourPaused: snapshot.tourSuspended,
    menuOpen: snapshot.menuOpen,
    profileOpen: snapshot.profileOpen,
  };
}

export function useCanvasUrlSync({
  spokeIds,
  snapshot,
  onApplyFromUrl,
  enabled = true,
}: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const onDashboard = isDashboardPath(pathname);

  const skipUrlSync = useRef(false);
  const onApplyRef = useRef(onApplyFromUrl);

  useEffect(() => {
    onApplyRef.current = onApplyFromUrl;
  }, [onApplyFromUrl]);

  useEffect(() => {
    if (!onDashboard || !enabled) return;
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    onApplyRef.current(parseCanvasSearchParams(searchParams, spokeIds));
  }, [enabled, onDashboard, searchKey, searchParams, spokeIds]);

  useEffect(() => {
    if (!onDashboard || !enabled) return;
    const state = snapshotToUrlState(snapshot);
    const built = buildCanvasSearchParams(state, searchParams);
    const current = new URLSearchParams(searchParams.toString());
    if (canvasUrlQueryEquals(built, current)) {
      skipUrlSync.current = false;
      return;
    }
    skipUrlSync.current = true;
    const query = built.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [
    enabled,
    onDashboard,
    pathname,
    router,
    searchParams,
    snapshot.spokeId,
    snapshot.activeTab,
    snapshot.panelView,
    snapshot.panelLayout,
    snapshot.tourActive,
    snapshot.tourStep,
    snapshot.tourSuspended,
    snapshot.menuOpen,
    snapshot.profileOpen,
  ]);
}
