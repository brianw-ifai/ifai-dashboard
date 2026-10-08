import type { NextRequest } from "next/server";
import { loadBundle } from "@/lib/dashboard-v2/data/reads";
import { forcedFailure, stringParam } from "@/lib/dashboard-v2/data/route-helpers";
import { bundleErrors, bundleFailed } from "@/lib/dashboard-v2/data/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forced = forcedFailure(request);
  if (forced) return forced;
  const bundle = await loadBundle(stringParam(request, "clientId"));
  const failed = bundleFailed(bundle);
  return Response.json(
    { ok: !failed, bundle, error: failed ? bundleErrors(bundle).join("; ") : null, asOf: bundle.loadedAt },
    { status: failed ? 502 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
