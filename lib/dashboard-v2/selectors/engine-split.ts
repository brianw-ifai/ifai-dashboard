import { rate, unavailable } from "../reading/build";
import { formatRate } from "../reading/format";
import type { Rate, Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { AI_ANSWER_SHARE_ID } from "./ai-answer-share";
import { codeLabel, compositeReading, coverageFromRun, metricRows, missingReason, registryRow, runById } from "./common";

export const ENGINE_SPLIT_ID = "ai_answer_share_by_engine";

export type EngineShare = { engine: string; label: string; reading: Reading<Rate> };

export type EngineSplit = {
  /** One line naming every engine's share. Partial when engine coverage is below the answer count. */
  reading: Reading<string>;
  engines: EngineShare[];
};

export function selectEngineSplit(bundle: SandboxBundle): EngineSplit {
  const registry = registryRow(bundle, ENGINE_SPLIT_ID);
  const rows = metricRows(bundle, ENGINE_SPLIT_ID).filter((r) => r.dimension_name === "engine" && r.dimension_value);
  if (!registry || rows.length === 0) {
    return { reading: unavailable(missingReason(bundle, ENGINE_SPLIT_ID, registry), ENGINE_SPLIT_ID), engines: [] };
  }

  const engines: EngineShare[] = [];
  let covered = 0;
  let coverage = null;
  for (const row of rows.sort((a, b) => (a.dimension_value ?? "").localeCompare(b.dimension_value ?? ""))) {
    const run = runById(bundle, row.reading_run_id);
    const cov = run
      ? coverageFromRun(run)
      : { read: row.denominator ?? 0, population: null, asOf: row.computed_at, runId: row.reading_run_id, source: registry.source_tables };
    coverage = coverage ?? cov;
    covered += row.denominator ?? 0;
    engines.push({
      engine: row.dimension_value as string,
      label: codeLabel(row.dimension_value as string),
      reading: rate(row.numerator, row.denominator, { registryId: ENGINE_SPLIT_ID, coverage: cov }),
    });
  }

  // Engine coverage below the resolved answer count means some answers carry no engine.
  const overall = metricRows(bundle, AI_ANSWER_SHARE_ID).find((r) => r.dimension_name === null);
  const answerCount = overall?.denominator ?? null;
  const belowAnswers = answerCount !== null && covered < answerCount;
  const anyPartial = engines.some((e) => e.reading.status === "partial");

  const text = engines
    .map((e) => (e.reading.status === "unavailable" ? `${e.label} unavailable` : `${e.label} ${formatRate(e.reading.value)}`))
    .join("; ");

  return {
    reading: compositeReading(ENGINE_SPLIT_ID, text, coverage as NonNullable<typeof coverage>, belowAnswers || anyPartial),
    engines,
  };
}
