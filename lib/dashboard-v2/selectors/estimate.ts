import { unavailable } from "../reading/build";
import type { Coverage, Reading, RegistryRow } from "../reading/types";
import type { EstimateInputRow, EstimateRow, SandboxBundle } from "../data/types";
import { registryKey, registryRow } from "./common";

export const ESTIMATE_PHASE1_ID = "estimate_phase1_uplift";
export const ESTIMATE_ENTERPRISE_ID = "estimate_enterprise_range";
export const ESTIMATE_IDS = [ESTIMATE_PHASE1_ID, ESTIMATE_ENTERPRISE_ID] as const;

export type EstimateLine = {
  key: string;
  value: number;
  unit: string;
  source: string;
  asOf: string;
  owner: string;
  confidence: string;
};

export type Estimate = {
  registryId: string;
  registry: RegistryRow | null;
  estimate: EstimateRow | null;
  /** The computed sum in the estimate's unit, or unavailable when any named input is missing. */
  reading: Reading<number>;
  /** Input names the formula asks for, in formula order. */
  inputKeys: string[];
  /** Stored inputs that feed the formula. */
  lines: EstimateLine[];
  /** Named inputs with no stored row. */
  missing: string[];
};

/** Input names in a formula: identifiers with an underscore, such as buybox_recapture. */
export function formulaInputKeys(formula: string): string[] {
  const keys = formula.match(/[a-z][a-z0-9]*(?:_[a-z0-9]+)+/g) ?? [];
  return [...new Set(keys)];
}

function toLine(row: EstimateInputRow): EstimateLine {
  return {
    key: row.input_key,
    value: row.value,
    unit: row.unit,
    source: row.source,
    asOf: row.as_of,
    owner: row.owner,
    confidence: row.confidence,
  };
}

/**
 * Computes the estimate from its stored inputs. Unavailable when the estimate row is missing,
 * when any input named in the formula has no stored row, or when the formula names no inputs and
 * none are stored. When every input exists, the value is their sum and the lines are returned.
 */
export function selectEstimate(bundle: SandboxBundle, registryId: string): Estimate {
  const registry = registryRow(bundle, registryId);
  const none = (reason: string, estimate: EstimateRow | null = null, inputKeys: string[] = [], missing: string[] = [], lines: EstimateLine[] = []): Estimate => ({
    registryId,
    registry,
    estimate,
    reading: unavailable(reason, registryId),
    inputKeys,
    lines,
    missing,
  });

  if (bundle.estimates.error) return none(`The estimates could not be read: ${bundle.estimates.error}`);
  const estimate = bundle.estimates.rows.find((e) => e.registry_key === registryKey(bundle, registryId)) ?? null;
  if (!estimate) return none(registry?.notes || `No estimate row is stored for ${registryId}.`);
  if (bundle.estimateInputs.error) return none(`The estimate inputs could not be read: ${bundle.estimateInputs.error}`, estimate);

  const inputKeys = formulaInputKeys(estimate.formula);
  const stored = bundle.estimateInputs.rows.filter((i) => i.estimate_id === estimate.estimate_id);
  const byKey = new Map(stored.map((i) => [i.input_key, i]));

  const lines: EstimateLine[] = inputKeys.length
    ? inputKeys.flatMap((key) => (byKey.has(key) ? [toLine(byKey.get(key) as EstimateInputRow)] : []))
    : stored.map(toLine);
  const missing = inputKeys.filter((key) => !byKey.has(key));

  if (missing.length > 0) {
    const reason = `No stored input for ${missing.join(", ")}. ${registry?.notes ?? ""}`.trim();
    return none(reason, estimate, inputKeys, missing, lines);
  }
  if (lines.length === 0) {
    return none(registry?.notes || "No inputs are stored for this estimate.", estimate, inputKeys, missing, lines);
  }

  const cents = lines.reduce((sum, line) => sum + Math.round(line.value * 100), 0);
  const asOf = lines.map((l) => l.asOf).sort()[0] ?? estimate.as_of;
  const coverage: Coverage = {
    read: lines.length,
    population: inputKeys.length || lines.length,
    asOf,
    runId: null,
    source: "estimate_input",
  };
  return {
    registryId,
    registry,
    estimate,
    reading: { status: "complete", value: cents / 100, coverage, registryId },
    inputKeys,
    lines,
    missing,
  };
}

export function selectEstimates(bundle: SandboxBundle): Estimate[] {
  return ESTIMATE_IDS.map((id) => selectEstimate(bundle, id));
}
