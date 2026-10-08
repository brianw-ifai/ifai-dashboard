import type { NextRequest } from "next/server";
import { readAnswers } from "@/lib/dashboard-v2/data/reads";
import {
  booleanParam,
  forcedFailure,
  pageParam,
  rowsResponse,
  stringParam,
} from "@/lib/dashboard-v2/data/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forced = forcedFailure(request);
  if (forced) return forced;
  const result = await readAnswers(pageParam(request), {
    engine: stringParam(request, "engine"),
    category: stringParam(request, "category"),
    outcome: stringParam(request, "outcome"),
    wrongSpecFlag: booleanParam(request, "flag"),
  });
  return rowsResponse(result);
}
