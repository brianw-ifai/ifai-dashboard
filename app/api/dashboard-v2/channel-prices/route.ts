import type { NextRequest } from "next/server";
import { readChannelPrices } from "@/lib/dashboard-v2/data/reads";
import { forcedFailure, rowsResponse, stringParam } from "@/lib/dashboard-v2/data/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forced = forcedFailure(request);
  if (forced) return forced;
  const listingId = stringParam(request, "listingId");
  if (!listingId) {
    return Response.json(
      { ok: false, rows: [], error: "listingId is required", asOf: new Date().toISOString() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return rowsResponse(await readChannelPrices(listingId));
}
