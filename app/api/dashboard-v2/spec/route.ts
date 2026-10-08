import type { NextRequest } from "next/server";
import { readSpec } from "@/lib/dashboard-v2/data/reads";
import { forcedFailure, pageParam, rowsResponse } from "@/lib/dashboard-v2/data/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forced = forcedFailure(request);
  if (forced) return forced;
  return rowsResponse(await readSpec(pageParam(request)));
}
