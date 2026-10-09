import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  API_RESOURCES,
  apiUrl,
  basePath,
  dynamicApiUrl,
  routeUrl,
  STATIC_BASE_PATH,
  staticDataFile,
  staticDataUrl,
} from "@/lib/dashboard-v2/data/client-paths";

const saved = process.env.NEXT_PUBLIC_STATIC_EXPORT;
afterEach(() => {
  if (saved === undefined) delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
  else process.env.NEXT_PUBLIC_STATIC_EXPORT = saved;
});

test("normal mode: apiUrl is the route handler with its params, and routes have no basePath", () => {
  delete process.env.NEXT_PUBLIC_STATIC_EXPORT;
  assert.equal(apiUrl("bundle"), "/api/dashboard-v2/bundle");
  assert.equal(apiUrl("listings", { suppressed: 1, page: 2 }), "/api/dashboard-v2/listings?suppressed=1&page=2");
  assert.equal(apiUrl("channel-prices", { listingId: "lst_B0X", page: 0 }), "/api/dashboard-v2/channel-prices?listingId=lst_B0X&page=0");
  assert.equal(apiUrl("listings", { fail: 1 }), "/api/dashboard-v2/listings?fail=1", "the forced-failure flag passes through to the server");
  assert.equal(basePath(), "");
  assert.equal(routeUrl("/dashboard"), "/dashboard");
});

test("static mode: apiUrl is the exported JSON under the basePath, paged by file, and fail is ignored", () => {
  process.env.NEXT_PUBLIC_STATIC_EXPORT = "1";
  assert.equal(apiUrl("bundle"), `${STATIC_BASE_PATH}/dashboard-v2-data/bundle.json`);
  assert.equal(apiUrl("listings", { page: 0 }), `${STATIC_BASE_PATH}/dashboard-v2-data/listings-0.json`);
  assert.equal(apiUrl("listings", { suppressed: 1, page: 3 }), `${STATIC_BASE_PATH}/dashboard-v2-data/listings-suppressed-3.json`);
  assert.equal(apiUrl("answers", { flag: 1 }), `${STATIC_BASE_PATH}/dashboard-v2-data/answers-flag-0.json`);
  assert.equal(apiUrl("actions", { page: 0 }), `${STATIC_BASE_PATH}/dashboard-v2-data/actions.json`, "unpaged resources ignore page");
  assert.equal(apiUrl("channel-prices", { listingId: "lst_B0X", page: 0 }), `${STATIC_BASE_PATH}/dashboard-v2-data/channel-prices/lst_B0X.json`);
  assert.equal(apiUrl("listings", { fail: 1, page: 1 }), `${STATIC_BASE_PATH}/dashboard-v2-data/listings-1.json`);
  assert.equal(basePath(), STATIC_BASE_PATH);
  assert.equal(routeUrl("/dashboard-v2"), `${STATIC_BASE_PATH}/dashboard-v2/`);
});

test("the file name is deterministic across param order and absent values", () => {
  assert.equal(staticDataFile("answers", { page: 1, flag: "true" }), staticDataFile("answers", { flag: 1, page: "1" }));
  assert.equal(staticDataFile("listings", { suppressed: undefined, page: 0 }), "listings-0.json");
  assert.equal(staticDataFile("answers", { engine: "chat gpt", page: 0 }), "answers-engine-chat_gpt-0.json");
  assert.throws(() => staticDataFile("channel-prices", {}), /listingId/);
  for (const resource of API_RESOURCES) {
    if (resource === "channel-prices") continue;
    assert.match(staticDataUrl(resource), /\.json$/);
    assert.match(dynamicApiUrl(resource), /^\/api\/dashboard-v2\//);
  }
});
