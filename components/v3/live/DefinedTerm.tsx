"use client";

import { Fragment, type ReactNode } from "react";
import { fenderGlossary } from "@/components/v3/glossary";

const TERMS = Object.keys(fenderGlossary).sort((a, b) => b.length - a.length);

export function DefinedTerm({ term }: { term: string }) {
  const description = fenderGlossary[term];
  if (!description) return <span>{term}</span>;
  return (
    <span
      className="ifai-term"
      data-ifai-tooltip-title={term}
      data-ifai-tooltip-desc={description}
      tabIndex={0}
      aria-label={`${term}: ${description}`}
    >
      {term}
    </span>
  );
}

function findTerm(text: string): { term: string; index: number } | null {
  let best: { term: string; index: number } | null = null;
  for (const term of TERMS) {
    const match = new RegExp(`(?:^|[^A-Za-z0-9])(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![A-Za-z0-9])`).exec(
      text,
    );
    if (!match || match.index == null) continue;
    const index = match.index + match[0].length - match[1].length;
    if (!best || index < best.index) best = { term, index };
  }
  return best;
}

/** Marks glossary terms in stored reading copy. */
export function DefinedCopy({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest) {
    const hit = findTerm(rest);
    if (!hit) {
      parts.push(rest);
      break;
    }
    if (hit.index > 0) parts.push(rest.slice(0, hit.index));
    parts.push(<DefinedTerm key={`${hit.term}-${key}`} term={hit.term} />);
    key += 1;
    rest = rest.slice(hit.index + hit.term.length);
  }
  return <Fragment>{parts}</Fragment>;
}
