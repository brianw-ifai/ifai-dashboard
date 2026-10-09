/**
 * The one URL seam between the dashboard-v2 client and its data.
 *
 * Normal mode: every read goes to a route handler under /api/dashboard-v2, which reads the
 * sandbox on request. Static export (GitHub Pages, NEXT_PUBLIC_STATIC_EXPORT=1): there is no
 * server, so the same reads are written to JSON at build time by
 * scripts/dashboard-v2/export-static-data.mjs and fetched from public/dashboard-v2-data/.
 * Both carry the same { ok, rows | bundle, error, asOf } body, so the client changes only here.
 *
 * Plain data and string building only: this file is shared by the browser, the export script
 * (through scripts/register-alias.mjs), and the unit tests.
 */

/** Mirrors the `repo` constant in next.config.ts, which sets basePath for the static export. */
export const STATIC_REPO = "ifai-dashboard";
export const STATIC_BASE_PATH = `/${STATIC_REPO}`;

/** Folder under public/ that the export script fills. */
export const STATIC_DATA_DIR = "dashboard-v2-data";

export const API_PREFIX = "/api/dashboard-v2";

export const API_RESOURCES = ["bundle", "listings", "answers", "spec", "actions", "channel-prices"] as const;
export type ApiResource = (typeof API_RESOURCES)[number];

/** Resources whose route handler pages its rows (PAGE_SIZE rows a page, `nextPage` when more exist). */
export const PAGED_RESOURCES: ReadonlySet<ApiResource> = new Set<ApiResource>(["listings", "answers", "spec"]);

export type ApiParamValue = string | number | boolean | null | undefined;
export type ApiParams = Record<string, ApiParamValue>;

/** One client read: a resource and its query. useApiRows adds `page` as it follows `nextPage`. */
export type ApiQuery = { resource: ApiResource; params?: ApiParams };

/** Read at call time so the unit tests can toggle it; Next inlines the literal lookup in client bundles. */
export function isStaticExport(): boolean {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
}

/** "/ifai-dashboard" on the static export, "" otherwise. */
export function basePath(): string {
  return isStaticExport() ? STATIC_BASE_PATH : "";
}

/**
 * An app route for links and iframes. The static export is built with trailingSlash, so the
 * folder form resolves to its index.html; the dev server wants the bare path.
 */
export function routeUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return isStaticExport() ? `${STATIC_BASE_PATH}${clean}/` : clean;
}

function present(value: ApiParamValue): value is string | number | boolean {
  return value !== undefined && value !== null && value !== "";
}

function pageOf(params: ApiParams): number {
  const raw = params.page;
  const page = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

/**
 * The exported file for one resource and query, relative to STATIC_DATA_DIR and without the
 * leading slash. The export script writes exactly these names, so a client query and its file
 * agree by construction:
 *
 *   bundle                         -> bundle.json
 *   listings, page 0               -> listings-0.json
 *   listings, suppressed=1, page 2 -> listings-suppressed-2.json
 *   answers, flag=1, page 0        -> answers-flag-0.json
 *   actions                        -> actions.json
 *   channel-prices, listingId=X    -> channel-prices/X.json
 *
 * `fail` (the e2e forced-failure flag) is ignored here: static hosting has no server to fail.
 */
export function staticDataFile(resource: ApiResource, params: ApiParams = {}): string {
  if (resource === "channel-prices") {
    const listingId = params.listingId;
    if (!present(listingId)) throw new Error("channel-prices needs a listingId");
    return `channel-prices/${encodeURIComponent(String(listingId))}.json`;
  }
  const parts: string[] = [resource];
  for (const key of Object.keys(params).sort()) {
    if (key === "page" || key === "fail") continue;
    const value = params[key];
    if (!present(value)) continue;
    const text = String(value);
    if (text === "1" || text === "true") parts.push(key);
    else parts.push(key, text.replace(/[^A-Za-z0-9_.-]+/g, "_"));
  }
  if (PAGED_RESOURCES.has(resource)) parts.push(String(pageOf(params)));
  return `${parts.join("-")}.json`;
}

/** The URL the static client fetches for one query. */
export function staticDataUrl(resource: ApiResource, params: ApiParams = {}): string {
  return `${STATIC_BASE_PATH}/${STATIC_DATA_DIR}/${staticDataFile(resource, params)}`;
}

/** The route-handler URL for one query, every present param in insertion order. */
export function dynamicApiUrl(resource: ApiResource, params: ApiParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (present(value)) search.set(key, String(value));
  }
  const query = search.toString();
  return `${API_PREFIX}/${resource}${query ? `?${query}` : ""}`;
}

/** Where the client reads `resource` with `params`, in the mode this build runs in. */
export function apiUrl(resource: ApiResource, params: ApiParams = {}): string {
  return isStaticExport() ? staticDataUrl(resource, params) : dynamicApiUrl(resource, params);
}
