"use client";

import Link from "next/link";
import { useState } from "react";
import { routeUrl } from "@/lib/dashboard-v2/data/client-paths";

/**
 * Two cards, one per dashboard, and a side-by-side toggle that shows both routes in iframes.
 * `next/link` applies basePath on the static export; the iframe src is built from the same
 * basePath constant so both agree.
 */

export const COMPARE_CARDS = [
  {
    id: "current",
    title: "Current dashboard",
    href: "/dashboard",
    sentence: "The live canvas as it runs today, reading production.",
  },
  {
    id: "v2",
    title: "Dashboard v2",
    href: "/dashboard-v2",
    sentence: "The new reading model: every figure opens to its registry row, and a missing input says unavailable.",
  },
] as const;

const style = `
.cmp { min-height: 100%; display: grid; grid-template-rows: auto 1fr; gap: 16px; padding: 24px 16px; max-width: 1400px; margin: 0 auto; box-sizing: border-box; }
.cmp-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.cmp-title { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
.cmp-toggle { appearance: none; border: 1px solid #c9c9d6; background: #fff; color: #16161a; font: inherit; font-size: 13px; padding: 8px 14px; border-radius: 999px; cursor: pointer; }
.cmp-toggle[aria-pressed="true"] { background: #4b45c6; border-color: #4b45c6; color: #fff; }
.cmp-toggle:focus-visible { outline: 2px solid #4b45c6; outline-offset: 2px; }
.cmp-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-content: start; }
.cmp-card { display: grid; gap: 8px; padding: 18px; border: 1px solid #e2e2ea; border-radius: 16px; background: #fff; }
.cmp-card h2 { margin: 0; font-size: 16px; }
.cmp-card p { margin: 0; font-size: 13.5px; line-height: 1.5; color: #4a4a57; }
.cmp-card a { font-size: 13.5px; font-weight: 600; }
.cmp-side { display: grid; gap: 10px; min-height: 0; }
.cmp-note { margin: 0; font-size: 12.5px; color: #4a4a57; }
.cmp-frames { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 70vh; }
.cmp-frame { display: grid; grid-template-rows: auto 1fr; gap: 6px; min-width: 0; }
.cmp-frame-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13px; }
.cmp-frame-head strong { font-weight: 600; }
.cmp-frame iframe { width: 100%; height: 100%; min-height: 70vh; border: 1px solid #e2e2ea; border-radius: 12px; background: #fff; }
@media (max-width: 900px) { .cmp-frames { grid-template-columns: 1fr; } }
`;

export function CompareView() {
  const [sideBySide, setSideBySide] = useState(false);

  return (
    <main className="cmp">
      <style>{style}</style>
      <header className="cmp-head">
        <h1 className="cmp-title">Compare dashboards</h1>
        <button
          type="button"
          className="cmp-toggle"
          aria-pressed={sideBySide}
          onClick={() => setSideBySide((open) => !open)}
          data-testid="side-by-side-toggle"
        >
          {sideBySide ? "Show the cards" : "Side by side"}
        </button>
      </header>

      {sideBySide ? (
        <section className="cmp-side" aria-label="Both dashboards side by side">
          <p className="cmp-note">Each dashboard is shown at half width here; open either one full size from the link above its frame.</p>
          <div className="cmp-frames">
            {COMPARE_CARDS.map((card) => (
              <div className="cmp-frame" key={card.id} data-testid={`frame-${card.id}`}>
                <div className="cmp-frame-head">
                  <strong>{card.title}</strong>
                  <Link href={card.href}>Open full size</Link>
                </div>
                <iframe src={routeUrl(card.href)} title={card.title} loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="cmp-cards" aria-label="Dashboards">
          {COMPARE_CARDS.map((card) => (
            <article className="cmp-card" key={card.id} data-testid={`card-${card.id}`}>
              <h2>{card.title}</h2>
              <p>{card.sentence}</p>
              <Link href={card.href}>Open {card.title}</Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
