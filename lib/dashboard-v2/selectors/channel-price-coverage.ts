import { rate, unavailable } from "../reading/build";
import { formatInt } from "../reading/format";
import type { Rate, Reading } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { codeLabel, compositeReading, coverageFromRun, metricRows, missingReason, registryRow, runById } from "./common";

export const CHANNEL_PRICE_COVERAGE_ID = "channel_price_coverage";

/** The amazon channel row is the offer itself, not an outside price, so it is not a channel here. */
export const OWN_CHANNEL = "amazon";

export type ChannelCoverage = { channel: string; label: string; reading: Reading<Rate> };

export type ChannelPriceCoverage = {
  /** One line per outside channel with priced of checked. Channels with zero priced are omitted. */
  reading: Reading<string>;
  channels: ChannelCoverage[];
};

export function selectChannelPriceCoverage(bundle: SandboxBundle): ChannelPriceCoverage {
  const registry = registryRow(bundle, CHANNEL_PRICE_COVERAGE_ID);
  const rows = metricRows(bundle, CHANNEL_PRICE_COVERAGE_ID).filter(
    (r) => r.dimension_name === "channel" && r.dimension_value && r.dimension_value !== OWN_CHANNEL,
  );
  if (!registry || rows.length === 0) {
    return { reading: unavailable(missingReason(bundle, CHANNEL_PRICE_COVERAGE_ID, registry), CHANNEL_PRICE_COVERAGE_ID), channels: [] };
  }

  const channels: ChannelCoverage[] = [];
  let partial = false;
  let oldest = null as ReturnType<typeof coverageFromRun> | null;
  for (const row of rows) {
    if (!row.numerator) continue; // zero stored prices: the channel is omitted
    const run = runById(bundle, row.reading_run_id);
    const coverage = run
      ? coverageFromRun(run)
      : { read: row.denominator ?? 0, population: null, asOf: row.computed_at, runId: row.reading_run_id, source: registry.source_tables };
    if (run?.status === "partial") partial = true;
    const reading = rate(row.numerator, row.denominator, { registryId: CHANNEL_PRICE_COVERAGE_ID, coverage });
    if (reading.status === "partial") partial = true;
    if (!oldest || (coverage.asOf && oldest.asOf && coverage.asOf < oldest.asOf)) oldest = coverage;
    channels.push({ channel: row.dimension_value as string, label: codeLabel(row.dimension_value as string), reading });
  }
  if (channels.length === 0) {
    return { reading: unavailable("No outside channel has a stored price yet.", CHANNEL_PRICE_COVERAGE_ID), channels };
  }

  const text = channels
    .map((c) =>
      c.reading.status === "unavailable"
        ? `${c.label} unavailable`
        : `${c.label} ${formatInt(c.reading.value.numerator)} priced of ${formatInt(c.reading.value.denominator)} checked`,
    )
    .join("; ");
  return { reading: compositeReading(CHANNEL_PRICE_COVERAGE_ID, text, oldest as NonNullable<typeof oldest>, partial), channels };
}
