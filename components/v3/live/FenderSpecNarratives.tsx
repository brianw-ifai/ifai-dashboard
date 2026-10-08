"use client";

import type { CanvasBundle } from "@/lib/fender-canvas/types";
import { formatInt, formatPct, formatRatio } from "@/lib/fender-canvas/format";

export type MissingPageControl = {
  active: boolean;
  onToggle: () => void;
  onClear: () => void;
};

export function FenderSpecSummary({
  bundle,
  missingPageControl,
}: {
  bundle: CanvasBundle;
  missingPageControl?: MissingPageControl;
}) {
  const { m } = bundle;
  const foundResult = `${formatPct(m.spec_fender_found_pct)} (${formatRatio(m.spec_fender_found, m.spec_checked)})`;
  return (
    <div className="content-box">
      <div className="content-box-title">Spec read</div>
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
                <span className="segmented-control" style={{ flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`segmented-btn${missingPageControl.active ? " active" : ""}`}
                    style={{ whiteSpace: "nowrap" }}
                    aria-pressed={missingPageControl.active}
                    aria-controls="spec-readiness-by-asin"
                    data-spec-filter="missing-fender-page"
                    onClick={missingPageControl.onToggle}
                  >
                    {foundResult}
                  </button>
                  {missingPageControl.active ? (
                    <button
                      type="button"
                      className="segmented-btn"
                      data-spec-filter="clear"
                      onClick={missingPageControl.onClear}
                    >
                      Clear
                    </button>
                  ) : null}
                </span>
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
            <td>fender.com completeness when a page is found</td>
            <td>{formatPct(m.spec_avg_fender_pct)}</td>
          </tr>
          <tr>
            <td>Found pages missing additionalProperty</td>
            <td>{formatInt(m.spec_missing_additional_property)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
        The rows under this summary are the missing-field and per-ASIN reads. Amazon attribute
        completeness is the average stored on the catalog spec read.
      </p>
    </div>
  );
}

export function SchemaExplanation() {
  return (
    <div className="ceo-callout">
      <div className="ceo-callout-header">
        <span>What is Schema.org, and why does AI need it?</span>
      </div>
      <div className="ceo-callout-body">
        When people visit fender.com, they read marketing copy. AI crawlers need a machine-readable
        block, Schema.org JSON-LD, to take a spec as a fact. additionalProperty is the part of that
        block that can carry neck, pickup, and hardware specs. The rows below are the missing fields
        in the latest spec read.
      </div>
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
