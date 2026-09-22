import { Code } from "@/components/sdk/docs/DocsUi";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function GetStartedContent() {
  return (
    <>
      <p className="sdk-docs-eyebrow">Get started</p>
      <h1 id="overview">Build intelligence canvases from a spec</h1>
      <p className="sdk-docs-lede">
        The kernel behind the Fender map at <a href="/v3">/v3</a>. Pass a <code>CanvasSpec</code> and
        you get chrome, camera, graph, drilldown, and tour — or wrap any other component in the same
        shell.
      </p>

      <div className="sdk-docs-callout">
        <Sparkles size={16} color="#4338ca" />
        <div>
          <strong>Two integration paths</strong>
          <p>
            Path A is a full graph canvas via <code>IntelligenceCanvas</code>. Path B is{" "}
            <code>CanvasShell</code> around your own viewport. Switch to Canvas to see Path A applied
            to this SDK.
          </p>
          <div className="sdk-docs-cta-row">
            <Link href="/sdk" className="sdk-docs-cta">
              Open canvas map
            </Link>
            <Link href="/sdk/docs/design" className="sdk-docs-cta">
              Design system
            </Link>
          </div>
        </div>
      </div>

      <p>
        Import from <code>@/lib/canvas-sdk</code>. Nothing to publish or install — this package lives
        in the dashboard and is meant to be reused across brand canvases and other visualizations.
      </p>

      <h2 id="quickstart">Quickstart</h2>
      <p>
        Define a spec, then render <code>IntelligenceCanvas</code>. Nodes, spokes, and camera targets
        are data. The shell owns pan, zoom, theme, and the drilldown panel.
      </p>

      <Code label="quickstart.tsx">
        {`import { IntelligenceCanvas, defineCanvas } from "@/lib/canvas-sdk";

const spec = defineCanvas({
  brand: {
    name: "Acme Brand Canvas",
    subtitle: "Omnichannel health",
    badge: "Live",
  },
  nodes: [
    {
      id: "hub",
      x: 800,
      y: 500,
      r: 98,
      status: "success",
      variant: "hub",
      title: "ACME",
      stats: ["92"],
      tooltip: { title: "Hub", desc: "Portfolio core", hasMoreInfo: false },
    },
  ],
  spokes: {
    retail: {
      badge: "RETAIL",
      title: "Buy Box",
      desc: "Listing integrity across the catalog.",
      tabs: ["Overview"],
      render: () => <p>Panel content</p>,
    },
  },
  focusTargets: { retail: { x: 1160, y: 320 } },
});

export function AcmeCanvas() {
  return <IntelligenceCanvas spec={spec} />;
}`}
      </Code>
    </>
  );
}
