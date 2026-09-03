import type { DefaultView } from "@/lib/intofocus-portal/usePortalLogic";

export const PORTAL_SCREENS = ["hub", "sug", "read", "aeo", "ecom"] as const;
export type PortalScreen = (typeof PORTAL_SCREENS)[number];

export type PortalHubMode = "today" | "map";
export type PortalViewMode = "simple" | "data";

export type PortalUrlState = {
  screen: PortalScreen;
  hubMode: PortalHubMode;
  view: PortalViewMode;
};

export function isPortalScreen(value: string | null): value is PortalScreen {
  return PORTAL_SCREENS.includes(value as PortalScreen);
}

export function defaultViewMode(defaultView: DefaultView): PortalViewMode {
  return defaultView === "Data" ? "data" : "simple";
}

export function parsePortalSearchParams(
  searchParams: URLSearchParams,
  defaultView: DefaultView,
): PortalUrlState {
  const screenParam = searchParams.get("screen");
  const screen = isPortalScreen(screenParam) ? screenParam : "hub";
  const hubMode: PortalHubMode = searchParams.get("hub") === "map" ? "map" : "today";
  const viewParam = searchParams.get("view");
  const view: PortalViewMode =
    viewParam === "data" ? "data" : viewParam === "simple" ? "simple" : defaultViewMode(defaultView);

  return { screen, hubMode, view };
}

export function buildPortalSearchParams(state: PortalUrlState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("screen", state.screen);
  if (state.screen === "hub") {
    params.set("hub", state.hubMode === "map" ? "map" : "today");
  }
  params.set("view", state.view);
  return params;
}

export function portalUrlQuery(state: PortalUrlState): string {
  return buildPortalSearchParams(state).toString();
}
