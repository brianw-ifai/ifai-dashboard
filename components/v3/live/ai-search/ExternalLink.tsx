"use client";

import type { ReactNode } from "react";
import { isValidCitationUrl } from "@/lib/ai-search/citations";

/** Opens a cited page in a new tab without giving it a handle on the dashboard. */
export function ExternalLink({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  if (!href || !isValidCitationUrl(href)) return <span>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" referrerPolicy="no-referrer">
      {children}
    </a>
  );
}
