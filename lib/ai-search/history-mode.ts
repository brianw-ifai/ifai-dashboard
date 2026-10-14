import { formatDay } from "@/lib/ai-search/history-eligibility";

export type HistoryMode =
  | { kind: "current" }
  | { kind: "run"; runId: string }
  | { kind: "legacy"; runId: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "all" };

export function historyControlLabel(
  mode: HistoryMode,
  currentDay: string | null,
  selectedDay: string | null,
): string {
  if (mode.kind === "current") return currentDay ? `Current run · ${formatDay(currentDay)}` : "Current run";
  if (mode.kind === "all") return "All time";
  if (mode.kind === "range") return `${formatDay(mode.from)} to ${formatDay(mode.to)}`;
  if (mode.kind === "legacy") return selectedDay ? `Legacy run · ${formatDay(selectedDay)}` : "Legacy run";
  return selectedDay ? `Historical run · ${formatDay(selectedDay)}` : "Historical run";
}

export function rangeFromMode(mode: HistoryMode): { from: string | null; to: string | null } {
  if (mode.kind === "range") return { from: mode.from, to: mode.to };
  return { from: null, to: null };
}

/**
 * Panel introduction while history is open. Null keeps the current-run description.
 * The map is not given this string.
 */
export function historySpokeDescription(input: {
  mode: HistoryMode["kind"];
  source: "live" | "fixture";
  selectedPhase: "idle" | "loading" | "ready" | "unavailable" | "error";
  selectedMessage: string | null;
  runDescription: string | null;
}): string | null {
  if (input.mode === "current") return null;
  if (input.mode === "legacy") {
    return "Legacy test run. These calls stay out of the two rates and out of the trend.";
  }
  if (input.mode === "range" || input.mode === "all") {
    return input.source === "fixture"
      ? "Sample history for review. The chart uses fixture runs, not the live published run."
      : "Trends use trustworthy published runs only. The map stays on the current published run.";
  }
  if (input.selectedPhase === "loading" || input.selectedPhase === "idle") return "Loading the selected published run.";
  if (input.selectedPhase === "unavailable" || input.selectedPhase === "error") return input.selectedMessage;
  return input.runDescription ? `Historical run. ${input.runDescription}` : "Historical run.";
}
