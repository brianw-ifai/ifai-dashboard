"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAiHistory } from "@/components/v3/live/ai-search/AiHistoryContext";
import { RunHistoryCalendar } from "@/components/v3/live/ai-search/RunHistoryCalendar";
import {
  formatDay,
  isTrustworthyRun,
  previousTrustworthyRun,
  utcDay,
  type HistoryRunSummary,
} from "@/lib/ai-search/history-eligibility";
import { runStateLabel } from "@/lib/ai-search/summary";

function monthOf(day: string | null): { year: number; month: number } {
  if (!day) {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  }
  const [year, month] = day.split("-").map(Number);
  return { year, month: month - 1 };
}

function RunDetail({ run }: { run: HistoryRunSummary }) {
  const day = utcDay(run.published_at ?? run.completed_at);
  const answered = run.answered_calls == null || run.expected_calls == null
    ? "Not recorded"
    : `${run.answered_calls} of ${run.expected_calls}`;
  return (
    <div className="ai-history-detail" data-ai-history-run={run.audit_run_id}>
      <strong>{day ? formatDay(day) : "Date not recorded"}</strong>
      <ul>
        <li>State: {run.run_state ? runStateLabel(run.run_state) : "Not recorded"}</li>
        <li>Published: {run.published_at ? formatDay(utcDay(run.published_at) ?? "") : "Not published"}</li>
        <li>Collector: {run.collector_version ?? "Not recorded"}</li>
        <li>Answered of expected: {answered}</li>
        <li>Provider errors: {run.error_calls == null ? "Not recorded" : run.error_calls}</li>
        <li>Prompt set: {run.prompt_set_hash ?? "Not recorded"}</li>
      </ul>
    </div>
  );
}

export function RunHistoryControl() {
  const history = useAiHistory();
  const [open, setOpen] = useState(false);
  const [pickingRange, setPickingRange] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const runs = history.catalog.phase === "ready" ? history.catalog.runs : [];
  const visible = history.includeLegacy ? runs : runs.filter(isTrustworthyRun);
  const anchorId = history.current.phase === "ready" ? history.current.snapshot.run.audit_run_id : null;
  const previous = previousTrustworthyRun(visible.filter(isTrustworthyRun), history.source === "live" ? anchorId : null);
  const latestDay = utcDay(
    [...visible].filter(isTrustworthyRun).sort((a, b) => (a.published_at ?? "").localeCompare(b.published_at ?? "")).at(-1)?.published_at ?? null,
  );
  const [month, setMonth] = useState(monthOf(latestDay));

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusables = () =>
      [...(dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled)") ?? [])];
    focusables()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const trigger = buttonRef.current;
    const place = () => {
      if (!dialog || !trigger) return;
      const available = window.innerHeight - trigger.getBoundingClientRect().bottom - 16;
      dialog.style.maxHeight = `${Math.max(220, Math.floor(available))}px`;
    };
    place();
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      trigger?.focus();
    };
  }, [open]);

  function pickDay(day: string) {
    if (!pickingRange) {
      setSelectedDay(day);
      return;
    }
    if (!rangeStart || rangeEnd) {
      setRangeStart(day);
      setRangeEnd(null);
      setSelectedDay(day);
      return;
    }
    setRangeEnd(day);
    setSelectedDay(day);
  }

  const chosen = selectedDay
    ? visible.filter((run) => utcDay(run.published_at ?? run.completed_at) === selectedDay)
    : [];
  const chosenRun = chosen.find((run) => run.audit_run_id === pickedId) ?? (chosen.length === 1 ? chosen[0] : null);
  const trustworthyChoice = chosenRun != null && isTrustworthyRun(chosenRun);

  return (
    <div className="ai-history-control">
      <button
        ref={buttonRef}
        type="button"
        className="ai-history-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-ai-history-trigger
        onClick={() => setOpen((value) => !value)}
      >
        {history.controlLabel} ▾
      </button>
      {open ? (
        <div
          ref={dialogRef}
          className="ai-history-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-ai-history-dialog
        >
          <h3 id={titleId}>Choose a run</h3>
          <div className="ai-history-dialog-body">
          {history.source === "fixture" ? (
            <p className="ai-history-note" data-ai-history-fixture>
              Sample history for review. These runs are fixtures, not the live database. Current returns to the live published run.
            </p>
          ) : null}
          <div className="ai-history-quick" role="group" aria-label="Quick choices">
            <button type="button" onClick={() => { history.viewCurrent(); setOpen(false); }}>Current</button>
            <button
              type="button"
              disabled={!previous}
              onClick={() => {
                if (!previous) return;
                history.viewRun(previous.audit_run_id);
                setOpen(false);
              }}
            >
              Previous run
            </button>
            <button type="button" aria-pressed={pickingRange} onClick={() => setPickingRange(true)}>
              Date range
            </button>
            <button type="button" onClick={() => { history.viewAll(); setOpen(false); }}>All time</button>
          </div>
          <label className="ai-history-legacy">
            <input
              type="checkbox"
              checked={history.includeLegacy}
              onChange={(event) => history.setIncludeLegacy(event.target.checked)}
            />
            Include legacy test runs
          </label>
          {history.catalog.phase === "loading" ? <p className="ai-history-note">Loading runs.</p> : null}
          {history.catalog.phase === "error" ? (
            <p className="ai-history-note">Run history did not load. {history.catalog.message}</p>
          ) : null}
          {history.catalog.phase === "ready" ? (
            <RunHistoryCalendar
              runs={visible}
              month={month}
              onMonth={setMonth}
              selectedDay={selectedDay}
              rangeStart={pickingRange ? rangeStart : null}
              rangeEnd={pickingRange ? rangeEnd : null}
              onPick={pickDay}
            />
          ) : null}
          {chosen.length > 1 ? (
            <div className="ai-history-quick" role="group" aria-label="Runs on this date">
              {chosen.map((run) => (
                <button
                  key={run.audit_run_id}
                  type="button"
                  aria-pressed={chosenRun?.audit_run_id === run.audit_run_id}
                  onClick={() => setPickedId(run.audit_run_id)}
                >
                  {run.collector_version ?? "Collector not recorded"} · {run.is_published ? "Published" : "Unpublished"}
                </button>
              ))}
            </div>
          ) : null}
          {chosen.map((run) => (
            <RunDetail key={run.audit_run_id} run={run} />
          ))}
          </div>
          <div className="ai-history-actions">
            {pickingRange ? (
              <button
                type="button"
                disabled={!rangeStart || !rangeEnd}
                onClick={() => {
                  if (!rangeStart || !rangeEnd) return;
                  history.viewRange(rangeStart, rangeEnd);
                  setOpen(false);
                }}
              >
                View trends
              </button>
            ) : (
              <button
                type="button"
                disabled={!chosenRun}
                data-ai-history-view-run
                onClick={() => {
                  if (!chosenRun) return;
                  if (trustworthyChoice) history.viewRun(chosenRun.audit_run_id);
                  else history.viewLegacy(chosenRun.audit_run_id);
                  setOpen(false);
                }}
              >
                {chosenRun && !trustworthyChoice ? "Inspect legacy run" : "View run"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
