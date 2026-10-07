import { Code } from "@/components/sdk/docs/DocsUi";
import Link from "next/link";

export function GuidesContent() {
  return (
    <>
      <p className="sdk-docs-eyebrow">Guides</p>
      <h1 id="apply-brand">Apply the canvas to another brand</h1>
      <p className="sdk-docs-lede">
        /v3 is the Fender consumer: <code>fenderCanvasSpec</code> passed into the same{" "}
        <code>IntelligenceCanvas</code>. A new brand is a new spec — not a fork of the interaction
        layer.
      </p>

      <div className="sdk-docs-split">
        <div>
          <p>
            Keep positions, status colors, tickers, filters, search matchers, tour copy, and spoke
            panels in the spec. HTML strings still work for legacy drilldowns; new canvases should
            return React nodes.
          </p>
          <ul className="sdk-docs-ul">
            <li>
              Live example: <a href="/dashboard">Fender canvas</a>
            </li>
            <li>
              SDK map: <Link href="/sdk">Canvas view</Link>
            </li>
            <li>
              Continue to the{" "}
              <Link href="/sdk/docs/api">API reference</Link> for field-level contracts.
            </li>
          </ul>
        </div>
        <Code label="fender.tsx">
          {`import { IntelligenceCanvas } from "@/lib/canvas-sdk";
import { fenderCanvasSpec } from "@/components/v3/fender-canvas-spec";

export function FenderBrandCanvas() {
  return <IntelligenceCanvas spec={fenderCanvasSpec} />;
}`}
        </Code>
      </div>

      <h2 id="custom-viewport">Custom viewport</h2>
      <p>
        When the visualization is not an SVG graph — a product grid, map, or table — use{" "}
        <code>CanvasShell</code> and pass your component as the child. You still get header, HUD,
        drilldown, tour, and camera helpers.
      </p>
      <Code label="shell-child.tsx">
        {`import { CanvasShell } from "@/lib/canvas-sdk";

<CanvasShell spec={chromeAndSpokesSpec}>
  {(ctx) => (
    <ProductGrid
      onOpen={(sku) => ctx.focusNode("retail", sku)}
      transform={ctx.transform}
    />
  )}
</CanvasShell>`}
      </Code>
    </>
  );
}
