export type DocsPageId = "get-started" | "guides" | "api" | "design";

export type DocsNavItem = {
  id: string;
  label: string;
};

export type DocsNavGroup = {
  page: DocsPageId;
  group: string;
  href: string;
  items: DocsNavItem[];
};

export const DOCS_PAGES: Record<
  DocsPageId,
  { href: string; title: string; prev?: DocsPageId; next?: DocsPageId }
> = {
  "get-started": {
    href: "/sdk/docs",
    title: "Get started",
    next: "guides",
  },
  guides: {
    href: "/sdk/docs/guides",
    title: "Guides",
    prev: "get-started",
    next: "api",
  },
  api: {
    href: "/sdk/docs/api",
    title: "API reference",
    prev: "guides",
    next: "design",
  },
  design: {
    href: "/sdk/docs/design",
    title: "Design system",
    prev: "api",
  },
};

export const DOCS_NAV: DocsNavGroup[] = [
  {
    page: "get-started",
    group: "Get started",
    href: "/sdk/docs",
    items: [
      { id: "overview", label: "Overview" },
      { id: "quickstart", label: "Quickstart" },
    ],
  },
  {
    page: "guides",
    group: "Guides",
    href: "/sdk/docs/guides",
    items: [
      { id: "apply-brand", label: "Apply to a brand" },
      { id: "custom-viewport", label: "Custom viewport" },
    ],
  },
  {
    page: "api",
    group: "API reference",
    href: "/sdk/docs/api",
    items: [
      { id: "intelligence-canvas", label: "IntelligenceCanvas" },
      { id: "define-canvas", label: "defineCanvas" },
      { id: "canvas-spec", label: "CanvasSpec" },
      { id: "canvas-shell", label: "CanvasShell" },
      { id: "camera", label: "useCanvasCamera" },
      { id: "graph", label: "Graph primitives" },
      { id: "panel", label: "Panel primitives" },
    ],
  },
  {
    page: "design",
    group: "Design system",
    href: "/sdk/docs/design",
    items: [
      { id: "overview", label: "Visual language" },
      { id: "fonts", label: "Fonts" },
      { id: "colors", label: "Colors" },
      { id: "bubbles", label: "Bubbles" },
      { id: "pills", label: "Pills & badges" },
      { id: "lines", label: "Lines" },
      { id: "graphs", label: "Graphs" },
      { id: "charts", label: "Data displays" },
      { id: "sidebar", label: "Sidebar & chrome" },
    ],
  },
];

export function docsPageFromPath(pathname: string): DocsPageId {
  if (pathname.startsWith("/sdk/docs/design")) return "design";
  if (pathname.startsWith("/sdk/docs/api")) return "api";
  if (pathname.startsWith("/sdk/docs/guides")) return "guides";
  return "get-started";
}

export function docsHref(page: DocsPageId, id?: string) {
  const href = DOCS_PAGES[page].href;
  return id ? `${href}#${id}` : href;
}
