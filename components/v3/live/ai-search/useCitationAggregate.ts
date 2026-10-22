"use client";

import { useEffect, useMemo, useState } from "react";
import { useAiHistoryOptional } from "@/components/v3/live/ai-search/AiHistoryContext";
import { useAiSearch } from "@/components/v3/live/ai-search/AiSearchContext";
import {
  citationAggregateCopy,
  citationMonthBounds,
  citationSnapshotUsable,
  poolCitationSnapshots,
  runsInCitationWindow,
  type CitationWindow,
} from "@/lib/ai-search/citation-aggregate";
import { utcDay } from "@/lib/ai-search/history-eligibility";
import { historyFixtureSnapshot } from "@/lib/ai-search/history-fixtures";
import { loadHistorySnapshot } from "@/lib/ai-search/history-queries";
import type { AiSearchSnapshot } from "@/lib/ai-search/types";
import { getCanvasSupabase } from "@/lib/supabase/canvas-client";

export type CitationAggregate =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "empty"; message: string }
  | { phase: "ready"; snapshot: AiSearchSnapshot; copy: string; singleRun: boolean };

function finish(
  window: CitationWindow,
  snapshots: AiSearchSnapshot[],
  singleRun: boolean,
): CitationAggregate {
  const included = snapshots.filter(citationSnapshotUsable);
  const omitted = snapshots.length - included.length;
  const snapshot = poolCitationSnapshots(included);
  if (!snapshot) {
    return {
      phase: "empty",
      message:
        omitted > 0
          ? "No run in this selection stored a citation list, so no citation figure is shown."
          : "No stored review runs fall in this selection.",
    };
  }
  return {
    phase: "ready",
    snapshot,
    singleRun,
    copy: singleRun ? "This run only." : citationAggregateCopy({ window, included, omitted }),
  };
}

export function useCitationAggregate(): CitationAggregate {
  const history = useAiHistoryOptional();
  const read = useAiSearch();
  const mode = history?.mode;
  const source = history?.source ?? "live";
  const catalog = history?.catalog;
  const trend = history?.trend;
  const currentDay = read.phase === "ready" ? utcDay(read.snapshot.run.published_at ?? read.snapshot.run.completed_at) : null;

  const window = useMemo<CitationWindow | null>(() => {
    if (!mode || mode.kind === "legacy") return null;
    if (mode.kind === "run") return { kind: "run" };
    if (mode.kind === "all") return { kind: "all" };
    if (mode.kind === "range") return { kind: "range", from: mode.from, to: mode.to };
    if (!currentDay) return null;
    const bounds = citationMonthBounds(currentDay);
    return bounds ? { kind: "month", ...bounds } : null;
  }, [currentDay, mode]);

  const trendAggregate = useMemo<CitationAggregate | null>(() => {
    if (!window || window.kind === "month" || window.kind === "run") return null;
    if (!trend || trend.phase === "loading" || trend.phase === "idle") return { phase: "loading" };
    if (trend.phase === "error" || trend.phase === "unavailable") return { phase: "error", message: trend.message };
    return finish(window, trend.snapshots, false);
  }, [trend, window]);

  const fixtureMonth = useMemo<CitationAggregate | null>(() => {
    if (!window || window.kind !== "month" || source !== "fixture" || catalog?.phase !== "ready") return null;
    const runs = runsInCitationWindow(catalog.runs, window);
    const snapshots = runs
      .map((run) => historyFixtureSnapshot(run.audit_run_id))
      .filter((snapshot): snapshot is AiSearchSnapshot => snapshot != null);
    return finish(window, snapshots, false);
  }, [catalog, source, window]);

  const liveKey =
    window?.kind === "month" && source === "live" && catalog?.phase === "ready"
      ? `${window.from}:${window.to}:${runsInCitationWindow(catalog.runs, window)
          .map((run) => run.audit_run_id)
          .join(",")}`
      : "";
  const [liveMonth, setLiveMonth] = useState<{ key: string; value: CitationAggregate }>({
    key: "",
    value: { phase: "loading" },
  });

  useEffect(() => {
    if (!liveKey || !window || window.kind !== "month" || catalog?.phase !== "ready") return;
    const key = liveKey;
    const runs = runsInCitationWindow(catalog.runs, window);
    let cancelled = false;
    void (async () => {
      const snapshots: AiSearchSnapshot[] = [];
      for (const run of runs) {
        if (read.phase === "ready" && read.snapshot.run.audit_run_id === run.audit_run_id) {
          snapshots.push(read.snapshot);
          continue;
        }
        const loaded = await loadHistorySnapshot(getCanvasSupabase() as never, run.audit_run_id);
        if (cancelled) return;
        if (loaded.phase !== "ready") {
          setLiveMonth({
            key,
            value: { phase: "error", message: loaded.message },
          });
          return;
        }
        snapshots.push(loaded.snapshot);
      }
      if (read.phase === "ready" && window.kind === "month") {
        const currentId = read.snapshot.run.audit_run_id;
        const day = utcDay(read.snapshot.run.published_at ?? read.snapshot.run.completed_at);
        if (day && day >= window.from && day <= window.to && !snapshots.some((item) => item.run.audit_run_id === currentId)) {
          snapshots.push(read.snapshot);
        }
      }
      if (!cancelled) setLiveMonth({ key, value: finish(window, snapshots, false) });
    })();
    return () => {
      cancelled = true;
    };
  }, [catalog, liveKey, read, window]);

  if (!history || mode?.kind === "run") {
    if (read.phase === "loading") return { phase: "loading" };
    if (read.phase === "error") return { phase: "error", message: read.message };
    if (read.phase === "no-run") return { phase: "empty", message: "No AI run has been published yet." };
    return finish({ kind: "run" }, [read.snapshot], true);
  }
  if (mode?.kind === "legacy") {
    return { phase: "empty", message: "Legacy test runs stay out of the citation totals." };
  }
  if (trendAggregate) return trendAggregate;
  if (fixtureMonth) return fixtureMonth;
  if (window?.kind === "month") {
    if (read.phase === "loading" || catalog?.phase === "loading") return { phase: "loading" };
    if (read.phase === "error") return { phase: "error", message: read.message };
    if (catalog?.phase === "error") return { phase: "error", message: catalog.message };
    if (read.phase === "no-run") return { phase: "empty", message: "No AI run has been published yet." };
    return liveMonth.key === liveKey ? liveMonth.value : { phase: "loading" };
  }
  return { phase: "loading" };
}
