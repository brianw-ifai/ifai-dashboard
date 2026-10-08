import { unavailable } from "../reading/build";
import { formatInt } from "../reading/format";
import type { Coverage, Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import {
  codeLabel,
  compositeReading,
  coverageFromRun,
  metricReading,
  metricRows,
  missingReason,
  registryRow,
  runById,
  type MetricReading,
} from "./common";

export const SELLER_MIX_ID = "seller_mix";
export const SELLER_READ_COVERAGE_ID = "seller_read_coverage";

export type SellerClassCount = { sellerClass: string; label: string; reading: Reading<number> };

export type SellerMix = {
  /** One line with the count per seller class, including the unread count. */
  reading: Reading<string>;
  classes: SellerClassCount[];
  /** How much of the active catalog has a seller reading. */
  coverage: MetricReading;
};

export function selectSellerMix(bundle: SandboxBundle): SellerMix {
  const coverage = metricReading(bundle, SELLER_READ_COVERAGE_ID, { againstActive: true });
  const registry = registryRow(bundle, SELLER_MIX_ID);
  const rows = metricRows(bundle, SELLER_MIX_ID).filter((r) => r.dimension_name === "seller_class" && r.dimension_value);
  if (!registry || rows.length === 0) {
    return { reading: unavailable(missingReason(bundle, SELLER_MIX_ID, registry), SELLER_MIX_ID), classes: [], coverage };
  }

  // First pass: is any part of the seller read unfinished? The unread class counts as unfinished too.
  let cov: Coverage | null = null;
  let partial = false;
  const prepared = rows.map((row) => {
    const run = runById(bundle, row.reading_run_id);
    const c = run
      ? coverageFromRun(run)
      : { read: row.numeric_value ?? 0, population: null, asOf: row.computed_at, runId: row.reading_run_id, source: registry.source_tables };
    cov = cov ?? c;
    if (run?.status === "partial" || (c.population !== null && c.read < c.population)) partial = true;
    if (row.dimension_value === "not_read" && (row.numeric_value ?? 0) > 0) partial = true;
    return { row, coverage: c };
  });

  const classes: SellerClassCount[] = prepared.map(({ row, coverage: c }) => {
    const sellerClass = row.dimension_value as string;
    const reading: Reading<number> =
      row.numeric_value === null
        ? unavailable("The stored count is empty.", SELLER_MIX_ID, c)
        : { status: partial ? "partial" : "complete", value: row.numeric_value, coverage: c, registryId: SELLER_MIX_ID };
    return { sellerClass, label: codeLabel(sellerClass), reading };
  });

  const text = classes
    .map((c) => (c.reading.status === "unavailable" ? `${c.label} unavailable` : `${c.label} ${formatInt(c.reading.value)}`))
    .join(", ");
  return { reading: compositeReading(SELLER_MIX_ID, text, cov as NonNullable<typeof cov>, partial), classes, coverage };
}
