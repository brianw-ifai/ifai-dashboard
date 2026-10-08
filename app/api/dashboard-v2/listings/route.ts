import type { NextRequest } from "next/server";
import { readListings } from "@/lib/dashboard-v2/data/reads";
import { booleanParam, forcedFailure, pageParam, rowsResponse } from "@/lib/dashboard-v2/data/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forced = forcedFailure(request);
  if (forced) return forced;
  const result = await readListings(pageParam(request), { suppressed: booleanParam(request, "suppressed") });
  return rowsResponse(result);
}
