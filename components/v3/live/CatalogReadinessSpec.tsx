"use client";

import { useState } from "react";
import { FenderSpecPanel } from "@/components/v3/live/FenderSpecPanel";
import { FenderSpecSummary } from "@/components/v3/live/FenderSpecNarratives";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

/** AI Readiness owns the missing-page filter. Machine Readability does not use this. */
export function CatalogReadinessSpec({ bundle }: { bundle: CanvasBundle }) {
  const [missingPagesOnly, setMissingPagesOnly] = useState(false);

  return (
    <>
      <FenderSpecSummary
        bundle={bundle}
        missingPageControl={{
          active: missingPagesOnly,
          onToggle: () => setMissingPagesOnly((value) => !value),
        }}
      />
      <FenderSpecPanel
        missing={bundle.missing}
        catalogReadiness
        missingPagesOnly={missingPagesOnly}
      />
    </>
  );
}
