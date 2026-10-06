"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCanvas } from "@/lib/canvasData";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

const REFRESH_MS = 300_000;

export function useFenderCanvasData() {
  const [data, setData] = useState<CanvasBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastGood = useRef<CanvasBundle | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await loadCanvas();
      lastGood.current = next;
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      if (lastGood.current) setData(lastGood.current);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const stale = Boolean(error && lastGood.current);

  return {
    bundle: data,
    loading: loading && !lastGood.current,
    error,
    stale,
    refresh,
  };
}
