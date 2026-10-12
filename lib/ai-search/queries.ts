import type {
  AiCallRow,
  AiCitationRow,
  AiCurrentRun,
  AiProbeRow,
  AiSearchRead,
} from "@/lib/ai-search/types";

export const AI_CALL_COLUMNS =
  "id,audit_run_id,sim_id,engine,model,category,prompt,prompt_key,prompt_kind,call_status,outcome,primary_brand,material_hallucination,hallucination_evidence,root_cause,remediation_patch,error_message,attempt_no,repeat_no,created_at";

export const AI_PROBE_COLUMNS =
  "audit_run_id,sim_id,prompt_key,prompt,engine,model,call_status,material_hallucination,hallucination_evidence,verified_claim,verified_source_url,verified_at,created_at";

export const AI_CITATION_COLUMNS =
  "audit_run_id,sim_id,simulation_id,prompt_key,prompt_kind,category,engine,position,url,domain,title";

type ReadResult = PromiseLike<{ data: unknown; error: { message: string } | null }>;

type Ranged = ReadResult & { range: (from: number, to: number) => ReadResult };

/** The slice of the Supabase client these reads use, so tests can pass a fake. */
export type AiReadClient = {
  from: (view: string) => {
    select: (columns: string) => ReadResult & {
      order: (column: string, options?: { ascending?: boolean }) => Ranged;
    };
  };
};

const PAGE = 1000;
const MAX_PAGES = 20;

async function readAll<T>(
  client: AiReadClient,
  view: string,
  columns: string,
  orderBy: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE;
    const { data, error } = await client
      .from(view)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${view}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

type SingleClient = {
  from: (view: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
};

/** The engine's answer for one call, read only when its evidence drawer opens. */
export async function answerTextQuery(
  client: SingleClient,
  id: string,
): Promise<{ answer: string | null; error: string | null }> {
  const { data, error } = await client
    .from("canvas_ai_simulations")
    .select("answer_text")
    .eq("id", id)
    .maybeSingle();
  if (error) return { answer: null, error: error.message };
  const answer = (data as { answer_text?: string | null } | null)?.answer_text?.trim();
  return { answer: answer || null, error: null };
}

/**
 * One published run and the rows that belong to it. Rows from any other run are
 * dropped here as a second guard on top of the current-run views.
 */
export async function loadAiSearchRead(client: AiReadClient): Promise<AiSearchRead> {
  const runResult = await client.from("canvas_ai_current_run").select("*");
  if (runResult.error) return { phase: "error", message: runResult.error.message };
  const runs = (runResult.data ?? []) as AiCurrentRun[];
  if (runs.length === 0) return { phase: "no-run" };
  if (runs.length > 1) {
    return { phase: "error", message: "canvas_ai_current_run returned more than one run." };
  }
  const run = runs[0];

  try {
    const [calls, probes, citations] = await Promise.all([
      readAll<AiCallRow>(client, "canvas_ai_simulations", AI_CALL_COLUMNS, "sim_id"),
      readAll<AiProbeRow>(client, "canvas_ai_probes", AI_PROBE_COLUMNS, "sim_id"),
      readAll<AiCitationRow>(client, "canvas_ai_citations", AI_CITATION_COLUMNS, "sim_id"),
    ]);
    const inRun = <T extends { audit_run_id: string }>(rows: T[]) =>
      rows.filter((row) => row.audit_run_id === run.audit_run_id);
    return {
      phase: "ready",
      snapshot: {
        run,
        calls: inRun(calls),
        probes: inRun(probes),
        citations: inRun(citations),
      },
    };
  } catch (error) {
    return { phase: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
