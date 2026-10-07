"use client";

import { Suspense } from "react";
import { FenderBrandCanvas } from "@/components/v3/FenderBrandCanvas";

/** GitHub Pages / static export: canvas only, no auth shell. */
export function HomeCanvasStatic() {
  return (
    <Suspense fallback={null}>
      <FenderBrandCanvas />
    </Suspense>
  );
}
