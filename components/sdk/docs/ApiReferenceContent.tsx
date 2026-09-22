import { Code, PropTable } from "@/components/sdk/docs/DocsUi";

export function ApiReferenceContent() {
  return (
    <>
      <p className="sdk-docs-eyebrow">API reference</p>
      <h1 id="intelligence-canvas">IntelligenceCanvas</h1>
      <p className="sdk-docs-lede">
        High-level renderer. Composes <code>CanvasShell</code> with the data-driven{" "}
        <code>CanvasGraph</code>. Import everything below from <code>@/lib/canvas-sdk</code>.
      </p>
      <PropTable
        rows={[
          {
            name: "spec",
            type: "CanvasSpec",
            desc: "Brand chrome, graph, spokes, focus targets, and optional tour.",
          },
        ]}
      />

      <h2 id="define-canvas">defineCanvas</h2>
      <p>Identity helper for typed spec literals. Returns the same object you pass in.</p>
      <Code label="spec.ts">{`export function defineCanvas(spec: CanvasSpec): CanvasSpec`}</Code>

      <h2 id="canvas-spec">CanvasSpec</h2>
      <p>The contract every consumer implements. Required fields first, then chrome and graph.</p>
      <PropTable
        rows={[
          {
            name: "brand",
            type: "{ name, subtitle, logoSrc?, badge? }",
            desc: "Header identity.",
          },
          {
            name: "spokes",
            type: "Record<string, SpokeContent>",
            desc: "Drilldown panels keyed by spoke id.",
          },
          {
            name: "focusTargets",
            type: "Record<string, { x, y }>",
            desc: "Camera landing spots for spokeId or spokeId:subTab.",
          },
          {
            name: "nodes",
            type: "CanvasNode[]",
            defaultValue: "[]",
            desc: "Graph bubbles and optional hub. Required for IntelligenceCanvas.",
          },
          {
            name: "edges",
            type: "CanvasEdge[]",
            desc: "Straight connectors between coordinates.",
          },
          {
            name: "paths / badges",
            type: "CanvasPath[] / CanvasBadge[]",
            desc: "Optional SVG arcs and correlation labels.",
          },
          {
            name: "filters / tickers / search",
            type: "chrome fields",
            desc: "Header dropdown, metric chips, and keyword → spoke routing.",
          },
          {
            name: "tour",
            type: "TourStep[]",
            desc: "If non-empty, the Guided Tour button appears.",
          },
          {
            name: "headerActions / headerSlot",
            type: "actions | ReactNode",
            desc: "Extra header buttons, or a custom control such as the Canvas / Docs toggle.",
          },
        ]}
      />

      <h3 id="spoke-content">SpokeContent</h3>
      <PropTable
        rows={[
          { name: "badge", type: "string", desc: "Eyebrow on the panel header." },
          { name: "title", type: "string", desc: "Panel heading." },
          { name: "desc", type: "string", desc: "Short description under the title." },
          { name: "tabs", type: "string[]", desc: "Tab labels. Active index is owned by the shell." },
          {
            name: "render",
            type: "(tabIdx: number) => ReactNode | string",
            desc: "React node preferred. A string uses dangerouslySetInnerHTML (legacy /v3).",
          },
        ]}
      />

      <h2 id="canvas-shell">CanvasShell</h2>
      <p>
        Chrome + camera only. Children may be a node or a render prop that receives{" "}
        <code>CanvasRenderContext</code>.
      </p>
      <PropTable
        rows={[
          { name: "spec", type: "CanvasSpec", desc: "Same spec shape; nodes are optional." },
          {
            name: "children",
            type: "ReactNode | ((ctx) => ReactNode)",
            desc: "Viewport contents. Render prop gets svgRef, transform, focusNode, tour, tooltips.",
          },
        ]}
      />
      <h3>CanvasRenderContext</h3>
      <PropTable
        rows={[
          { name: "svgRef / transform", type: "ref + CSS transform", desc: "Wire these to your viewport surface." },
          { name: "focusNode", type: "(spokeId, subTab?) => void", desc: "Opens a spoke and frames its target." },
          { name: "resetView", type: "() => void", desc: "Clears the panel and returns to overview." },
          { name: "tourActive / tourX / tourY", type: "spotlight fields", desc: "Drive a custom tour ring if you are not using CanvasGraph." },
          { name: "showTooltip / hideTooltip", type: "hover helpers", desc: "Same tooltip chrome as the graph." },
        ]}
      />

      <h2 id="camera">useCanvasCamera</h2>
      <p>
        Exported for viewports that are not <code>CanvasGraph</code>. Pair with{" "}
        <code>CanvasShell</code>, or call <code>framePoint</code> / <code>frameOverview</code>{" "}
        yourself.
      </p>
      <Code label="camera.ts">
        {`const { transform, framePoint, frameOverview, zoomBy } =
  useCanvasCamera({ viewBox, viewportRef, svgRef });`}
      </Code>

      <h2 id="graph">Graph primitives</h2>
      <p>
        Use these when you are drawing a custom SVG graph instead of passing <code>nodes</code> into{" "}
        <code>IntelligenceCanvas</code>.
      </p>
      <PropTable
        rows={[
          { name: "CanvasGraph", type: "component", desc: "Data-driven SVG from spec.nodes / edges / paths / badges." },
          { name: "GraphBubble", type: "component", desc: "Spoke or satellite circle with curved title and stat pills." },
          { name: "GraphHub", type: "component", desc: "Pulsing core. variant: 'hub' on a CanvasNode selects this." },
          { name: "ConnLine", type: "component", desc: "Edge with kind default | critical | warning | active." },
          { name: "TourSpotlight", type: "component", desc: "Dashed ring + category tag used by the guided tour." },
        ]}
      />
      <p>
        Node status tokens: <code>danger</code>, <code>warning</code>, <code>success</code>,{" "}
        <code>neutral</code>. They drive stroke, fill mix, and the HUD legend. Live specimens of
        every bubble size, pill, edge, and panel widget are on the{" "}
        <a href="/sdk/docs/design">design system</a> page.
      </p>

      <h2 id="panel">Panel primitives</h2>
      <p>
        Drilldown helpers so every brand canvas shares the same visual language. Prefer these over
        ad-hoc markup in <code>render()</code>.
      </p>
      <PropTable
        rows={[
          { name: "MetricGrid / MetricCard", type: "layout + KPI", desc: "Two-up metrics at the top of a tab." },
          { name: "ContentBox", type: "section card", desc: "Titled container for tables and copy." },
          { name: "DataTable", type: "table", desc: "Compact comparison tables." },
          { name: "ActionCard / TagBadge", type: "status", desc: "Fixes, workstreams, and severity chips." },
        ]}
      />
      <Code label="panel.tsx">
        {`import { ContentBox, MetricCard, MetricGrid, TagBadge } from "@/lib/canvas-sdk";

render: () => (
  <>
    <MetricGrid>
      <MetricCard label="Buy Box" value="68%" tone="danger" sub="Target 95%" />
      <MetricCard label="Fixes" value="18" tone="success" />
    </MetricGrid>
    <ContentBox title="Status" extra={<TagBadge tone="warning">Watch</TagBadge>}>
      Schema coverage is 34% across the catalog.
    </ContentBox>
  </>
)`}
      </Code>
    </>
  );
}
