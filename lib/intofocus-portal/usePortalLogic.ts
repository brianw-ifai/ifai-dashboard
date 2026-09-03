"use client";

import { buildPortalVals } from "@/lib/intofocus-portal/portal-logic";
import { usePortalUrlState } from "@/lib/intofocus-portal/usePortalUrlState";
import { useCallback, useMemo, useState } from "react";

export type DefaultView = "Simple" | "Data";

export type PortalProps = {
  defaultView?: DefaultView;
  showLockedModules?: boolean;
};

export function usePortalLogic({
  defaultView = "Simple",
  showLockedModules = true,
}: PortalProps = {}) {
  const { screen, hubMode, views, go: goScreen, setHub, setView: setViewMode } =
    usePortalUrlState(defaultView);

  const [mapDark, setMapDark] = useState(false);
  const [mapStacked, setMapStacked] = useState(false);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [drills, setDrills] = useState<Record<string, boolean>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [area, setArea] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Recommended");
  const [help, setHelp] = useState(false);
  const [resp, setResp] = useState(false);

  const go = useCallback(
    (next: string) => {
      goScreen(next as Parameters<typeof goScreen>[0]);
      setDrawer(null);
      setHelp(false);
    },
    [goScreen],
  );

  const setView = useCallback(
    (v: string) => {
      setViewMode(v as "simple" | "data");
    },
    [setViewMode],
  );

  const set = useCallback(
    (key: string, value: unknown) => {
      if (key === "hubMode") {
        setHub(value as "today" | "map");
        return;
      }
      const setters: Record<string, (v: unknown) => void> = {
        help: (v) => setHelp(v as boolean),
        resp: (v) => setResp(v as boolean),
        area: (v) => setArea(v as string),
        status: (v) => setStatus(v as string),
        sort: (v) => setSort(v as string),
      };
      setters[key]?.(value);
    },
    [setHub],
  );

  const toggleDrill = useCallback((id: string) => {
    setDrills((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const vals = useMemo(
    () =>
      buildPortalVals({
        screen,
        hubMode,
        mapDark,
        mapStacked,
        views,
        drawer,
        drills,
        statuses,
        choices,
        area,
        status,
        sort,
        help,
        resp,
        defaultView,
        showLockedModules,
        go,
        set,
        setView,
        setDrawer,
        setDrills,
        setStatuses,
        setChoices,
        setMapDark,
        setMapStacked,
        setHelp,
        setResp,
        toggleDrill,
      }),
    [
      screen,
      hubMode,
      mapDark,
      mapStacked,
      views,
      drawer,
      drills,
      statuses,
      choices,
      area,
      status,
      sort,
      help,
      resp,
      defaultView,
      showLockedModules,
      go,
      set,
      setView,
      toggleDrill,
    ],
  );

  return vals;
}

export type PortalVals = ReturnType<typeof usePortalLogic>;
