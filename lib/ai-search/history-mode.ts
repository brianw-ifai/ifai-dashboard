import { formatDay } from "@/lib/ai-search/history-eligibility";
import { citationMonthBounds } from "@/lib/ai-search/citation-aggregate";

export type HistoryMode =
  | { kind: "month" }
  | { kind: "run"; runId: string }
  | { kind: "legacy"; runId: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "all" };

export function historyControlLabel(
  mode: HistoryMode,
  currentDay: string | null,
  selectedDay: string | null,
): string {
  if (mode.kind === "month") {
    if (!currentDay) return "Last 30 days";
    const bounds = citationMonthBounds(currentDay);
    if (!bounds) return "Last 30 days";
    return `Last 30 days · ${formatDay(bounds.from)} to ${formatDay(bounds.to)}`;
  }
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
 * Panel introduction while history is open. Null keeps the published-run description.
 * The map is not given this string.
 */
export function historySpokeDescription(input: {
  mode: HistoryMode["kind"];
  source: "live" | "fixture";
  selectedPhase: "idle" | "loading" | "ready" | "unavailable" | "error";
  selectedMessage: string | null;
  runDescription: string | null;
}): string | null {
  if (input.mode === "month") {
    return "The open AI Search panel adds the stored review runs in that window. The map stays on the current published run.";
  }
  if (input.mode === "legacy") {
    return "Legacy test run. These calls stay out of the two rates and out of the trend.";
  }
  if (input.mode === "range" || input.mode === "all") {
    return input.source === "fixture"
      ? "Copy of the stored runs for review. The chart uses that copy, not a live read. Current returns to the live published run."
      : "Trends use the stored review runs. The map stays on the current published run.";
  }
  if (input.selectedPhase === "loading" || input.selectedPhase === "idle") return "Loading the selected run.";
  if (input.selectedPhase === "unavailable" || input.selectedPhase === "error") return input.selectedMessage;
  return input.runDescription ? `Historical run. ${input.runDescription}` : "Historical run.";
}
