"use client";

import { AiTerm } from "@/components/v3/live/ai-search/AiTerm";
import { CitationPieDisc, CitationPieLegend, sliceColor } from "@/components/v3/live/ai-search/CitationPieDisc";
import type { CitationPie } from "@/lib/ai-search/citation-pies";
import type { DomainBar } from "@/lib/ai-search/citation-insights";
import { pct } from "@/lib/ai-search/summary";

export function CitationDomainsMix({
  bars,
  totalDomains,
  mixPie,
  onPickDomain,
  onShowAllDomains,
}: {
  bars: DomainBar[];
  totalDomains: number;
  mixPie: CitationPie | null;
  onPickDomain: (domain: string) => void;
  onShowAllDomains: () => void;
}) {
  const maxLinks = Math.max(1, ...bars.map((bar) => bar.links));
  return (
    <div className="citation-row-domains" data-citation-domains-mix>
      <section className="citation-card citation-card-domains ai-top-domains">
        <h3 className="citation-card-kicker">Top cited domains</h3>
        {bars.length === 0 ? (
          <p className="citation-card-note">No cited domains in this view.</p>
        ) : (
          <ul className="citation-domain-bars">
            {bars.map((bar) => (
              <li key={bar.domain}>
                <button
                  type="button"
                  className="citation-domain-btn"
                  data-ai-pick={`domain:${bar.domain}`}
                  data-domain={bar.domain}
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

      <section className="citation-card citation-card-mix">
        <h3 className="citation-card-kicker">
          Source mix
        </h3>
        {mixPie == null ? (
          <p data-citation-reconcile>
            The source-mix chart is hidden because its slices do not match the cited-link total.
          </p>
        ) : mixPie.total === 0 ? (
          <p className="citation-card-note">No cited links in this view.</p>
        ) : (
          <figure className="citation-pie citation-pie-mix" data-citation-pie="classes" data-pie-total={mixPie.total}>
            <CitationPieDisc pie={mixPie} sizeClass="citation-pie-disc citation-pie-disc-mix" />
            <figcaption>
              <strong>
                Cited links by <AiTerm term="source class" />
              </strong>
              <CitationPieLegend pie={mixPie} />
              <ul className="citation-mix-pct">
                {mixPie.slices.map((slice) => (
                  <li key={slice.key}>
                    {slice.label}: {pct(slice.count, mixPie.total)}
                  </li>
                ))}
              </ul>
              <p>Slices total {mixPie.total} {mixPie.totalLabel}.</p>
            </figcaption>
          </figure>
        )}
      </section>
    </div>
  );
}
