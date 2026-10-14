"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { loadFindabilityRead, type FindabilityClient } from "@/lib/findability/queries";
import type { FindabilityRead } from "@/lib/findability/copy";
import { getCanvasSupabase } from "@/lib/supabase/canvas-client";

const REFRESH_MS = 300_000;

const FindabilityContext = createContext<FindabilityRead>({ phase: "loading" });

/** Reads public.canvas_spec_findability. A later failed refresh keeps the last good rows. */
export function useFindabilityRead(): FindabilityRead {
  const [read, setRead] = useState<FindabilityRead>({ phase: "loading" });
  const lastGood = useRef<FindabilityRead | null>(null);

  const refresh = useCallback(async () => {
    let next: FindabilityRead;
    try {
      next = await loadFindabilityRead(getCanvasSupabase() as unknown as FindabilityClient);
    } catch (error) {
      next = { phase: "error", message: error instanceof Error ? error.message : String(error) };
    }
    if (next.phase === "error" && lastGood.current?.phase === "ready") {
      setRead(lastGood.current);
      return;
    }
    if (next.phase === "ready") lastGood.current = next;
    setRead(next);
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return read;
}

export function FindabilityProvider({ read, children }: { read: FindabilityRead; children: ReactNode }) {
  return <FindabilityContext.Provider value={read}>{children}</FindabilityContext.Provider>;
}

export function useFindability(): FindabilityRead {
  return useContext(FindabilityContext);
}
