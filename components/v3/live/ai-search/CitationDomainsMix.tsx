"use client";

import { sliceColor } from "@/components/v3/live/ai-search/CitationPieDisc";
import type { DomainBar } from "@/lib/ai-search/citation-insights";

export function CitationDomainsMix({
  bars,
  totalDomains,
  onPickDomain,
  onShowAllDomains,
}: {
  bars: DomainBar[];
  totalDomains: number;
  onPickDomain: (domain: string) => void;
  onShowAllDomains: () => void;
}) {
  const maxLinks = Math.max(1, ...bars.map((bar) => bar.links));
  return (
      <section className="citation-card citation-card-domains ai-top-domains" data-citation-domains-mix>
        <h3 className="citation-card-kicker">Top cited domains</h3>
        {bars.length === 0 ? (
          <p className="citation-card-note">No cited domains in this view.</p>
        ) : (
          <ul className="citation-domain-bars">
            {bars.map((bar) => (
              <li key={bar.domain}>
                <button
                  type="button"
                  className="citation-domain-btn citation-chart-tip ifai-term"
                  data-ai-pick={`domain:${bar.domain}`}
                  data-domain={bar.domain}
                  data-ifai-tooltip-title={bar.domain}
                  data-ifai-tooltip-desc={`${bar.domain} was cited ${bar.links} times in ${bar.answers} answers. Source class: ${bar.classLabel}.`}
                  aria-label={`${bar.domain}: ${bar.links} links, ${bar.classLabel}.`}
                  onClick={() => onPickDomain(bar.domain)}
                >
                  <span className="citation-domain-meta">
                    <strong>{bar.domain}</strong>
                    <span>
                      {bar.classLabel} · {bar.links} links · {bar.answers} answers
                    </span>
                  </span>
                  <span
                    className="citation-domain-track"
                    role="img"
                    aria-label={`${bar.domain}: ${bar.links} links, ${bar.classLabel}.`}
                  >
                    <span
                      className="citation-domain-fill"
                      style={{
                        width: `${(100 * bar.links) / maxLinks}%`,
                        background: sliceColor(bar.sourceClass),
                      }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {totalDomains > bars.length ? (
          <button
            type="button"
            className="citation-gap-more"
            onClick={() => {
              onShowAllDomains();
              document.querySelector(".ai-citation-evidence")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            See all {totalDomains} domains in the cited-pages table
          </button>
        ) : (
          <button
            type="button"
            className="citation-gap-more"
            onClick={() =>
              document.querySelector(".ai-citation-evidence")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            Open cited-pages table
          </button>
        )}
      </section>
  );
}
