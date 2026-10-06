import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let canvasClient: SupabaseClient | null = null;

/** Browser-safe client for read-only `public.canvas_*` views (no session persistence). */
export function getCanvasSupabase(): SupabaseClient {
  if (canvasClient) return canvasClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY).",
    );
  }

  canvasClient = createClient(url, key, { auth: { persistSession: false } });
  return canvasClient;
}
