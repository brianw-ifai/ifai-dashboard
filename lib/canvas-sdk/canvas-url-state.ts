export type CanvasPanelLayout = "wide" | "narrow" | "hidden";

export type CanvasUrlState = {
  spokeId: string | null;
  tabSlug: string | null;
  priorities: boolean;
  panelLayout: CanvasPanelLayout | null;
  tourStep: number | null;
  tourPaused: boolean;
  menuOpen: boolean;
  profileOpen: boolean;
};

const CANVAS_PARAM_KEYS = [
  "spoke",
  "tab",
  "priorities",
  "layout",
  "tour",
  "tourPaused",
  "menu",
  "profile",
] as const;

const PRESERVED_QUERY_KEYS = ["next"] as const;

export function tabSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tabIndexFromSlug(tabs: string[], slug: string | null): number {
  if (!slug) return 0;
  const normalized = slug.toLowerCase();
  const exact = tabs.findIndex((tab) => tabSlug(tab) === normalized);
  if (exact >= 0) return exact;
  const partial = tabs.findIndex((tab) => tab.toLowerCase().includes(normalized.replace(/-/g, " ")));
  return partial >= 0 ? partial : 0;
}

function isPanelLayout(value: string | null): value is CanvasPanelLayout {
  return value === "wide" || value === "narrow" || value === "hidden";
}

export function parseCanvasSearchParams(
  searchParams: URLSearchParams,
  spokeIds: readonly string[],
): CanvasUrlState {
  const spokeParam = searchParams.get("spoke");
  const spokeId =
    spokeParam && spokeIds.includes(spokeParam) ? spokeParam : null;

  const tourRaw = searchParams.get("tour");
  let tourStep: number | null = null;
  if (tourRaw) {
    const parsed = Number.parseInt(tourRaw, 10);
    if (Number.isFinite(parsed) && parsed >= 1) tourStep = parsed;
  }

  return {
    spokeId,
    tabSlug: searchParams.get("tab"),
    priorities: searchParams.get("priorities") === "1",
    panelLayout: isPanelLayout(searchParams.get("layout")) ? searchParams.get("layout") as CanvasPanelLayout : null,
    tourStep,
    tourPaused: searchParams.get("tourPaused") === "1",
    menuOpen: searchParams.get("menu") === "1",
    profileOpen: searchParams.get("profile") === "1",
  };
}

export function buildCanvasSearchParams(
  state: CanvasUrlState,
  preserve: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of PRESERVED_QUERY_KEYS) {
    const value = preserve.get(key);
    if (value) params.set(key, value);
  }

  if (state.priorities) params.set("priorities", "1");
  if (state.spokeId) params.set("spoke", state.spokeId);
  if (state.spokeId && state.tabSlug) params.set("tab", state.tabSlug);
  if (state.panelLayout) params.set("layout", state.panelLayout);
  if (state.tourStep !== null) params.set("tour", String(state.tourStep));
  if (state.tourPaused) params.set("tourPaused", "1");
  if (state.menuOpen) params.set("menu", "1");
  if (state.profileOpen) params.set("profile", "1");

  return params;
}

export function canvasUrlQueryEquals(a: URLSearchParams, b: URLSearchParams): boolean {
  const strip = (params: URLSearchParams) => {
    const next = new URLSearchParams(params);
    for (const key of CANVAS_PARAM_KEYS) next.delete(key);
    return next.toString();
  };
  if (strip(a) !== strip(b)) return false;
  const build = (params: URLSearchParams) => {
    const slice = new URLSearchParams();
    for (const key of CANVAS_PARAM_KEYS) {
      const value = params.get(key);
      if (value !== null) slice.set(key, value);
    }
    return slice.toString();
  };
  return build(a) === build(b);
}
