"use client";

import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useFullPopulationSort } from "@/components/v3/live/useFullPopulationSort";
import {
  attemptLabel,
  bucketLabel,
  confidenceLabel,
  countFlagLine,
  dealerBundleLabel,
  findabilitySortValue,
  httpStatusLabel,
  listingTitle,
  presentExplanation,
  productKindLabel,
  sourceMethodLabel,
} from "@/lib/findability/copy";
import { CLIENT_TABLE_PAGE_SIZE } from "@/lib/fender-canvas/full-result-sort";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  findabilityOutcome,
  presentOfficialAddress,
  type FindabilityRow,
} from "@/lib/findability/outcomes";

const COLUMNS = [
  clientColumn("asin", "ASIN", "text", 124, 108, "asin-col"),
  clientColumn("title", "Listing", "text", 280, 180),
  clientColumn("outcome", "Outcome", "text", 200, 150),
  clientColumn("category", "Category", "text", 150, 110),
  clientColumn("kind", "Product kind", "text", 130, 110),
  clientColumn("page", "Official page", "text", 240, 160),
  clientColumn("sku", "Variant SKU", "text", 140, 110),
  clientColumn("confidence", "Confidence", "text", 150, 120),
  clientColumn("source", "How it was matched", "text", 170, 130),
  clientColumn("http", "HTTP status", "number", 110, 90),
  clientColumn("checked", "Checked", "date", 180, 140),
  clientColumn("explanation", "Explanation", "text", 320, 200),
  clientColumn("flags", "How it is counted", "text", 260, 180),
  clientColumn("bundle", "Dealer bundle", "text", 150, 120),
];

function OfficialPageCell({ row }: { row: FindabilityRow }) {
  const address = presentOfficialAddress(row);
  if (address.kind === "link") {
    return (
      <span className="listing-title-scroll">
        <a
          href={address.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          referrerPolicy="no-referrer"
          data-findability-official-url={address.href}
        >
          {address.href}
        </a>
      </span>
    );
  }
  return <span data-findability-address={address.kind}>{address.text}</span>;
}

export function FindabilityTable({ rows }: { rows: readonly FindabilityRow[] }) {
  const population = useFullPopulationSort(
    rows,
    COLUMNS,
    findabilitySortValue,
    (row) => row.asin,
    CLIENT_TABLE_PAGE_SIZE,
  );
  const shownFrom = rows.length === 0 ? 0 : population.page * CLIENT_TABLE_PAGE_SIZE + 1;
  const shownTo = Math.min(rows.length, (population.page + 1) * CLIENT_TABLE_PAGE_SIZE);

  return (
    <div id="findability-listings">
      <ResizableTable
        tableId="findability-listings"
        columns={COLUMNS}
        freezeHeader
        maxHeight={520}
        fillColumnId="title"
        sort={population.sort}
        onSort={population.onSort}
      >
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length}>No listings in this outcome.</td>
            </tr>
          ) : (
            population.pageRows.map((row) => {
              const bucket = findabilityOutcome(row);
              return (
                <tr key={row.asin} data-findability-asin={row.asin} data-findability-row={bucket}>
                  <td className="asin-col">
                    <span className="asin-chip">{row.asin}</span>
                  </td>
                  <td>
                    <span className="listing-title-scroll">{listingTitle(row)}</span>
                  </td>
                  <td>{bucketLabel(bucket)}</td>
                  <td>{row.category?.trim() || "Not recorded"}</td>
                  <td>{productKindLabel(row.product_kind)}</td>
                  <td>
                    <OfficialPageCell row={row} />
                  </td>
                  <td>{row.latest_variant_sku?.trim() || "Not recorded"}</td>
                  <td>{confidenceLabel(row.confidence)}</td>
                  <td>{sourceMethodLabel(row.source_method)}</td>
                  <td>{httpStatusLabel(row.http_status, bucket)}</td>
                  <td>{attemptLabel(row.latest_attempt_at, bucket)}</td>
                  <td>{presentExplanation(row)}</td>
                  <td>{countFlagLine(row)}</td>
                  <td>{dealerBundleLabel(row.dealer_bundle)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </ResizableTable>
      {rows.length > CLIENT_TABLE_PAGE_SIZE ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <button
            type="button"
            className="segmented-btn"
            disabled={population.page <= 0}
            onClick={() => population.setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: 13 }}>
            {formatInt(shownFrom)}–{formatInt(shownTo)} of {formatInt(rows.length)}
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
      ) : null}
    </div>
  );
}
