import { unavailable } from "../reading/build";
import type { Coverage, Reading, RegistryRow } from "../reading/types";
import type { ReadingRunRow, SandboxBundle } from "../data/types";
import { coverageFromRun, registryRow } from "./common";

export const READING_FRESHNESS_ID = "reading_freshness";

export type FreshnessSource = {
  workflowName: string;
  source: string;
  asOf: string | null;
  status: string;
  read: number;
  population: number;
  runId: string;
  aiRunCount: number | null;
};

export type Freshness = {
  /** The oldest as-of among the sources the hub shows, as an ISO string (unit timestamp). */
  reading: Reading<string>;
  registry: RegistryRow | null;
  /** One entry per workflow_name from reading_run, oldest first. */
  sources: FreshnessSource[];
  oldest: FreshnessSource | null;
  newest: FreshnessSource | null;
};

function latestPerWorkflow(runs: ReadingRunRow[]): ReadingRunRow[] {
  const latest = new Map<string, ReadingRunRow>();
  for (const run of runs) {
    const key = run.workflow_name ?? run.source;
    const current = latest.get(key);
    const asOf = run.finished_at ?? run.started_at;
    const currentAsOf = current ? (current.finished_at ?? current.started_at) : null;
    if (!current || (currentAsOf !== null && asOf > currentAsOf)) latest.set(key, run);
  }
  return [...latest.values()];
}

/** One as-of per workflow_name from reading_run. The header shows the oldest, not the newest. */
export function selectFreshness(bundle: SandboxBundle): Freshness {
  const registry = registryRow(bundle, READING_FRESHNESS_ID);
  if (bundle.runs.error) {
    return {
      reading: unavailable(`The reading runs could not be read: ${bundle.runs.error}`, READING_FRESHNESS_ID),
      registry,
      sources: [],
      oldest: null,
      newest: null,
    };
  }
  const aiRunCount = bundle.aiBattery.error ? null : (bundle.aiBattery.rows[0]?.runCount ?? null);
  const sources: FreshnessSource[] = latestPerWorkflow(bundle.runs.rows)
    .map((run) => ({
      workflowName: run.workflow_name ?? run.source,
      source: run.source,
      asOf: run.finished_at ?? run.started_at,
      status: run.status,
      read: run.rows_read,
      population: run.population_count,
      runId: run.reading_run_id,
      aiRunCount: run.source === "ai_battery" ? aiRunCount : null,
    }))
    .sort((a, b) => (a.asOf ?? "").localeCompare(b.asOf ?? ""));
  if (sources.length === 0) {
    return { reading: unavailable("No reading run is stored.", READING_FRESHNESS_ID), registry, sources, oldest: null, newest: null };
  }
  const oldest = sources[0];
  const newest = sources[sources.length - 1];
  const oldestRun = bundle.runs.rows.find((r) => r.reading_run_id === oldest.runId) as ReadingRunRow;
  const coverage: Coverage = { ...coverageFromRun(oldestRun), source: oldest.workflowName };
  return {
    reading: { status: "complete", value: oldest.asOf ?? "", coverage, registryId: READING_FRESHNESS_ID },
    registry,
    sources,
    oldest,
    newest,
  };
}
