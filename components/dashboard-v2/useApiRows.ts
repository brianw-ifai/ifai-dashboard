"use client";

import { useEffect, useState } from "react";

/**
 * Loads rows from an app/api/dashboard-v2 route handler in the browser, following `nextPage`
 * until the server has no more. A failed fetch becomes `error`; nothing throws into a panel.
 */

export type RemoteStatus = "loading" | "ready" | "error";

export type RemoteRows<T> = {
  status: RemoteStatus;
  rows: T[];
  error: string | null;
  /** When the last page was fetched, ISO. */
  fetchedAt: string | null;
  pages: number;
};

type ApiBody<T> = {
  ok: boolean;
  rows?: T[];
  error?: string | null;
  asOf?: string;
  nextPage?: number | null;
};

const LOADING: RemoteRows<never> = { status: "loading", rows: [], error: null, fetchedAt: null, pages: 0 };

export async function fetchAllPages<T>(path: string, signal?: AbortSignal): Promise<RemoteRows<T>> {
  const rows: T[] = [];
  let page: number | null = 0;
  let pages = 0;
  let fetchedAt: string | null = null;
  while (page !== null) {
    const url = `${path}${path.includes("?") ? "&" : "?"}page=${page}`;
    const response = await fetch(url, { signal, cache: "no-store" });
    let body: ApiBody<T> | null = null;
    try {
      body = (await response.json()) as ApiBody<T>;
    } catch {
      body = null;
    }
    if (!response.ok || !body || !body.ok) {
      const message = body?.error || `The server answered with status ${response.status}.`;
      return { status: "error", rows: [], error: message, fetchedAt: body?.asOf ?? null, pages };
    }
    rows.push(...(body.rows ?? []));
    pages += 1;
    fetchedAt = body.asOf ?? fetchedAt;
    page = typeof body.nextPage === "number" ? body.nextPage : null;
  }
  return { status: "ready", rows, error: null, fetchedAt, pages };
}

type Settled<T> = { path: string; result: RemoteRows<T> };

/** Pass null to skip loading (for example when the explainer is closed). */
export function useApiRows<T>(path: string | null): RemoteRows<T> {
  // The settled result remembers the path it answers, so a path change reads as loading again
  // without a synchronous state reset inside the effect.
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    fetchAllPages<T>(path, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSettled({ path, result });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "The fetch failed.";
        setSettled({ path, result: { status: "error", rows: [], error: message, fetchedAt: null, pages: 0 } });
      });
    return () => controller.abort();
  }, [path]);

  if (path && settled && settled.path === path) return settled.result;
  return LOADING;
}
