"use client";

import { useEffect, useState } from "react";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import { loadPortfolioRetailSnapshot } from "@/lib/fender-canvas/portfolio-retail-queries";

export function usePortfolioRetailSnapshot(): RetailCanvasRead {
  const [read, setRead] = useState<RetailCanvasRead>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadPortfolioRetailSnapshot()
      .then((snapshot) => {
        if (!cancelled) setRead({ phase: "ready", snapshot });
      })
      .catch(() => {
        if (!cancelled) setRead({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return read;
}
