import type { EvidenceFocus } from "@/lib/ai-search/evidence-focus";
import { questionRole, type QuestionRole } from "@/lib/ai-search/question-role";
import { callOutcome, type CallOutcome } from "@/lib/ai-search/run-metrics";
import type { AiCallRow } from "@/lib/ai-search/types";

export type PromptScope = "commercial" | "probe" | "all";

export type AccuracyState = "confirmed" | "none" | "not_evaluated" | "unverified";

export const ACCURACY_LABELS: Record<AccuracyState, string> = {
  confirmed: "Contradiction found",
  none: "No contradiction found for this fact",
  not_evaluated: "No verified fact available",
  unverified: "Unverified flag",
};

export function accuracyState(row: AiCallRow): AccuracyState {
  switch (row.material_hallucination) {
    case "confirmed":
      return "confirmed";
    case "none":
      return "none";
    case "suspected":
    case "historical_unverified":
      return "unverified";
    default:
      return "not_evaluated";
  }
}

export type ExplorerFilter = {
  scope: PromptScope;
  engine: string;
  model: string;
  category: string;
  outcome: CallOutcome | "resolved" | "";
  accuracy: AccuracyState | "";
  brand: string;
  role: QuestionRole | "";
  simId: number | null;
};

export const DEFAULT_FILTER: ExplorerFilter = {
  scope: "commercial",
  engine: "",
  model: "",
  category: "",
  outcome: "",
  accuracy: "",
  brand: "",
  role: "",
  simId: null,
};

/** The explorer filter a drill-down link stands for. */
export function filterFromEvidence(focus: EvidenceFocus | null): ExplorerFilter {
  if (!focus) return DEFAULT_FILTER;
  const { field, value } = focus;
  switch (field) {
    case "sim": {
      const simId = Number.parseInt(value, 10);
      return Number.isFinite(simId) ? { ...DEFAULT_FILTER, scope: "all", simId } : DEFAULT_FILTER;
    }
    case "engine":
      return { ...DEFAULT_FILTER, engine: value.toLowerCase() };
    case "model":
      return { ...DEFAULT_FILTER, scope: "all", model: value };
    case "category":
      return { ...DEFAULT_FILTER, category: value };
    case "outcome":
      return {
        ...DEFAULT_FILTER,
        scope: value === "error" ? "all" : "commercial",
        outcome: value as ExplorerFilter["outcome"],
      };
    case "kind":
      return { ...DEFAULT_FILTER, scope: value === "probe" ? "probe" : value === "all" ? "all" : "commercial" };
    case "accuracy":
      return { ...DEFAULT_FILTER, scope: "all", accuracy: value as AccuracyState };
    case "competitor":
      return { ...DEFAULT_FILTER, outcome: "competitor_win", brand: value };
    case "role": {
      const [role, outcome = ""] = value.split("/");
      return {
        ...DEFAULT_FILTER,
        scope: "commercial",
        role: role as QuestionRole,
        outcome: outcome as ExplorerFilter["outcome"],
      };
    }
    default:
      return DEFAULT_FILTER;
  }
}

export function applyExplorerFilter(rows: AiCallRow[], filter: ExplorerFilter): AiCallRow[] {
  return rows.filter((row) => {
    if (filter.simId != null) return row.sim_id === filter.simId;
    if (filter.scope !== "all" && row.prompt_kind !== filter.scope) return false;
    if (filter.engine && (row.engine ?? "").toLowerCase() !== filter.engine) return false;
    if (filter.model && (row.model?.trim() || "") !== filter.model) return false;
    if (filter.category && row.category !== filter.category) return false;
    if (filter.outcome) {
      const outcome = callOutcome(row);
      const fender = outcome === "fender_win" || outcome === "fender_win_disqualified";
      const matches =
        filter.outcome === "fender_win"
          ? fender
          : filter.outcome === "resolved"
            ? fender || outcome === "competitor_win"
            : outcome === filter.outcome;
      if (!matches) return false;
    }
    if (filter.accuracy && accuracyState(row) !== filter.accuracy) return false;
    if (filter.brand && (row.primary_brand ?? "") !== filter.brand) return false;
    if (filter.role && questionRole(row) !== filter.role) return false;
    return true;
  });
}

export function sortExplorerRows(rows: AiCallRow[]): AiCallRow[] {
  return [...rows].sort(
    (a, b) =>
      (a.prompt_key ?? "").localeCompare(b.prompt_key ?? "") ||
      (a.engine ?? "").localeCompare(b.engine ?? "") ||
      a.sim_id - b.sim_id,
  );
}
