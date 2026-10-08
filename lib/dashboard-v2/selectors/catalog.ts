import { unavailable } from "../reading/build";
import type { Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { coverageFromRun, metricReading, metricRows, missingReason, registryRow, runById, type MetricReading } from "./common";

export const CATALOG_MONITORED_ID = "catalog_monitored";
export const CATALOG_BY_CATEGORY_ID = "catalog_by_category";

export type CategoryCount = { category: string; reading: Reading<number> };

export type Catalog = {
  /** Every monitored listing. */
  monitored: MetricReading;
  /** Listings with an active Amazon offer. */
  active: MetricReading;
  /** Listings per retailer category, largest first. */
  byCategory: CategoryCount[];
};

export function selectCatalog(bundle: SandboxBundle): Catalog {
  const monitored = metricReading(bundle, CATALOG_MONITORED_ID);
  const active = metricReading(bundle, CATALOG_MONITORED_ID, { dimension: { name: "offer_status", value: "active" } });
  const registry = registryRow(bundle, CATALOG_BY_CATEGORY_ID);
  const rows = metricRows(bundle, CATALOG_BY_CATEGORY_ID).filter((r) => r.dimension_name === "category" && r.dimension_value);
  const byCategory: CategoryCount[] = rows
    .map((row) => {
      const run = runById(bundle, row.reading_run_id);
      const coverage = run
        ? coverageFromRun(run)
        : { read: row.numeric_value ?? 0, population: null, asOf: row.computed_at, runId: row.reading_run_id, source: registry?.source_tables ?? "listing" };
      const reading: Reading<number> =
        !registry || row.numeric_value === null
          ? unavailable(missingReason(bundle, CATALOG_BY_CATEGORY_ID, registry), CATALOG_BY_CATEGORY_ID, coverage)
          : { status: run?.status === "partial" ? "partial" : "complete", value: row.numeric_value, coverage, registryId: CATALOG_BY_CATEGORY_ID };
      return { category: row.dimension_value as string, reading };
    })
    .sort((a, b) => {
      const av = a.reading.status === "unavailable" ? -1 : a.reading.value;
      const bv = b.reading.status === "unavailable" ? -1 : b.reading.value;
      return bv - av || a.category.localeCompare(b.category);
    });
  return { monitored, active, byCategory };
}
