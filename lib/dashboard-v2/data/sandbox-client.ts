import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * One supabase-js client per process for the sandbox project, reading schema `sandbox`.
 * The credentials have no NEXT_PUBLIC_ prefix, so this module only runs on the server.
 */

export const SANDBOX_SCHEMA = "sandbox";

const URL_VAR = "SANDBOX_SUPABASE_URL";
const KEY_VARS = ["SANDBOX_PUBLISHABLE_KEY", "SANDBOX_ANON_KEY"] as const;

function buildClient(url: string, key: string) {
  return createClient(url, key, {
    db: { schema: SANDBOX_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export type SandboxClient = ReturnType<typeof buildClient>;

let client: SandboxClient | null = null;

/** Names the missing variable, never its value. */
function readConfig(): { url: string; key: string } {
  const url = process.env[URL_VAR];
  if (!url) throw new Error(`${URL_VAR} is not set`);
  for (const name of KEY_VARS) {
    const key = process.env[name];
    if (key) return { url, key };
  }
  throw new Error(`${KEY_VARS.join(" or ")} is not set`);
}

export function getSandboxClient(): SandboxClient {
  if (client) return client;
  const { url, key } = readConfig();
  client = buildClient(url, key);
  return client;
}
