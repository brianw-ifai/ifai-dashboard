import "server-only";

import type { NextRequest } from "next/server";
import type { PagedReadResult, ReadResult } from "./types";

/**
 * Shared pieces for the app/api/dashboard-v2 route handlers. Every handler is dynamic and
 * returns { ok, rows | bundle, error, asOf }.
 */

export const FORCED_FAILURE_MESSAGE = "forced failure for the failed-read test";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * End-to-end tests force a failed read with `?fail=1`, honored only while E2E_AUTH_BYPASS is "1".
 * Production never sets that variable, so the flag is ignored there.
 */
export function forcedFailure(request: NextRequest): Response | null {
  if (process.env.E2E_AUTH_BYPASS !== "1") return null;
  if (request.nextUrl.searchParams.get("fail") !== "1") return null;
  return Response.json({ ok: false, error: FORCED_FAILURE_MESSAGE }, { status: 500, headers: NO_STORE });
}

export function rowsResponse<T>(result: ReadResult<T> | PagedReadResult<T>): Response {
  const body = {
    ok: result.error === null,
    rows: result.rows,
    error: result.error,
    asOf: result.asOf,
    ...("page" in result ? { page: result.page, pageSize: result.pageSize, nextPage: result.nextPage } : {}),
  };
  return Response.json(body, { status: result.error === null ? 200 : 502, headers: NO_STORE });
}

export function pageParam(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("page");
  const page = raw === null ? 0 : Number(raw);
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

export function stringParam(request: NextRequest, name: string): string | undefined {
  const value = request.nextUrl.searchParams.get(name);
  return value && value.trim() ? value.trim() : undefined;
}

export function booleanParam(request: NextRequest, name: string): boolean | undefined {
  const value = request.nextUrl.searchParams.get(name);
  if (value === null) return undefined;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}
