"use client";

import {
  ActionCard,
  ContentBox,
  DataTable,
  MetricCard,
  MetricGrid,
  TagBadge,
  defineCanvas,
} from "@/lib/canvas-sdk";
import type { ReactNode } from "react";

function CodeSample({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "12px 14px",
        borderRadius: 12,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        lineHeight: 1.55,
        color: "var(--text-main)",
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </pre>
  );
}

function tab(panels: ReactNode[]) {
  return (tabIdx: number) => panels[tabIdx] ?? panels[0];
}

export const sdkCanvasSpec = defineCanvas({
  brand: {
    name: "IntoFocus Canvas SDK",
    subtitle: "Reusable intelligence canvas kernel · extracted from /v3",
    logoSrc: "/icon.png",
    badge: "Developer Preview",
  },
  headerActions: [{ label: "Open home", href: "/" }],
  filters: [
    { value: "all", label: "Entire SDK surface", target: "overview" },
    { value: "shell", label: "Shell chrome (header, HUD, theme)", target: "shell" },
    { value: "graph", label: "Graph kernel (nodes, edges, hub)", target: "graph" },
    { value: "camera", label: "Camera (pan, zoom, frame)", target: "camera" },
    { value: "panel", label: "Drilldown slots", target: "drilldown" },
    { value: "apply", label: "Apply to other components", target: "apply" },
  ],
  tickers: [
    {
      id: "kernel",
      tone: "success",
      icon: "trending",
      spokeId: "apply",
      label: (
        <>
          Kernel: <strong>CanvasSpec</strong>
        </>
      ),
    },
    {
      id: "primitives",
      tone: "warning",
      icon: "sparkles",
      spokeId: "graph",
      label: (
        <>
          Primitives: <strong>6 graph + panel</strong>
        </>
      ),
    },
    {
      id: "consumer",
      tone: "danger",
      icon: "pulse",
      spokeId: "apply",
      label: (
        <>
          Live consumer: <strong>/v3</strong>
        </>
      ),
    },
  ],
  search: {
    placeholder: "Search shell, graph, camera, spec...",
    matchers: [
      { keywords: ["shell", "header", "hud", "theme", "chrome"], spokeId: "shell" },
      { keywords: ["graph", "node", "edge", "hub", "bubble"], spokeId: "graph" },
      { keywords: ["camera", "pan", "zoom", "frame"], spokeId: "camera" },
      { keywords: ["drill", "panel", "tab", "slot"], spokeId: "drilldown" },
      { keywords: ["tour", "guided", "spotlight"], spokeId: "tour" },
      { keywords: ["apply", "spec", "sdk", "component"], spokeId: "apply" },
    ],
  },
  legend: [
    { status: "danger", label: "Must supply in spec" },
    { status: "warning", label: "Optional composition" },
    { status: "success", label: "Ready to reuse" },
  ],
  edges: [
    { x1: 800, y1: 500, x2: 440, y2: 320, kind: "active" },
    { x1: 800, y1: 500, x2: 1160, y2: 320, kind: "critical" },
    { x1: 800, y1: 500, x2: 440, y2: 680, kind: "warning" },
    { x1: 800, y1: 500, x2: 1160, y2: 680, kind: "active" },
    { x1: 800, y1: 500, x2: 800, y2: 180, kind: "active" },
    { x1: 800, y1: 500, x2: 800, y2: 820, kind: "active" },
    { x1: 440, y1: 320, x2: 240, y2: 200 },
    { x1: 440, y1: 320, x2: 180, y2: 360 },
    { x1: 440, y1: 320, x2: 260, y2: 480 },
    { x1: 1160, y1: 320, x2: 1360, y2: 200, kind: "critical" },
    { x1: 1160, y1: 320, x2: 1420, y2: 360, kind: "critical" },
    { x1: 1160, y1: 320, x2: 1340, y2: 480 },
    { x1: 440, y1: 680, x2: 230, y2: 720 },
    { x1: 440, y1: 680, x2: 320, y2: 870 },
    { x1: 1160, y1: 680, x2: 1370, y2: 720 },
    { x1: 1160, y1: 680, x2: 1280, y2: 870 },
  ],
  paths: [{ d: "M 440 320 Q 800 310 1160 320", stroke: "var(--color-sky)" }],
  badges: [
    {
      x: 800,
      y: 315,
      width: 300,
      height: 24,
      text: "SAME SHELL · SWAP THE SPEC TO RESKIN ANY BRAND",
    },
  ],
  nodes: [
    {
      id: "sat-header",
      x: 240,
      y: 200,
      r: 52,
      status: "success",
      title: "HEADER",
      stats: ["Brand"],
      meta: "Tickers · Search",
      spokeId: "shell",
      subTab: "header",
      tooltip: {
        title: "Shell header",
        desc: "Brand block, filters, tickers, search, tour, and theme live in CanvasShell.",
      },
    },
    {
      id: "sat-hud",
      x: 180,
      y: 360,
      r: 52,
      status: "success",
      title: "HUD",
      stats: ["Zoom"],
      meta: "Legend · Reset",
      spokeId: "shell",
      tooltip: {
        title: "Viewport HUD",
        desc: "Zoom controls and status legend are part of the shell, not the graph.",
      },
    },
    {
      id: "sat-theme",
      x: 260,
      y: 480,
      r: 50,
      status: "warning",
      title: "THEME",
      stats: ["Light / Dark"],
      meta: "CSS tokens",
      spokeId: "shell",
      tooltip: {
        title: "Theme tokens",
        desc: "Light/dark is a shell toggle. Color meaning comes from status tokens on the spec.",
      },
    },
    {
      id: "sat-nodes",
      x: 1360,
      y: 200,
      r: 54,
      status: "danger",
      title: "NODES",
      stats: ["Required"],
      meta: "GraphBubble",
      spokeId: "graph",
      subTab: "nodes",
      tooltip: {
        title: "Graph nodes",
        desc: "Declare bubbles and a hub in CanvasSpec.nodes. Click wiring is automatic.",
      },
    },
    {
      id: "sat-edges",
      x: 1420,
      y: 360,
      r: 52,
      status: "warning",
      title: "EDGES",
      stats: ["Optional"],
      meta: "ConnLine",
      spokeId: "graph",
      tooltip: {
        title: "Graph edges",
        desc: "Straight connectors plus optional SVG paths and correlation badges.",
      },
    },
    {
      id: "sat-hub",
      x: 1340,
      y: 480,
      r: 50,
      status: "success",
      title: "HUB",
      stats: ["variant"],
      meta: "GraphHub",
      spokeId: "graph",
      tooltip: {
        title: "Hub primitive",
        desc: "Set variant: 'hub' for the pulsing core. No spokeId resets the camera.",
      },
    },
    {
      id: "sat-pan",
      x: 230,
      y: 720,
      r: 50,
      status: "warning",
      title: "PAN / ZOOM",
      stats: ["Wheel"],
      meta: "Drag canvas",
      spokeId: "camera",
      tooltip: {
        title: "Free camera",
        desc: "Drag to pan, wheel to zoom. useCanvasCamera is exported if you need a custom viewport.",
      },
    },
    {
      id: "sat-frame",
      x: 320,
      y: 870,
      r: 48,
      status: "success",
      title: "FRAME",
      stats: ["focusTargets"],
      meta: "Spoke camera",
      spokeId: "camera",
      tooltip: {
        title: "Framed focus",
        desc: "focusTargets keyed by spokeId or spokeId:subTab drive drilldown camera moves.",
      },
    },
    {
      id: "sat-tabs",
      x: 1370,
      y: 720,
      r: 51,
      status: "success",
      title: "TABS",
      stats: ["React"],
      meta: "or HTML string",
      spokeId: "drilldown",
      tooltip: {
        title: "Panel tabs",
        desc: "Each spoke declares tabs. render(tabIdx) returns React nodes or HTML.",
      },
    },
    {
      id: "sat-slots",
      x: 1280,
      y: 870,
      r: 48,
      status: "warning",
      title: "SLOTS",
      stats: ["Panel.*"],
      meta: "Metric · Table",
      spokeId: "drilldown",
      tooltip: {
        title: "Panel primitives",
        desc: "MetricCard, DataTable, ActionCard, and TagBadge style drilldowns consistently.",
      },
    },
    {
      id: "spoke-shell",
      x: 440,
      y: 320,
      r: 84,
      status: "success",
      title: "SHELL CHROME",
      titleSize: 13.5,
      stats: ["Header", "HUD"],
      meta: "CanvasShell",
      spokeId: "shell",
      tooltip: {
        title: "Reusable shell",
        desc: "The /v3 chrome — header, viewport, HUD, tooltip, drilldown, tour — as a drop-in shell.",
      },
    },
    {
      id: "spoke-graph",
      x: 1160,
      y: 320,
      r: 84,
      status: "danger",
      title: "GRAPH KERNEL",
      titleSize: 13.5,
      stats: ["Nodes", "Edges"],
      meta: "Data-driven SVG",
      spokeId: "graph",
      tooltip: {
        title: "Graph kernel",
        desc: "Supply nodes and edges. IntelligenceCanvas renders the SVG graph for you.",
      },
    },
    {
      id: "spoke-camera",
      x: 440,
      y: 680,
      r: 78,
      status: "warning",
      title: "CAMERA",
      titleSize: 14,
      stats: ["Pan", "Frame"],
      meta: "useCanvasCamera",
      spokeId: "camera",
      tooltip: {
        title: "Camera engine",
        desc: "Pan, zoom, and framed focus are owned by the shell so every consumer gets them.",
      },
    },
    {
      id: "spoke-drilldown",
      x: 1160,
      y: 680,
      r: 78,
      status: "success",
      title: "DRILLDOWN",
      titleSize: 13.5,
      stats: ["Tabs", "Slots"],
      meta: "React or HTML",
      spokeId: "drilldown",
      tooltip: {
        title: "Drilldown panel",
        desc: "Spoke content is a slot. Prefer React nodes; HTML strings still work for /v3.",
      },
    },
    {
      id: "spoke-apply",
      x: 800,
      y: 820,
      r: 74,
      status: "success",
      title: "APPLY",
      titleSize: 14,
      stats: ["defineCanvas", "Shell"],
      meta: "Any component",
      spokeId: "apply",
      tooltip: {
        title: "Apply the SDK",
        desc: "Pass a CanvasSpec to IntelligenceCanvas, or wrap a custom visualization in CanvasShell.",
      },
    },
    {
      id: "spoke-tour",
      x: 800,
      y: 180,
      r: 70,
      status: "success",
      title: "TOUR",
      titleSize: 14,
      stats: ["Steps", "Spotlight"],
      meta: "Guided overlay",
      spokeId: "tour",
      tooltip: {
        title: "Guided tour",
        desc: "Declare tour steps with camera targets. The shell owns spotlight, modal, and keyboard.",
      },
    },
    {
      id: "hub",
      x: 800,
      y: 500,
      r: 98,
      status: "success",
      variant: "hub",
      title: "CANVAS SDK",
      stats: ["1 Spec", "6 Spokes"],
      meta: "Shell · Graph · Tour",
      tooltip: {
        title: "Canvas SDK hub",
        desc: "The reusable kernel behind /v3. Swap the spec to apply it to another brand or component.",
        hasMoreInfo: false,
      },
    },
  ],
  spokes: {
    shell: {
      badge: "SDK · SHELL",
      title: "CanvasShell chrome",
      desc: "Header, viewport, HUD, tooltip, drilldown, and tour. The graph is a child, not the shell.",
      tabs: ["What you get", "Chrome spec", "Custom viewport"],
      render: tab([
        <>
          <MetricGrid>
            <MetricCard
              label="Owned by the shell"
              value="7 surfaces"
              sub="Header · viewport · HUD · tooltip · panel · tour · theme"
              tone="accent"
            />
            <MetricCard
              label="Owned by your spec"
              value="Copy + graph"
              sub="Brand, tickers, filters, nodes, spokes, tour steps"
              tone="success"
            />
          </MetricGrid>
          <ContentBox title="Why this is the reusable piece">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
              /v3 was a Fender-specific page. The shell is now generic: any dataset can reuse the
              same camera, chrome, and drilldown without forking the interaction layer.
            </p>
          </ContentBox>
        </>,
        <>
          <ContentBox title="Chrome fields on CanvasSpec">
            <DataTable
              headers={["Field", "Role", "Required"]}
              rows={[
                ["brand", "Name, subtitle, logo, badge", <TagBadge key="brand" tone="danger">Yes</TagBadge>],
                ["filters", "Header dropdown → spoke or overview", <TagBadge key="filters">Optional</TagBadge>],
                ["tickers", "Live metric chips that focus a spoke", <TagBadge key="tickers">Optional</TagBadge>],
                ["search.matchers", "Keyword → spoke routing", <TagBadge key="search.matchers">Optional</TagBadge>],
                ["legend", "HUD status key", <TagBadge key="legend">Optional</TagBadge>],
                ["headerActions", "Extra header links/buttons", <TagBadge key="headerActions">Optional</TagBadge>],
              ]}
            />
          </ContentBox>
        </>,
        <>
          <ContentBox title="Drop a different component into the same shell">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
              IntelligenceCanvas renders the SVG graph for you. For any other visualization, use
              CanvasShell and pass your component as the viewport child.
            </p>
            <CodeSample>
              {`import { CanvasShell } from "@/lib/canvas-sdk";

<CanvasShell spec={chromeSpec}>
  {(ctx) => (
    <MyCustomViz
      onSelect={(id) => ctx.focusNode(id)}
      transform={ctx.transform}
    />
  )}
</CanvasShell>`}
            </CodeSample>
          </ContentBox>
        </>,
      ]),
    },
    graph: {
      badge: "SDK · GRAPH",
      title: "Data-driven graph kernel",
      desc: "Nodes, edges, paths, and badges are data. GraphBubble, GraphHub, and ConnLine stay available for custom graphs.",
      tabs: ["Node model", "Primitives", "Status language"],
      render: tab([
        <>
          <ContentBox title="CanvasNode">
            <DataTable
              headers={["Field", "Purpose"]}
              rows={[
                [<strong key="id">id, x, y, r</strong>, "Layout in viewBox space (default 1600×1000)"],
                [<strong key="copy">title, stats, meta</strong>, "Curved header + stacked pills"],
                [
                  <strong key="spoke">spokeId / subTab</strong>,
                  "Opens a drilldown and frames that target",
                ],
                [
                  <strong key="hub">{'variant: "hub"'}</strong>,
                  "Pulsing core. Omit spokeId to reset the camera on click",
                ],
              ]}
            />
          </ContentBox>
        </>,
        <>
          <ContentBox title="Exported graph primitives">
            <DataTable
              headers={["Export", "Use when"]}
              rows={[
                ["IntelligenceCanvas", "You have a full CanvasSpec (this page and /v3)"],
                ["CanvasShell", "You want chrome + camera around a different component"],
                ["GraphBubble / GraphHub", "You are drawing a custom SVG graph"],
                ["ConnLine / TourSpotlight", "You need edges or the tour ring without the full graph"],
              ]}
            />
          </ContentBox>
        </>,
        <>
          <ContentBox title="Status tokens">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
              <TagBadge tone="danger">danger</TagBadge>{" "}
              <TagBadge tone="warning">warning</TagBadge>{" "}
              <TagBadge tone="success">success</TagBadge>{" "}
              <TagBadge>neutral</TagBadge>
            </p>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 8 }}>
              Stroke, fill mix, and legend dots all read from the same tokens so a new brand canvas
              keeps the IntoFocus visual language.
            </p>
          </ContentBox>
        </>,
      ]),
    },
    camera: {
      badge: "SDK · CAMERA",
      title: "Pan, zoom, and framed focus",
      desc: "The shell owns camera state. Specs only declare where to look via focusTargets.",
      tabs: ["Behaviors", "focusTargets", "Custom hook"],
      render: tab([
        <>
          <MetricGrid>
            <MetricCard label="Free camera" value="Drag + wheel" sub="Grab empty canvas to pan" />
            <MetricCard
              label="Framed focus"
              value="1.55×"
              sub="Spoke click insets for the drilldown panel"
              tone="accent"
            />
          </MetricGrid>
          <ContentBox title="Built-in gestures">
            <ul className="tour-card-list" style={{ fontSize: 12.5 }}>
              <li>Click a spoke or ticker to frame that node and open the panel.</li>
              <li>Escape or empty-canvas click closes the panel and returns to overview.</li>
              <li>HUD + / − zoom; compass recenters.</li>
            </ul>
          </ContentBox>
        </>,
        <>
          <ContentBox title="Key by spoke, or spoke:subTab">
            <CodeSample>
              {`focusTargets: {
  graph: { x: 1160, y: 320 },
  "graph:nodes": { x: 1360, y: 200 },
}`}
            </CodeSample>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 10 }}>
              Satellite nodes set <code>spokeId</code> plus <code>subTab</code> so the camera lands on
              the child, not only the parent spoke.
            </p>
          </ContentBox>
        </>,
        <>
          <ContentBox title="useCanvasCamera">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
              Exported for viewports that are not the SVG graph. Pair it with CanvasShell, or call
              framePoint / frameOverview from your own component.
            </p>
            <CodeSample>
              {`const { transform, framePoint, frameOverview, zoomBy } =
  useCanvasCamera({ viewBox, viewportRef, svgRef });`}
            </CodeSample>
          </ContentBox>
        </>,
      ]),
    },
    drilldown: {
      badge: "SDK · PANEL",
      title: "Drilldown slots",
      desc: "Each spoke is badge, title, description, tabs, and a render function. Prefer React nodes.",
      tabs: ["Spoke contract", "Panel primitives", "HTML escape hatch"],
      render: tab([
        <>
          <ContentBox title="SpokeContent">
            <DataTable
              headers={["Field", "Notes"]}
              rows={[
                ["badge / title / desc", "Panel header"],
                ["tabs", "One button per tab; active index is owned by the shell"],
                ["render(tabIdx)", "React node (this page) or HTML string (/v3)"],
              ]}
            />
          </ContentBox>
        </>,
        <>
          <ContentBox title="Panel.* helpers">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
              Use these instead of hand-rolling markup so every consumer matches the canvas visual
              system.
            </p>
            <DataTable
              headers={["Component", "For"]}
              rows={[
                ["MetricGrid / MetricCard", "KPI pair at the top of a tab"],
                ["ContentBox", "Section card with title"],
                ["DataTable", "Compact comparison tables"],
                ["ActionCard / TagBadge", "Fixes, status, and workstreams"],
              ]}
            />
          </ContentBox>
        </>,
        <>
          <ContentBox title="Legacy HTML from /v3">
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
              If <code>render()</code> returns a string, the shell uses{" "}
              <code>dangerouslySetInnerHTML</code>. New canvases should return React nodes.
            </p>
          </ContentBox>
        </>,
      ]),
    },
    tour: {
      badge: "SDK · TOUR",
      title: "Guided tour overlay",
      desc: "Declare steps with camera targets. The shell owns spotlight, modal, progress, and keyboard.",
      tabs: ["Step model", "Runtime"],
      render: tab([
        <>
          <ContentBox title="TourStep">
            <DataTable
              headers={["Field", "Purpose"]}
              rows={[
                ["nodeId", "hub closes; any spoke id opens that panel from the tour CTA"],
                ["targetX / targetY / radius", "Spotlight + camera"],
                ["title / subtitle / category", "Modal copy"],
                ["displays[] / value", "What this spoke shows, and why it matters"],
              ]}
            />
          </ContentBox>
        </>,
        <>
          <ContentBox title="Runtime">
            <ul className="tour-card-list" style={{ fontSize: 12.5 }}>
              <li>Guided Tour button appears automatically when spec.tour is non-empty.</li>
              <li>Arrow keys and dots move between steps; Escape exits.</li>
              <li>Explore Full Deep-Dive Panel closes the tour and focuses that spoke.</li>
            </ul>
          </ContentBox>
        </>,
      ]),
    },
    apply: {
      badge: "SDK · APPLY",
      title: "Apply this kernel to another component",
      desc: "Two integration paths: a full IntelligenceCanvas spec, or CanvasShell around a custom child.",
      tabs: ["IntelligenceCanvas", "CanvasShell + child", "Public API"],
      render: tab([
        <>
          <ActionCard
            tone="success"
            title="Path A — full canvas (this page and /v3)"
            details="Define nodes, spokes, focusTargets, and optional tour. The SDK renders chrome + graph."
          />
          <CodeSample>
            {`import { IntelligenceCanvas, defineCanvas } from "@/lib/canvas-sdk";

const spec = defineCanvas({
  brand: { name: "Acme Brand Canvas", subtitle: "Omnichannel health" },
  nodes: [/* hub + spokes + satellites */],
  edges: [/* connectors */],
  spokes: { aeo: { badge, title, desc, tabs, render } },
  focusTargets: { aeo: { x: 440, y: 320 } },
  tour: [/* optional */],
});

export function AcmeCanvas() {
  return <IntelligenceCanvas spec={spec} />;
}`}
          </CodeSample>
        </>,
        <>
          <ActionCard
            tone="critical"
            title="Path B — shell around another component"
            details="Keep header, camera, drilldown, and tour. Replace the SVG graph with any viewport."
          />
          <CodeSample>
            {`import { CanvasShell } from "@/lib/canvas-sdk";

<CanvasShell spec={chromeAndSpokesSpec}>
  {(ctx) => (
    <ProductGrid
      onOpen={(sku) => ctx.focusNode("retail", sku)}
    />
  )}
</CanvasShell>`}
          </CodeSample>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 10 }}>
            /v3 is Path A with the Fender spec. This /sdk page is Path A with an SDK spec. Path B is
            how the same shell wraps maps, tables, or product grids later.
          </p>
        </>,
        <>
          <ContentBox title="Import from @/lib/canvas-sdk">
            <DataTable
              headers={["Export", "Layer"]}
              rows={[
                ["defineCanvas / IntelligenceCanvas", "Full product canvas"],
                ["CanvasShell / useCanvasCamera", "Chrome + camera"],
                ["CanvasGraph / GraphBubble / GraphHub", "SVG graph"],
                ["MetricCard / DataTable / ActionCard", "Drilldown panels"],
              ]}
            />
          </ContentBox>
        </>,
      ]),
    },
  },
  focusTargets: {
    shell: { x: 440, y: 320 },
    "shell:header": { x: 240, y: 200 },
    graph: { x: 1160, y: 320 },
    "graph:nodes": { x: 1360, y: 200 },
    camera: { x: 440, y: 680 },
    drilldown: { x: 1160, y: 680 },
    apply: { x: 800, y: 820 },
    tour: { x: 800, y: 180 },
  },
  tour: [
    {
      nodeId: "hub",
      targetX: 800,
      targetY: 500,
      radius: 185,
      title: "1. Canvas SDK hub",
      subtitle: "The /v3 kernel, now a spec you can reuse",
      category: "SDK CORE",
      displays: [
        "One CanvasSpec drives chrome, graph, camera, drilldown, and tour.",
        "/v3 is a Fender consumer of this same kernel.",
        "This page is a second consumer — the SDK describing itself.",
      ],
      value:
        "Stop forking the canvas for each brand. Swap the spec (or the viewport child) and keep the interaction layer.",
    },
    {
      nodeId: "shell",
      targetX: 440,
      targetY: 320,
      radius: 125,
      title: "2. Shell chrome",
      subtitle: "Header, HUD, theme, tooltip, panel, tour",
      category: "SHELL",
      displays: [
        "Brand, filters, tickers, search, and header actions are spec fields.",
        "The graph is a child of CanvasShell, not hardcoded into it.",
        "Theme tokens stay in .ifai-canvas so every consumer matches.",
      ],
      value: "The shell is what you wrap around other components when you do not want the SVG graph.",
    },
    {
      nodeId: "graph",
      targetX: 1160,
      targetY: 320,
      radius: 125,
      title: "3. Graph kernel",
      subtitle: "Nodes, edges, hub, badges",
      category: "GRAPH",
      displays: [
        "Declare CanvasNode[] and CanvasEdge[] instead of hand-drawing SVG.",
        "variant: 'hub' plus no spokeId resets the camera.",
        "GraphBubble and GraphHub remain exported for custom drawings.",
      ],
      value: "A new brand canvas is mostly data: positions, stats, and spoke copy.",
    },
    {
      nodeId: "camera",
      targetX: 440,
      targetY: 680,
      radius: 120,
      title: "4. Camera engine",
      subtitle: "Pan, zoom, and framed spoke focus",
      category: "CAMERA",
      displays: [
        "Drag and wheel are built in.",
        "focusTargets keyed by spokeId or spokeId:subTab.",
        "useCanvasCamera is exported for non-graph viewports.",
      ],
      value: "Every consumer gets the same framing behavior without reimplementing pan/zoom.",
    },
    {
      nodeId: "drilldown",
      targetX: 1160,
      targetY: 680,
      radius: 120,
      title: "5. Drilldown slots",
      subtitle: "React panels (or HTML strings from /v3)",
      category: "PANEL",
      displays: [
        "Spokes declare tabs and render(tabIdx).",
        "Panel primitives: MetricCard, DataTable, ActionCard, TagBadge.",
        "HTML strings still work so the Fender content did not have to be rewritten.",
      ],
      value: "Deep-dive content is a slot. The shell only owns chrome and tab state.",
    },
    {
      nodeId: "apply",
      targetX: 800,
      targetY: 820,
      radius: 115,
      title: "6. Apply to another component",
      subtitle: "IntelligenceCanvas or CanvasShell + child",
      category: "APPLY",
      displays: [
        "Path A: defineCanvas() + <IntelligenceCanvas spec={...} />.",
        "Path B: <CanvasShell spec={...}>{(ctx) => <YourViz />}</CanvasShell>.",
        "/v3 proves Path A with a real brand dataset.",
      ],
      value: "This is the SDK contract: one kernel, many canvases — including non-graph surfaces.",
    },
    {
      nodeId: "tour",
      targetX: 800,
      targetY: 180,
      radius: 110,
      title: "7. Guided tour",
      subtitle: "Spotlight, modal, keyboard — owned by the shell",
      category: "TOUR",
      displays: [
        "Add spec.tour and the Guided Tour button appears.",
        "Each step frames a node and can open that spoke from the CTA.",
        "Arrow keys, dots, and Escape are wired for you.",
      ],
      value: "Tours are data. You write copy and camera targets; the overlay is shared.",
    },
  ],
});
