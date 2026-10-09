#!/usr/bin/env node
/**
 * Writes the dashboard-v2 reads to public/dashboard-v2-data/ as the JSON the static export
 * (GitHub Pages) fetches in place of the app/api/dashboard-v2 route handlers.
 *
 *   node scripts/dashboard-v2/export-static-data.mjs
 *
 * Runs in Node at build time with the server-side sandbox variables (SANDBOX_SUPABASE_URL and
 * SANDBOX_PUBLISHABLE_KEY or SANDBOX_ANON_KEY), loaded from .env.local when present. Nothing
 * with a NEXT_PUBLIC_ prefix is involved and no value is printed. It reuses
 * lib/dashboard-v2/data/reads.ts, so each file carries the same { ok, rows | bundle, error,
 * asOf } body the route handlers return, and names the files with the same function the client
 * uses to fetch them (lib/dashboard-v2/data/client-paths.ts).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// "@/" and extensionless .ts imports first, then the server-only marker on top.
register("../alias-hooks.mjs", import.meta.url);
register("./static-export-hooks.mjs", import.meta.url);

// @next/env is what `next build` itself uses to read .env files; the quiet logger prints nothing.
const nextEnv = await import("@next/env");
const loadEnvConfig = nextEnv.loadEnvConfig ?? nextEnv.default.loadEnvConfig;
loadEnvConfig(root, false, { info() {}, error: (...args) => console.error(...args) });

const [{ staticDataFile, STATIC_DATA_DIR }, reads, types, sandbox] = await Promise.all([
  import("@/lib/dashboard-v2/data/client-paths"),
  import("@/lib/dashboard-v2/data/reads"),
  import("@/lib/dashboard-v2/data/types"),
  import("@/lib/dashboard-v2/data/sandbox-client"),
]);

const outDir = join(root, "public", STATIC_DATA_DIR);
const SAFE_ID = /^[A-Za-z0-9_.-]+$/;

/** The same body rowsResponse() builds in lib/dashboard-v2/data/route-helpers.ts. */
function rowsBody(result) {
  return {
    ok: result.error === null,
    rows: result.rows,
    error: result.error,
    asOf: result.asOf,
    ...("page" in result ? { page: result.page, pageSize: result.pageSize, nextPage: result.nextPage } : {}),
  };
}

const written = {};
const warnings = [];

function write(file, body) {
  const path = join(outDir, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(body));
  const rows = Array.isArray(body.rows) ? body.rows.length : null;
  written[file] = rows;
  if (body.error) warnings.push(`${file}: ${body.error}`);
  return rows;
}

/** Follows nextPage the way useApiRows does, writing one file per page. */
async function exportPaged(resource, params, read) {
  let page = 0;
  let total = 0;
  let pages = 0;
  for (;;) {
    const result = await read(page);
    const rows = write(staticDataFile(resource, { ...params, page }), rowsBody(result));
    total += rows ?? 0;
    pages += 1;
    if (result.error || result.nextPage === null) break;
    page = result.nextPage;
  }
  return { total, pages };
}

/**
 * One file per listing, every listing, so a listing without channel rows reads as ok with zero
 * rows (as the route handler answers) rather than a 404. The rows come from one bulk read in
 * the route's order (channel, then newest read first) and are grouped by listing.
 */
async function exportChannelPrices(listingIds) {
  const columns =
    "listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, price_cents, url, checked_at, store_title, store_seller_name";
  const byListing = new Map(listingIds.map((id) => [id, []]));
  let from = 0;
  let readError = null;
  let asOf = new Date().toISOString();
  for (;;) {
    const to = from + reads.PAGE_SIZE - 1;
    const { data, error } = await sandbox
      .getSandboxClient()
      .from("listing_channel_price")
      .select(columns)
      .eq("client_id", reads.DEFAULT_CLIENT_ID)
      .order("listing_id")
      .order("channel")
      .order("read_at", { ascending: false })
      .range(from, to);
    asOf = new Date().toISOString();
    if (error) {
      readError = `listing_channel_price: ${error.message}`;
      break;
    }
    const rows = Array.isArray(data) ? data : [];
    for (const row of rows) {
      if (!byListing.has(row.listing_id)) byListing.set(row.listing_id, []);
      byListing.get(row.listing_id).push(row);
    }
    if (rows.length < reads.PAGE_SIZE) break;
    from += reads.PAGE_SIZE;
  }
  let rowTotal = 0;
  let withRows = 0;
  for (const [listingId, rows] of byListing) {
    if (!SAFE_ID.test(listingId)) throw new Error(`listing_id ${JSON.stringify(listingId)} is not a safe file name`);
    const body = readError ? { ok: false, rows: [], error: readError, asOf } : { ok: true, rows, error: null, asOf };
    write(staticDataFile("channel-prices", { listingId }), body);
    rowTotal += rows.length;
    if (rows.length) withRows += 1;
  }
  return { listings: byListing.size, withRows, rows: rowTotal, error: readError };
}

const startedAt = new Date().toISOString();
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Bundle: the Server Component page's read, as /api/dashboard-v2/bundle returns it.
let bundle;
try {
  bundle = await reads.loadBundle();
} catch (error) {
  console.error(`The bundle read threw: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
const failed = types.bundleFailed(bundle);
write("bundle.json", { ok: !failed, bundle, error: failed ? types.bundleErrors(bundle).join("; ") : null, asOf: bundle.loadedAt });
if (failed) {
  console.error("Every read of the bundle failed, so nothing useful can be exported:");
  for (const error of types.bundleErrors(bundle)) console.error(`  ${error}`);
  process.exit(1);
}

const counts = {};
counts.bundle = Object.fromEntries(types.BUNDLE_PARTS.map((part) => [part, bundle[part].rows.length]));

const listingIds = [];
counts.listings = await exportPaged("listings", {}, async (page) => {
  const result = await reads.readListings(page);
  for (const row of result.rows) listingIds.push(row.listing_id);
  return result;
});
counts.listingsSuppressed = await exportPaged("listings", { suppressed: 1 }, (page) => reads.readListings(page, { suppressed: true }));
counts.answers = await exportPaged("answers", {}, (page) => reads.readAnswers(page));
counts.answersFlag = await exportPaged("answers", { flag: 1 }, (page) => reads.readAnswers(page, { wrongSpecFlag: true }));
counts.spec = await exportPaged("spec", {}, (page) => reads.readSpec(page));
counts.actions = { total: write(staticDataFile("actions"), rowsBody(await reads.readActions())) ?? 0, pages: 1 };
counts.channelPrices = await exportChannelPrices(listingIds);

const exportedAt = new Date().toISOString();
const index = {
  exportedAt,
  startedAt,
  clientId: bundle.clientId,
  bundleLoadedAt: bundle.loadedAt,
  counts,
  files: Object.keys(written).length,
  rowsByFile: Object.fromEntries(Object.entries(written).filter(([file]) => !file.startsWith("channel-prices/"))),
  warnings,
};
writeFileSync(join(outDir, "index.json"), JSON.stringify(index, null, 2));

console.log(`dashboard-v2 static data exported at ${exportedAt} to public/${STATIC_DATA_DIR}/`);
console.log(`  bundle parts: ${Object.entries(counts.bundle).map(([k, v]) => `${k}=${v}`).join(", ")}`);
console.log(`  listings: ${counts.listings.total} rows in ${counts.listings.pages} page(s)`);
console.log(`  listings (suppressed): ${counts.listingsSuppressed.total} rows in ${counts.listingsSuppressed.pages} page(s)`);
console.log(`  answers: ${counts.answers.total} rows in ${counts.answers.pages} page(s)`);
console.log(`  answers (flag): ${counts.answersFlag.total} rows in ${counts.answersFlag.pages} page(s)`);
console.log(`  spec: ${counts.spec.total} rows in ${counts.spec.pages} page(s)`);
console.log(`  actions: ${counts.actions.total} rows`);
console.log(
  `  channel prices: ${counts.channelPrices.rows} rows across ${counts.channelPrices.withRows} of ${counts.channelPrices.listings} listings (one file each)`,
);
console.log(`  files written: ${index.files}`);
for (const warning of warnings) console.warn(`  warning: ${warning}`);
