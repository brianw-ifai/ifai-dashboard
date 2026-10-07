"use client";

import { formatInt } from "@/lib/fender-canvas/format";
import type { RetailReading } from "@/lib/fender-canvas/portfolio-retail";
import { DefinedCopy } from "@/components/v3/live/DefinedTerm";

type Coverage = { checked: number; total: number };

export function RetailFindingVisual({
  label,
  tab,
  reading,
  extra,
  coverage,
}: {
  label: string;
  tab: string;
  reading: RetailReading<unknown>;
  extra?: string | null;
  coverage?: Coverage | null;
}) {
  const showMissing = reading.status === "incomplete" || reading.status === "unavailable";
  const showBar =
    reading.status === "incomplete" && coverage != null && coverage.total > 0;
  const width = showBar ? Math.max(2, Math.min(100, (coverage.checked / coverage.total) * 100)) : 0;
  const count =
    reading.issueCount == null ? "Not stored" : formatInt(reading.issueCount);

  return (
    <div className="retail-finding" data-ifai-open="ecommerce" data-ifai-tab={tab}>
      <button type="button" className="retail-finding-hit">
        <span className="metric-card-label">{label}</span>
        <span className="metric-card-val">{count}</span>
        {extra ? <span className="metric-card-sub">{extra}</span> : null}
        {showBar ? (
          <span className="retail-coverage" aria-hidden="true">
            <span className="retail-coverage-track">
              <span className="retail-coverage-fill" style={{ width: `${width}%` }} />
            </span>
          </span>
        ) : null}
      </button>
      {showMissing && reading.missingMessage ? (
        <p className="retail-missing">
          <DefinedCopy text={reading.missingMessage} />
        </p>
      ) : null}
    </div>
  );
}
