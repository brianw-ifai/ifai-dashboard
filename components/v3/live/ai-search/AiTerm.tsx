"use client";

import type { ReactNode } from "react";
import { AI_DEFINITIONS, type AiTermKey } from "@/lib/ai-search/definitions";

/** Dotted AI Search term. Uses the shared custom tooltip, never a native title. */
export function AiTerm({ term, children }: { term: AiTermKey; children?: ReactNode }) {
  const description = AI_DEFINITIONS[term];
  const label = term.charAt(0).toUpperCase() + term.slice(1);
  return (
    <span
      className="ifai-term"
      data-ifai-tooltip-title={label}
      data-ifai-tooltip-desc={description}
      tabIndex={0}
      aria-label={`${label}: ${description}`}
    >
      {children ?? term}
    </span>
  );
}
