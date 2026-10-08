"use client";

import type { ReactNode } from "react";
import { formatAsOf, formatInt, UNAVAILABLE_WORD } from "@/lib/dashboard-v2/reading/format";
import type { RemoteRows } from "./useApiRows";

export const LOADING_TEXT = "Loading the reading";

/**
 * Wraps a table that loads through a route handler: "Loading the reading" while it loads, the
 * unavailable state with the error when the fetch fails, and a count line when it is ready.
 */
export function RemoteTable<T>({
  state,
  noun,
  children,
}: {
  state: RemoteRows<T>;
  /** Plural noun for the count line, for example "listings". */
  noun: string;
  children: (rows: T[]) => ReactNode;
}) {
  if (state.status === "loading") {
    return (
      <p className="dv2-remote-status" role="status" aria-live="polite">
        {LOADING_TEXT}
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <div className="dv2-remote-status dv2-remote-error" role="status">
        <strong>{UNAVAILABLE_WORD}</strong>: {state.error ?? "The read failed."}
      </div>
    );
  }
  return (
    <div className="dv2-remote-ready">
      <p className="dv2-remote-count" data-testid="remote-count">
        {formatInt(state.rows.length)} {noun} loaded
        {state.pages > 1 ? ` in ${formatInt(state.pages)} pages` : ""}, fetched {formatAsOf(state.fetchedAt)}
      </p>
      {children(state.rows)}
    </div>
  );
}
