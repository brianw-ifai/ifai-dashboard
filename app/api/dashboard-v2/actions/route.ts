import type { NextRequest } from "next/server";
import { readActions } from "@/lib/dashboard-v2/data/reads";
import { forcedFailure, rowsResponse } from "@/lib/dashboard-v2/data/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forced = forcedFailure(request);
  if (forced) return forced;
  return rowsResponse(await readActions());
}
