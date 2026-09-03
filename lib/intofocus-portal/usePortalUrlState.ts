"use client";

import {
  buildPortalSearchParams,
  defaultViewMode,
  parsePortalSearchParams,
  type PortalHubMode,
  type PortalScreen,
  type PortalViewMode,
} from "@/lib/intofocus-portal/url-state";
import type { DefaultView } from "@/lib/intofocus-portal/usePortalLogic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePortalUrlState(defaultView: DefaultView = "Simple") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const initial = parsePortalSearchParams(searchParams, defaultView);
  const [screen, setScreen] = useState<PortalScreen>(initial.screen);
  const [hubMode, setHubMode] = useState<PortalHubMode>(initial.hubMode);
  const [views, setViews] = useState<Record<string, PortalViewMode>>(() => ({
    [initial.screen]: initial.view,
  }));

  const skipUrlSync = useRef(false);
  const hydrated = useRef(false);

  const viewForScreen = useCallback(
    (scr: string) => views[scr] ?? defaultViewMode(defaultView),
    [views, defaultView],
  );

  const currentView = viewForScreen(screen);

  const replaceUrl = useCallback(
    (next: { screen: PortalScreen; hubMode: PortalHubMode; view: PortalViewMode }) => {
      const params = buildPortalSearchParams(next);
      const query = params.toString();
      if (query === searchKey) return;
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchKey],
  );

  // Hydrate canonical URL on first mount when params are missing.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    replaceUrl({ screen: initial.screen, hubMode: initial.hubMode, view: initial.view });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Browser back/forward: URL -> state
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    const parsed = parsePortalSearchParams(searchParams, defaultView);
    setScreen(parsed.screen);
    setHubMode(parsed.hubMode);
    setViews((prev) => ({ ...prev, [parsed.screen]: parsed.view }));
  }, [searchKey, searchParams, defaultView]);

  const go = useCallback(
    (next: PortalScreen) => {
      const view = viewForScreen(next);
      skipUrlSync.current = true;
      setScreen(next);
      setViews((prev) => ({ ...prev, [next]: view }));
      replaceUrl({ screen: next, hubMode, view });
    },
    [hubMode, replaceUrl, viewForScreen],
  );

  const setHub = useCallback(
    (mode: PortalHubMode) => {
      skipUrlSync.current = true;
      setHubMode(mode);
      replaceUrl({ screen, hubMode: mode, view: currentView });
    },
    [currentView, replaceUrl, screen],
  );

  const setView = useCallback(
    (mode: PortalViewMode) => {
      skipUrlSync.current = true;
      setViews((prev) => ({ ...prev, [screen]: mode }));
      replaceUrl({ screen, hubMode, view: mode });
    },
    [hubMode, replaceUrl, screen],
  );

  return {
    screen,
    hubMode,
    views,
    currentView,
    go,
    setHub,
    setView,
  };
}
