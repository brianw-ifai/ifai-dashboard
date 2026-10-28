"use client";

import { AiReadinessLead } from "@/components/v3/live/AiReadinessLead";
import { FenderSpecPanel } from "@/components/v3/live/FenderSpecPanel";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

/** AI Readiness tab: share heroes, missing-fields chart, and Spec readiness by ASIN. */
export function CatalogReadinessSpec({ bundle }: { bundle: CanvasBundle }) {
  return (
    <div className="readiness-surface">
      <AiReadinessLead bundle={bundle} />
      <FenderSpecPanel missing={bundle.missing} catalogReadiness />
    </div>
  );
}
