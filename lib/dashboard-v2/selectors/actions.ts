import { unavailable } from "../reading/build";
import type { Coverage, Reading, RegistryRow } from "../reading/types";
import type { ActionItemRow, SandboxBundle } from "../data/types";
import { registryRow } from "./common";

export const ACTION_ITEMS_OPEN_ID = "action_items_open";

export const DONE_STATUS = "done";

export type ActionCount = { key: string; count: number };

export type Actions = {
  /** Open actions counted from the action_item rows. */
  reading: Reading<number>;
  registry: RegistryRow | null;
  rows: ActionItemRow[];
  open: ActionItemRow[];
  byOwner: ActionCount[];
  byStatus: ActionCount[];
  /** Open actions by severity; a row with no severity counts under the key "not_set". */
  bySeverity: ActionCount[];
};

export const NO_SEVERITY_KEY = "not_set";

function countBy(rows: ActionItemRow[], pickKey: (row: ActionItemRow) => string): ActionCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(pickKey(row), (counts.get(pickKey(row)) ?? 0) + 1);
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** The registry id an action row points at, or null. */
export function actionRegistryId(bundle: SandboxBundle, row: ActionItemRow): string | null {
  if (!row.registry_key) return null;
  const prefix = `${bundle.clientId}:`;
  return row.registry_key.startsWith(prefix) ? row.registry_key.slice(prefix.length) : row.registry_key;
}

export function selectActions(bundle: SandboxBundle): Actions {
  const registry = registryRow(bundle, ACTION_ITEMS_OPEN_ID);
  if (bundle.actions.error) {
    return {
      reading: unavailable(`The action items could not be read: ${bundle.actions.error}`, ACTION_ITEMS_OPEN_ID),
      registry,
      rows: [],
      open: [],
      byOwner: [],
      byStatus: [],
      bySeverity: [],
    };
  }
  const rows = bundle.actions.rows;
  const open = rows.filter((r) => r.status !== DONE_STATUS);
  const asOf = rows.map((r) => r.updated_at).sort().at(-1) ?? bundle.actions.asOf;
  const coverage: Coverage = { read: rows.length, population: rows.length, asOf, runId: null, source: "action_item" };
  return {
    reading: { status: "complete", value: open.length, coverage, registryId: ACTION_ITEMS_OPEN_ID },
    registry,
    rows,
    open,
    byOwner: countBy(open, (r) => r.owner),
    byStatus: countBy(rows, (r) => r.status),
    bySeverity: countBy(open, (r) => r.severity ?? NO_SEVERITY_KEY),
  };
}
