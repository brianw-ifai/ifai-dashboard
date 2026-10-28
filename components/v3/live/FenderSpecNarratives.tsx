"use client";

import { specPageCounts } from "@/lib/fender-canvas/machine-readability";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import { formatInt, formatPct, formatRatio } from "@/lib/fender-canvas/format";

export type MissingPageControl = {
  active: boolean;
  onToggle: () => void;
};

/** One pill in the result cell. It states the live reading and what a click does. */
function MissingPageTogglePill({
  control,
  foundResult,
}: {
  control: MissingPageControl;
  foundResult: string;
}) {
  const action = control.active ? "Hide" : "Show";
  const explanation = control.active
    ? "Hide this filter and show every row again."
    : "Show only the checked SKUs with no stored fender.com page.";
  return (
    <button
      type="button"
      className={`spec-found-pill${control.active ? " active" : ""}`}
      aria-pressed={control.active}
      aria-controls="spec-readiness-by-asin"
      aria-label={`fender.com page found ${foundResult}. ${explanation}`}
      data-spec-filter="missing-fender-page"
      onClick={control.onToggle}
    >
      <span className="spec-found-pill-reading">{foundResult}</span>
      <span className="spec-found-pill-action">{action}</span>
    </button>
  );
}

export function FenderSpecSummary({
  bundle,
  missingPageControl,
}: {
  bundle: CanvasBundle;
  missingPageControl?: MissingPageControl;
}) {
  const { m } = bundle;
  const schemaPages = specPageCounts(bundle.specPages);
  const foundResult = `${formatPct(m.spec_fender_found_pct)} (${formatRatio(m.spec_fender_found, m.spec_checked)})`;
  return (
    <div className="content-box spec-summary">
      <table className="table-sm">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SKUs checked</td>
            <td>{formatInt(m.spec_checked)}</td>
          </tr>
          <tr>
            <td>fender.com page found</td>
            <td>
              {missingPageControl ? (
                <MissingPageTogglePill
                  control={missingPageControl}
                  foundResult={foundResult}
                />
              ) : (
                foundResult
              )}
            </td>
          </tr>
          <tr>
            <td>Amazon attribute completeness</td>
            <td>{formatPct(m.spec_avg_amazon_pct)}</td>
          </tr>
          <tr>
            <td>fender.com pages with no spec block</td>
            <td>
              {schemaPages
                ? formatRatio(schemaPages.missingSpecBlock, schemaPages.pages)
                : "Not available*"}
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        Official-page outcomes for each listing are on Findability. Page-level product data is on
        Machine Readability.
      </p>
    </div>
  );
}

export function AplusExplanation() {
  return (
    <div className="ceo-callout">
      <div className="ceo-callout-header">
        <span>What is Amazon A+ content, and why does it win AI queries?</span>
      </div>
      <div className="ceo-callout-body">
        Comparison tables have not been measured. A+ Content is the enhanced modules on a product
        page: graphics, diagrams, and comparison charts. When a comparison table is on the page,
        Amazon&apos;s shopping assistant and other AI models can read the columns and repeat how
        your lineup steps up.
      </div>
    </div>
  );
}
