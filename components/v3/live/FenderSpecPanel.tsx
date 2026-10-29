"use client";

import { useEffect, useState } from "react";
import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useFullPopulationSort } from "@/components/v3/live/useFullPopulationSort";
import { specRowsQuery } from "@/lib/canvasData";
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
import { schemaPageHref } from "@/lib/fender-canvas/spec-table-sort";

const SPEC_COLUMNS = [
  clientColumn("asin", "ASIN", "text", 118, 100, "asin-col"),
  clientColumn("model", "Model", "text", 200, 120),
  clientColumn("amazon", "Amazon completeness", "number", 140, 110),
  clientColumn("found", "fender.com found", "text", 120, 100),
  clientColumn("missing", "Missing Amazon fields", "text", 240, 160),
];

/** First-visit viewport; page size stays 50. Shorter heroes leave more room for this table. */
const SPEC_TABLE_MAX_HEIGHT = 420;

/** Yes links when found and fender_url is http(s). No and blank stay plain text. */
function FenderFoundCell({
  found,
  url,
}: {
  found: boolean | null | undefined;
  url: string | null | undefined;
}) {
  const label = specFenderFoundLabel(found);
  if (label !== "Yes") return <>{label}</>;
  const href = schemaPageHref(url ?? null);
  if (!href) return <>Yes</>;
  return (
    <a className="listing-link" href={href} target="_blank" rel="noopener noreferrer">
      Yes
    </a>
  );
}

/** The list opens on the two heaviest fields. The title chevron reveals the rest. */
const MISSING_FIELD_PREVIEW = 2;

function FieldsChevron() {
  return (
    <svg
      className="retail-explore-chevron"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-hidden="true"
    >
      <path
        d="M2.2 4.2 6 8l3.8-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MissingFieldList({ missing }: { missing: CanvasSpecMissingRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const maxCount = missing.reduce((max, row) => Math.max(max, row.sku_count ?? 0), 0) || 1;
  const shown = showAll ? missing : missing.slice(0, MISSING_FIELD_PREVIEW);
  const rest = missing.length - MISSING_FIELD_PREVIEW;
  const collapsed = rest > 0 && !showAll;

  return (
    <div className="content-box spec-missing-fields-box" style={{ marginTop: 12 }}>
      <div className="content-box-title spec-missing-fields-title">
        <span>Top missing schema fields</span>
        {rest > 0 ? (
          <button
            type="button"
            className="retail-explore"
            aria-expanded={showAll}
            aria-controls="spec-missing-fields"
            aria-label={
              showAll
                ? "Show fewer missing schema fields"
                : `Show all ${formatInt(missing.length)} missing schema fields`
            }
            data-spec-missing-fields-toggle={showAll ? "all" : "preview"}
            onClick={() => setShowAll((value) => !value)}
          >
            <FieldsChevron />
          </button>
        ) : null}
      </div>
      <div
        id="spec-missing-fields"
        className={collapsed ? "spec-missing-fields-preview" : undefined}
      >
        {shown.map((row) => (
          <div key={`${row.source}-${row.field}`} className="spec-missing-field-row">
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
    </div>
  );
}

export function FenderSpecPanel({
  missing,
  catalogReadiness = false,
}: {
  missing: CanvasSpecMissingRow[];
  /** AI Readiness passes this. Machine Readability has its own page panel. */
  catalogReadiness?: boolean;
}) {
  if (!catalogReadiness) return null;
  return <CatalogSpecReadiness missing={missing} />;
}

function CatalogSpecReadiness({ missing }: { missing: CanvasSpecMissingRow[] }) {
  const [rows, setRows] = useState<CanvasSpecReadinessRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const population = useFullPopulationSort(
    rows,
    SPEC_COLUMNS,
    specReadinessSortValue,
    (row) => row.asin,
    CLIENT_TABLE_PAGE_SIZE,
  );

  useEffect(() => {
    let cancelled = false;
    void loadFilteredPages(async (page, size) => {
      const result = await specRowsQuery(page, size);
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
  }, []);

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
        <ResizableTable
          tableId="spec-readiness"
          columns={SPEC_COLUMNS}
          freezeHeader
          maxHeight={SPEC_TABLE_MAX_HEIGHT}
          fillColumnId="missing"
          wrapColumnIds={["model"]}
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
                  <td colSpan={5}>No spec rows in this read.</td>
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
                    <td>
                      <FenderFoundCell found={row.fender_found} url={row.fender_url} />
                    </td>
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
