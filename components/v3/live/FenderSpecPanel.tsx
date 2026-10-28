"use client";

import { useEffect, useState } from "react";
import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useFullPopulationSort } from "@/components/v3/live/useFullPopulationSort";
import { specRowsFilter, specRowsQuery } from "@/lib/canvasData";
import { CLIENT_TABLE_PAGE_SIZE, loadFilteredPages } from "@/lib/fender-canvas/full-result-sort";
import { specReadinessSortValue } from "@/lib/fender-canvas/spec-table-sort";
import {
  specFenderFoundLabel,
  specModelTitle,
  type CanvasSpecMissingRow,
  type CanvasSpecReadinessRow,
} from "@/lib/fender-canvas/types";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import { presentMissingAmazonFields } from "@/lib/fender-canvas/spec-missing-fields";

const SPEC_COLUMNS = [
  clientColumn("asin", "ASIN", "text", 130, 108, "asin-col"),
  clientColumn("model", "Model", "text", 220, 140),
  clientColumn("amazon", "Amazon completeness", "number", 170, 130),
  clientColumn("found", "fender.com found", "text", 150, 120),
  clientColumn("missing", "Missing Amazon fields", "text", 280, 180),
];

const MISSING_PAGE_DESC =
  "This check did not resolve a fender.com address. It is not proof the product is absent from fender.com.";

/** The list opens on the two heaviest fields. The control reveals the rest. */
const MISSING_FIELD_PREVIEW = 2;

function MissingFieldList({ missing }: { missing: CanvasSpecMissingRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const maxCount = missing.reduce((max, row) => Math.max(max, row.sku_count ?? 0), 0) || 1;
  const shown = showAll ? missing : missing.slice(0, MISSING_FIELD_PREVIEW);
  const rest = missing.length - MISSING_FIELD_PREVIEW;

  return (
    <div className="content-box" style={{ marginTop: 12 }}>
      <div className="content-box-title">Top missing schema fields</div>
      <div id="spec-missing-fields">
        {shown.map((row) => (
          <div key={`${row.source}-${row.field}`} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>
                {row.field} ({row.source ?? "n/a"})
              </span>
              <span>{formatInt(row.sku_count)} SKUs</span>
            </div>
            <div className="readiness-progress-bar">
              <div
                className="readiness-progress-fill"
                style={{ width: `${((row.sku_count ?? 0) / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {rest > 0 ? (
        <button
          type="button"
          className="segmented-btn"
          aria-expanded={showAll}
          aria-controls="spec-missing-fields"
          data-spec-missing-fields-toggle={showAll ? "all" : "preview"}
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? "Show fewer fields" : `Show all ${formatInt(missing.length)} fields`}
        </button>
      ) : null}
    </div>
  );
}

export function FenderSpecPanel({
  missing,
  catalogReadiness = false,
  missingPagesOnly = false,
}: {
  missing: CanvasSpecMissingRow[];
  /** AI Readiness passes this. Machine Readability has its own page panel. */
  catalogReadiness?: boolean;
  missingPagesOnly?: boolean;
}) {
  if (!catalogReadiness) return null;
  return <CatalogSpecReadiness missing={missing} missingPagesOnly={missingPagesOnly} />;
}

function CatalogSpecReadiness({
  missing,
  missingPagesOnly,
}: {
  missing: CanvasSpecMissingRow[];
  missingPagesOnly: boolean;
}) {
  const queryMissingPages =
    specRowsFilter(true, missingPagesOnly)?.missingFenderPage === true;
  const [rows, setRows] = useState<CanvasSpecReadinessRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [seenFilter, setSeenFilter] = useState(queryMissingPages);
  const population = useFullPopulationSort(
    rows,
    SPEC_COLUMNS,
    specReadinessSortValue,
    (row) => row.asin,
    CLIENT_TABLE_PAGE_SIZE,
  );

  if (seenFilter !== queryMissingPages) {
    setSeenFilter(queryMissingPages);
    population.resetPage();
    setRows([]);
    setTotal(null);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    void loadFilteredPages(async (page, size) => {
      const result = await specRowsQuery(
        page,
        size,
        queryMissingPages ? { missingFenderPage: true } : undefined,
      );
      return {
        data: (result.data ?? []) as CanvasSpecReadinessRow[],
        error: result.error,
        count: result.count,
      };
    }).then(
      (result) => {
        if (cancelled) return;
        if (result.error) {
          setRows([]);
          setTotal(null);
          setLoading(false);
          return;
        }
        setRows(result.rows);
        setTotal(result.total);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [queryMissingPages]);

  return (
    <>
      <MissingFieldList missing={missing} />

      <div className="content-box" style={{ marginTop: 12 }} id="spec-readiness-by-asin">
        <div className="content-box-title">
          <span>Spec readiness by ASIN</span>
          {total != null ? (
            <span className="tag-badge tag-neutral">{formatInt(total)} rows</span>
          ) : null}
        </div>
        {queryMissingPages ? (
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0" }}>
            A{" "}
            <span
              className="ifai-term"
              data-ifai-tooltip-title="missing page"
              data-ifai-tooltip-desc={MISSING_PAGE_DESC}
              tabIndex={0}
              aria-label={`missing page: ${MISSING_PAGE_DESC}`}
            >
              missing page
            </span>{" "}
            means this check did not resolve a fender.com address. It is not proof the product is
            absent from fender.com.
          </p>
        ) : null}
        <ResizableTable
          tableId="spec-readiness"
          columns={SPEC_COLUMNS}
          freezeHeader
          maxHeight={520}
          fillColumnId="missing"
          sort={population.sort}
          onSort={population.onSort}
        >
          <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>Loading…</td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {queryMissingPages
                      ? "No checked SKUs in this read are missing a stored fender.com page."
                      : "No spec rows in this read."}
                  </td>
                </tr>
              ) : null}
              {population.pageRows.map((row) => {
                const missing = presentMissingAmazonFields(
                  row.amazon_missing_fields,
                  row.amazon_completeness_pct,
                );
                return (
                  <tr key={row.asin}>
                    <td>
                      <span className="asin-chip">{row.asin}</span>
                    </td>
                    <td>{specModelTitle(row.title)}</td>
                    <td>{formatPct(row.amazon_completeness_pct)}</td>
                    <td>{specFenderFoundLabel(row.fender_found)}</td>
                    <td>
                      {missing.kind === "fields"
                        ? missing.fields.map((field) => (
                            <span key={field} className="tag-badge tag-neutral spec-field-pill">
                              {field}
                            </span>
                          ))
                        : missing.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
        </ResizableTable>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="segmented-btn"
            disabled={population.page <= 0}
            onClick={() => population.setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: 11 }}>
            {population.page + 1} / {population.pages}
          </span>
          <button
            type="button"
            className="segmented-btn"
            disabled={population.page + 1 >= population.pages}
            onClick={() => population.setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
